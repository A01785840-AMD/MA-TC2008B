from mesa.visualization import (
    Slider,
    SolaraViz,
    SpaceRenderer,
    make_plot_component,  # added back for plotting
)
from mesa.visualization.components import AgentPortrayalStyle

from ..simulation_1.model import RoombaModel
from ..simulation_1.agent import RoombaAgent, DirtPatch, Obstacle, ChargingStation


def roomba_portrayal(agent):
    if agent is None:
        return None

    style = AgentPortrayalStyle(size=60, marker="o", zorder=3)

    if isinstance(agent, RoombaAgent):
        style.update(("color", "tab:blue"))
        style.update(("marker", "o"))
    elif isinstance(agent, DirtPatch):
        if agent.dirty:
            style.update(("color", "sienna"), ("marker", "s"), ("size", 80), ("zorder", 1))
        else:
            style.update(("color", "lightgray"), ("marker", "s"), ("size", 60), ("zorder", 1))
    elif isinstance(agent, Obstacle):
        style.update(("color", "black"), ("marker", "X"), ("size", 80), ("zorder", 2))
    elif isinstance(agent, ChargingStation):
        style.update(("color", "green"), ("marker", "D"), ("size", 90), ("zorder", 0))

    return style


model_params = {
    "seed": {"type": "InputText", "value": 42, "label": "Random Seed"},
    "room_w": Slider("Room Width", 20, 5, 50),
    "room_h": Slider("Room Height", 20, 5, 50),
    "initial_dirty_cells": Slider("Initial Dirty %", 30, 0, 100),
    "obstacle_cells": Slider("Obstacle %", 10, 0, 60),
    "max_execution_steps": {"type": "InputText", "value": "inf", "label": "Max Steps"},
}


def post_process_space(ax):
    ax.set_facecolor('#0f0f1e')
    ax.figure.patch.set_facecolor('#0a0a14')

    ax.set_aspect("equal", adjustable="box")

    ax.set_xticks([])
    ax.set_yticks([])

    ax.grid(False)
    ax.xaxis.grid(False)
    ax.yaxis.grid(False)

    for spine in ax.spines.values():
        spine.set_visible(False)

    ax.margins(0.02)

    ax.patch.set_edgecolor('#00ff88')
    ax.patch.set_linewidth(0.5)
    ax.patch.set_alpha(0.3)


def post_process_lines(ax):
    ax.legend(loc="center left", bbox_to_anchor=(1, 0.9))


    ax.set_facecolor('#0f0f1e')
    ax.figure.patch.set_facecolor('#0a0a14')

    # ax.set_aspect("equal", adjustable="box")

    ax.set_xticks([])
    ax.set_yticks([])

    ax.grid(False)
    # ax.xaxis.grid(False)
    # ax.yaxis.grid(False)

    # for spine in ax.spines.values():
    #     spine.set_visible(False)
    #
    # ax.margins(0.02)
    #
    # ax.patch.set_edgecolor('#00ff88')
    # ax.patch.set_linewidth(0.5)
    # ax.patch.set_alpha(0.3)

# Instantiate default model for initial render
model = RoombaModel()

renderer = SpaceRenderer(model, backend="matplotlib")
renderer.draw_agents(roomba_portrayal)
renderer.post_process = post_process_space

lineplot_component = make_plot_component(
    {
        "CleanedPercent": "tab:green",
        "Battery": "tab:blue",
        "Moves": "tab:purple",
    },
    post_process=post_process_lines,
)

Page = SolaraViz(
    model,
    renderer,
    components=[lineplot_component],  # type: ignore[arg-type]
    model_params=model_params,
    name="Roomba Simulation 1 (Single Agent)",
)
