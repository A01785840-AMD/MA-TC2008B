from __future__ import annotations
from time import sleep, perf_counter
from itertools import count
from typing import Any, Literal, Type
from abc import ABC, abstractmethod
from queue import Empty as EmptyQueueException
from multiprocessing import Process, Queue as MPQueue
from functools import cached_property
from .base import BaseModel


class BaseSimulation(ABC):
    INPUT = Literal['start', 'pause', 'restart', 'terminate']
    OUTPUT = Literal['update', 'error']

    @abstractmethod
    def start(self) -> None:
        """Start the worker subprocess that runs the model loop.
        Safe to call once after construction; non-blocking.
        """
        pass

    @abstractmethod
    def send(self, cmd: INPUT) -> None:
        """Enqueue a control command to the model process.
        Supported: start, pause, restart, terminate.
        """
        pass

    @property
    @abstractmethod
    def has_pending_msg(self) -> bool:
        """Return True if there is any message ready to be read.
        Non-blocking check against the output queue.
        """
        pass

    @abstractmethod
    def msg_nowait(self) -> tuple[OUTPUT, Any] | None:
        """Fetch a single message (type, payload) if available.
        Returns None when the queue is empty; non-blocking.
        """
        pass

    @abstractmethod
    def msg(self, timeout: float = 0.1) -> tuple[OUTPUT, Any] | None:
        """Fetch a single message (type, payload) if available.
        Returns None when the queue is empty; non-blocking.
        """
        pass

    @abstractmethod
    def terminate(self, wait: bool = False) -> None:
        """Terminate the worker process gracefully or forcefully.
        If wait=True, request terminate then join; else hard-kill.
        """
        pass

    @classmethod
    @abstractmethod
    def worker(
            cls,
            mmodel: BaseModel,
            input_q: MPQueue[INPUT],
            output_q: MPQueue[tuple[OUTPUT, Any]],
            *args: Any,
            **kwargs: Any,
    ) -> None:
        """Run the simulation loop, reacting to incoming commands.
        Emits 'update' messages or 'error' with the exception object.
        """
        pass

    @property
    @abstractmethod
    def running(self) -> bool:
        """Return true if subprocess running."""
        pass


class Simulation(BaseSimulation):
    """Owns a simulation subprocess and communicates via queues.
    Sends control commands and receives periodic updates or errors.
    """
    instance: BaseSimulation | None = None  # Singleton instance for mono model for now
    __ids = count(0)

    def __new__(cls, *args: Any, **kwargs: Any) -> BaseSimulation:
        """Implement a simple singleton to keep one model process.
        Subsequent constructions return the same shared instance.
        """
        if cls.instance is None:
            cls.instance = super().__new__(cls)

        # noinspection PyTypeChecker
        return cls.instance

    def __init__(self, mmodel: Type[BaseModel], *args: Any, **kwargs: Any) -> None:
        """Prepare IPC queues and the worker process target.
        The process isn't started until start() is called.
        """
        self._id = next(Simulation.__ids)
        self._model_input: MPQueue[Simulation.INPUT] = MPQueue()
        self._model_output: MPQueue[tuple[Simulation.OUTPUT, Any]] = MPQueue()
        self._process: Process = Process(
            target=self.worker,
            args=(mmodel, self._model_input, self._model_output, *args),
            kwargs=kwargs
        )

    def start(self) -> None:
        """Start the worker subprocess that runs the model loop.
        Safe to call once after construction; non-blocking.
        """
        if self._process.is_alive():
            print("Simulation already running.")
            return

        self._process.start()
        print("Simulation Started.")

    @property
    def running(self) -> bool:
        return self._process.is_alive()

    def send(self, cmd: BaseSimulation.INPUT) -> None:
        """Enqueue a control command to the model process.
        Supported: start, pause, restart, terminate.
        """
        self._model_input.put(cmd)

    @property
    def has_pending_msg(self) -> bool:
        """Return True if there is any message ready to be read.
        Non-blocking check against the output queue.
        """
        return not self._model_output.empty()

    def msg_nowait(self) -> tuple[BaseSimulation.OUTPUT, Any] | None:
        """Fetch a single message (type, payload) if available.
        Returns None when the queue is empty; non-blocking.
        """
        try:
            return self._model_output.get_nowait()
        except EmptyQueueException:
            return None

    def msg(self, timeout: float = 0.1) -> tuple[BaseSimulation.OUTPUT, Any] | None:
        """Fetch a single message (type, payload) if available.
        Returns None when the queue is empty; non-blocking.
        """
        return self._model_output.get(timeout=timeout)

    def terminate(self, wait: bool = False) -> None:
        """Terminate the worker process gracefully or forcefully.
        If wait=True, request terminate then join; else hard-kill.
        """
        if wait:
            self._model_input.put('terminate')
            self._process.join()
        else:
            self._process.terminate()

    @classmethod
    def worker(
            cls,
            mmodel: Type[BaseModel],
            input_q: MPQueue[BaseSimulation.INPUT],
            output_q: MPQueue[tuple[BaseSimulation.OUTPUT, Any]],
            *args: Any,
            **kwargs: Any,
    ) -> None:
        """Run the simulation loop, reacting to incoming commands.
        Emits 'update' messages or 'error' with the exception object.
        """
        model = mmodel(*args, **kwargs)
        in_pause = False

        last = perf_counter()
        while True:
            while not input_q.empty():
                cmd = input_q.get_nowait()

                match cmd:
                    case 'terminate':
                        return
                    case 'pause':
                        in_pause = True
                    case 'start':
                        in_pause = False
                    case 'restart':
                        model = mmodel(*args, **kwargs)

            now = perf_counter()
            dt = now - last
            if dt <= (1 / 30):
                sleep(0.001)  # To ease busy waiting, not sure honestly
                continue

            last = now

            if in_pause:
                continue

            try:
                model.step()
            except Exception as e:  # noqa: BLE001 - intentional broad catch for worker isolation
                print(f"Error during model step: {e}")  # No error handling yet
                output_q.put(('error', e))
                continue

            output_q.put(('update', model.get_update()))

    @cached_property
    def id(self):
        return self._id


