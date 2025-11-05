from enum import Enum
from functools import cached_property

from mesa import Model
from mesa.discrete_space import FixedAgent


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

