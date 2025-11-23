from abc import ABC, abstractmethod
from typing import Literal, TypedDict, override
from itertools import count
from time import perf_counter

from mesa import Model as MModel, Agent


# mesa types
import numpy.typing as npt
Coordinate = tuple[int, int]
# noinspection PyTypeHints
FloatCoordinate = tuple[float, float] | npt.NDArray[float]
NetworkCoordinate = int

Position = Coordinate | FloatCoordinate | NetworkCoordinate


class BaseAgent(ABC, Agent):
    AgentTypes = Literal['main']

    def __init__(self, _type: AgentTypes, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.type: BaseAgent.AgentTypes = _type
        self._prev_state = {}  # for diff tracking

    class Serialization(TypedDict):
        id: int
        agent_type: Literal['main']
        position: tuple[int, int] | Position | None

    @abstractmethod
    def snapshot(self) -> Serialization:
        """Return full serialized version for creation or snapshots.
       Default implementation; subclasses may override to include extra fields.
        """
        # return {
        # "id": self.unique_id,
        # "type": self.type,
        # "position": self.pos,
        # "state": self.state,
        # }

    # @abstractmethod
    # def delta(self) -> dict | None:
    #     """Return dict of only changed fields since last tick, or None if no change.
    #    Default implementation; subclasses may override to include extra fields.
    #     """
    #     # delta = {}
    #     # if self.pos != self._prev_state.get("position", None):
    #     #     delta["position"] = self.pos
    #     # if self.state != self._prev_state.get("state", None):
    #     #     delta["state"] = self.state
    #     # return {"id": self.unique_id, **delta} if delta else None
    #
    # @abstractmethod
    # def commit(self):
    #     """Mark current state as baseline for next diff.
    #    Default implementation; subclasses may override to include extra fields.
    #     """
    #     # self._prev_state = {"position": self.pos}

    @property
    def changed(self) -> bool:
        return bool(self.delta())


class BaseModel(MModel, ABC):
    __ids = count(0)

    class Serialization(TypedDict):
        model_id: int
        step: int
        timestamp: float
        created: list | None
        updated: list | None
        deleted: list | None

    def __init__(self, *args, **kwargs) -> None:
        """
        event driven list
        (based on current step, new step cleans up list before starting).
        """
        super().__init__(*args, **kwargs)
        self._unique_id = next(BaseModel.__ids)
        self._created_agents = []
        self._updated_agents = []
        self._deleted_agents = []

    @abstractmethod
    def step(self) -> None:
        pass

    @property
    def created_agents(self) -> list:
        return self._created_agents

    @property
    def updated_agents(self) -> list:
        return self._updated_agents

    @property
    def deleted_agents(self) -> list:
        return self._deleted_agents

    @property
    def id(self) -> int:
        return self._unique_id

    def perform_clean_ups(self) -> None:
        self._created_agents = []
        self._updated_agents = []
        self._deleted_agents = []

    def get_update(self) -> Serialization:
        return {
            'model_id': self.id,
            'step': self.steps,
            'timestamp': perf_counter(),
            'created': self._created_agents,
            'updated': self._updated_agents,
            'deleted': self._deleted_agents
        }


class BaseModelMock(BaseModel):
    @override
    def step(self):
        pass

