from enum import Enum

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

    def upper_neighbors(self, other_cell):
        upper_row = other_cell.coordinate[1] == self.cell.coordinate[1] + 1
        adjacence_columns = abs(other_cell.coordinate[0] - self.cell.coordinate[0]) <= 1

        return upper_row and adjacence_columns

    def calc_next_state(self):
        upper_neighbors = self.cell.neighborhood.select(self.upper_neighbors)
        upper_pattern = ''.join('1' if c.agents[0].is_alive else '0' for c in upper_neighbors)

        self._next_state = self.pattern_to_state.get(upper_pattern, self.state)

    def assume_step(self):
        self.state = self._next_state


