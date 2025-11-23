"""Traffic Simulator API server.

This module defines a Flask + Socket.IO application plus a lightweight
schema-based request parsing/validation layer implemented with Pydantic.

Key Components
--------------
* Model / ModelProcess: Mock simulation model executed in a separate
  multiprocessing.Process, emitting updates consumed by a background thread.
* Schemas: Namespaces grouping Pydantic models used to validate incoming
  request data (query params, JSON bodies, path params). The nested Parse
  helpers provide decorators that plug validation seamlessly into Flask
  view functions.
* SocketIO integration: Broadcasts simulation state updates to connected
  clients under the 'update' event.

The validation layer favors explicitness, returning HTTP 422 responses
(RFC 4918 / WebDAV 'Unprocessable Entity') when provided parameters do
not satisfy declared schemas.

All behavior remains intentionally minimal for clarity; logic SHOULD NOT
be altered by documentation/typing improvements.
"""
from __future__ import annotations

import signal
import sys
from types import FrameType

from time import sleep
from threading import Thread, Event

from flask_socketio import SocketIO
from flask import Flask, jsonify
from flask.typing import ResponseReturnValue

from .schema import Schemas
from ..model import MockModel
from .simulation import BaseSimulation, GuardSimulation, Simulation


# By Me :)
# Flask app and SocketIO setup

app: Flask = Flask("Traffic Simulator API")
app.config['SECRET_KEY'] = 'secret!'
socketio: SocketIO = SocketIO(
    app,
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
    async_mode='eventlet'
)

SIMULATION: BaseSimulation = GuardSimulation()


@app.route("/simulation/initialize", methods=["POST"])
@Schemas.Parse.query_args(Schemas.QueryArgs.SimulationInit)
def simulation_init(query_params: Schemas.QueryArgs.SimulationInit) -> ResponseReturnValue:
    """Create and start the simulation subprocess.
    """
    global SIMULATION

    actions = "initialized"
    initial_n: int = query_params.initial_agents
    limit_n: int = query_params.concurrent_agents_allowed

    SIMULATION = Simulation(MockModel, initial_n, limit_n)

    if query_params.start_simulation:
        SIMULATION.start()
        actions += " and started"

    return jsonify({"message": f"Simulation {actions} correctly.", "simulation_id": SIMULATION.id})


@app.route("/simulation/start/<int:simulation_id>", methods=["POST"])
@Schemas.Parse.path_args(Schemas.PathArgs.SimulationID)
def simulation_start(path_args: Schemas.PathArgs.SimulationID) -> ResponseReturnValue:
    """Starts the simulation subprocess.
    """
    if SIMULATION.running:
        return jsonify({"message": f"Simulation already started.", "simulation_id": path_args.simulation_id})

    SIMULATION.start()

    return jsonify({"message": f"Simulation started correctly.", "simulation_id": path_args.simulation_id})


@app.route("/simulation/pause/<int:simulation_id>", methods=["POST"])
@Schemas.Parse.path_args(Schemas.PathArgs.SimulationID)
def simulation_pause(path_args: Schemas.PathArgs.SimulationID) -> ResponseReturnValue:
    """Model pause
    """

    SIMULATION.send('pause')

    return jsonify({"message": "Model pause correctly.", 'simulation_id': path_args.simulation_id})


@app.route("/simulation/terminate/<int:simulation_id>", methods=["POST"])
@Schemas.Parse.path_args(Schemas.PathArgs.SimulationID)
def simulation_terminate(path_args: Schemas.PathArgs.SimulationID) -> ResponseReturnValue:
    """Terminate the running model and join the process.
    Ignores simulation_id for now as multimodel is not implemented.
    """
    print(path_args.simulation_id)  # no multimodel support yet

    SIMULATION.terminate(wait=True)

    return jsonify({"simulation_terminated": path_args.simulation_id})


@socketio.on('connect')
def connect(client):
    """
    NOTE: Of course room (multicasting) support can be added later, for now lets keep it simple :)
    :param client:
    :return:
    """

    print(f'Client connected {client}')
    socketio.emit('connected', {'data': 'Connected to server'})



def server() -> None:
    """Start the SocketIO server and background update thread.
    Wires graceful termination to SIGINT/SIGTERM signals.
    """

    def sockets_updater(stop: Event) -> None:
        """Poll model output and emit socket updates.
        Stops when the provided event is set.
        """
        while True:
            if stop.is_set():
                break

            message = SIMULATION.msg_nowait()
            if message is None:
                sleep(1 / 15)  # Avoid busy waiting
                continue

            out_type, data = message

            match out_type:
                case 'update':
                    socketio.emit('update', data)
                case 'error':
                    print(f"Error from model: {data}")  # No error handling yet

            sleep(1 / 15)  # Avoid busy waiting

    stop_updated_flag: Event = Event()
    updater: Thread = Thread(target=sockets_updater, args=(stop_updated_flag,))

    # noinspection PyUnusedLocal
    def graceful_exit(signum: int, frame: FrameType | None) -> None:
        """Stop background thread, terminate model and exit.
        Designed to be used as a signal handler.
        """
        stop_updated_flag.set()

        SIMULATION.terminate(wait=True)

        if updater.is_alive():
            updater.join()

        sys.exit(0)

    signal.signal(signal.SIGINT, graceful_exit)
    signal.signal(signal.SIGTERM, graceful_exit)

    updater.start()

    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
