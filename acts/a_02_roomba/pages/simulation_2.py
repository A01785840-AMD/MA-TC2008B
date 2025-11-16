from mesa.visualization import (
    Slider,
    SolaraViz,
    SpaceRenderer,
    make_plot_component,
)
from mesa.visualization.components import AgentPortrayalStyle

from ..simulation_2.model import MultiRoombaModel
from ..simulation_2.agent import MultiRoomba, DirtPatch, Obstacle, ChargingStation


COLOR_CYCLE = [
    "tab:blue", "tab:orange", "tab:purple", "tab:red", "tab:cyan", "tab:pink", "tab:olive", "tab:brown"
]


def multi_roomba_portrayal(agent):
    if agent is None:
            return None
    style = AgentPortrayalStyle(size=60, marker="o", zorder=3)

    if isinstance(agent, MultiRoomba):
        color = COLOR_CYCLE[agent.agent_id % len(COLOR_CYCLE)]
        style.update(("color", color))
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
    "room_w": Slider("Room Width", 25, 5, 60),
    "room_h": Slider("Room Height", 25, 5, 60),
    "agents_num": Slider("Agents", 5, 1, 25),
    "initial_dirty_cells": Slider("Initial Dirty %", 30, 0, 100),
    "obstacle_cells": Slider("Obstacle %", 10, 0, 60),
    "max_execution_steps": {"type": "InputText", "value": "inf", "label": "Max Steps"},
}


def post_process_space(ax):
    ax.figure.patch.set_facecolor("#0a0a14")
    ax.set_facecolor("#0f0f1e")

    ax.set_aspect("equal", adjustable="box")
    ax.set_xticks([])
    ax.set_yticks([])

    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_visible(False)

    ax.margins(0.02)
    ax.patch.set_edgecolor("#00ff88")
    ax.patch.set_linewidth(0.6)
    ax.patch.set_alpha(0.25)


def post_process_lines(ax):
    legend = ax.legend(loc="center left", bbox_to_anchor=(1, 0.9))
    if legend is not None:
        legend.get_frame().set_facecolor("#111526")
        legend.get_frame().set_edgecolor("#2a2a3a")
        legend.get_frame().set_alpha(0.9)
        for text in legend.get_texts():
            text.set_color("#cfd3e6")

    ax.figure.patch.set_facecolor("#0a0a14")
    ax.set_facecolor("#0f0f1e")

    ax.tick_params(colors="#cfd3e6")
    ax.xaxis.label.set_color("#cfd3e6")
    ax.yaxis.label.set_color("#cfd3e6")
    ax.title.set_color("#e5e9f5")

    ax.grid(True, color="#1e2230", alpha=0.6, linestyle="--", linewidth=0.6)
    for spine in ax.spines.values():
        spine.set_color("#2a2a3a")
        spine.set_linewidth(0.6)


# Build dynamic color mapping for plot (aggregate + first few agents)
plot_colors = {"CleanedPercent": "tab:green", "TotalMoves": "tab:gray", "AvgBattery": "tab:blue"}
for i in range(4):
    plot_colors[f"Agent{i}_Moves"] = COLOR_CYCLE[i % len(COLOR_CYCLE)]

lineplot_component = make_plot_component(plot_colors, post_process=post_process_lines)

model = MultiRoombaModel()

renderer = SpaceRenderer(model, backend="matplotlib")
renderer.draw_agents(multi_roomba_portrayal)
renderer.post_process = post_process_space

Page = SolaraViz(
    model,
    renderer,
    components=[lineplot_component],  # type: ignore[arg-type]
    model_params=model_params,
    name="Roomba Simulation 2 (Multiple Agents)",
)