class GuardSimulation(BaseSimulation):
    """No-op stand‑in used before the real model is initialized.
    Logs calls and prevents crashes when API is used too early.
    """

    calls_num: int = 0

    def _guard(self, method: str) -> None:
        """Increment call counter and log a helpful message.
        Used internally by all stub operations.
        """
        self.calls_num += 1
        print(f"Not initialize model with {self.calls_num} calls, method: {method}")

    @classmethod
    def _static_guard(cls, method: str) -> None:
        print(f"Not initialize model with class method call, method: {method}")

    def start(self) -> None:
        """Pretend to start the model process and log the action.
        Keeps server responsive before initialization.
        """
        self._guard("start")

    @property
    def running(self) -> bool:
        return False

    # noinspection PyUnusedLocal
    def terminate(self, wait: bool = False) -> None:
        """Pretend to terminate the model process and log the action.
        Mirrors the real ModelProcess.terminate signature.
        """
        self._guard("terminate")

    # noinspection PyUnusedLocal
    def send(self, cmd: Simulation.INPUT) -> None:
        """Pretend to send a command and log the action.
        Accepts the same command literal as the real process.
        """
        self._guard("send")

    @property
    def has_pending_msg(self) -> bool:
        """Always report no pending messages in guard mode.
        Prevents polling loops from spinning on empty queues.
        """
        self._guard("has_pending_msg")
        return False

    def msg_nowait(self) -> tuple[Simulation.OUTPUT, Any] | None:
        """Return no message in guard mode to signal emptiness.
        Mirrors the non-blocking queue accessor on ModelProcess.
        """
        self._guard("msg_nowait")
        sleep(1)
        return None

    # noinspection PyUnusedLocal
    def msg(self, timeout: float | None = 0.1) -> tuple[Simulation.OUTPUT, Any] | None:
        """Blocking or timeout-aware message getter in guard mode.
        Matches ModelProcess.msg signature so callers don't need guards.
        """
        self._guard("msg")
        if timeout is None:
            timeout = 0.1

        sleep(max(timeout, 1))
        return None

    @classmethod
    def worker(cls,
               input_q: MPQueue[Simulation.INPUT],
               output_q: MPQueue[tuple[Simulation.OUTPUT, Any]],
               *args: Any,
               **kwargs: Any) -> None:
        cls._static_guard("Worker")
        return None
