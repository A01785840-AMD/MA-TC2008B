from mesa.visualization import SolaraViz, SpaceRenderer
from mesa.visualization.components import AgentPortrayalStyle

from model import Environment


def cell_agent_portrayal(agent):
    return AgentPortrayalStyle(
        color="#00ff88" if agent.is_alive else '#1a1a2e',
        size=45,
        marker='s'
    )


def styler(ax):
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


params = {
    "seed": {
        "type": "InputText",
        "value": 42,
        "label": "Seed"
    },
    "num_alive_cells": {
        "type": "SliderInt",
        "value": 10,
        "label": "Initial Cells Alive",
        "min": 0,
        "max": 50
    }
}

model = Environment(params["seed"]["value"], params["num_alive_cells"]["value"])
renderer = SpaceRenderer(model=model)

renderer.draw_agents(agent_portrayal=cell_agent_portrayal)
renderer.post_process = styler

page = SolaraViz(
    name="Cell Automate 01",
    model=model,
    model_params=params,
    renderer=renderer,
    play_intervals=1
)

# noinspection PyStatementEffect
page

