from enum import Enum
from functools import cached_property

from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid, FixedAgent

from mesa.visualization import SolaraViz, SpaceRenderer
from mesa.visualization.components import AgentPortrayalStyle


class AgentState(Enum):
    ALIVE = 0
    DEAD = 1


class CellAgent(FixedAgent):
    def __init__(self, host_model: Model, cell, initial_state: AgentState) -> None:
        super().__init__(host_model)

        self.cell = cell
        self.state = initial_state
        self._next_state = self.state

        self.pattern_to_state = {
            '111': AgentState.DEAD,
            '110': AgentState.ALIVE,
            '101': AgentState.DEAD,
            '100': AgentState.ALIVE,
            '011': AgentState.ALIVE,
            '010': AgentState.DEAD,
            '001': AgentState.ALIVE,
            '000': AgentState.DEAD
        }

    @property
    def is_alive(self):
        return self.state == AgentState.ALIVE

    @cached_property
    def x(self):
        return self.cell.coordinate[0]

    @cached_property
    def y(self):
        return self.cell.coordinate[1]

    @cached_property
    def _upper_y(self):
        return (self.y + 1) % self.model.grid.height

    def upper_neighbors(self, other_cell):
        other_x, other_y = other_cell.coordinate

        upper_row = other_y == self._upper_y

        adjacence_columns = (
                (other_x - self.x) % self.model.grid.width <= 1 or
                (self.x - other_x) % self.model.grid.width <= 1
        )

        return upper_row and adjacence_columns

    def calc_next_state(self):
        upper_neighbors = self.cell.neighborhood.select(self.upper_neighbors)
        upper_pattern = ''.join('1' if c.agents[0].is_alive else '0' for c in upper_neighbors)

        self._next_state = self.pattern_to_state[upper_pattern]

    def assume_step(self):
        self.state = self._next_state


class Environment(Model):
    def __init__(self, seed, num_alive_cells):
        super().__init__(seed=seed)

        self.dim = 50
        self.grid = OrthogonalMooreGrid((self.dim, self.dim), capacity=1, torus=True)

        alive_cells = self.random.sample(range(self.dim * self.dim), k=num_alive_cells)
        cells_state = (
            AgentState.ALIVE if i in alive_cells else AgentState.DEAD
            for i in range(self.dim * self.dim)
        )

        for state, cell in zip(cells_state, self.grid.all_cells):
            CellAgent(
                self,
                cell,
                initial_state=state
            )

    def step(self) -> None:
        self.agents.do(CellAgent.calc_next_state)
        self.agents.do(CellAgent.assume_step)


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
        "max": 50 * 50
    }
}

model = Environment(params["seed"]["value"], params["num_alive_cells"]["value"])
renderer = SpaceRenderer(model=model)

renderer.draw_agents(agent_portrayal=cell_agent_portrayal)
renderer.post_process = styler

page = SolaraViz(
    name="Cell Automate",
    model=model,
    model_params=params,
    renderer=renderer,
    play_intervals=1
)

# noinspection PyStatementEffect
page
