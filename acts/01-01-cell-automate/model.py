from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid

from agent import CellAgent, AgentState


class Environment(Model):
    def __init__(self, seed, num_alive_cells):
        super().__init__(seed=seed)

        self.running = True

        self.dim = 50
        self.space = OrthogonalMooreGrid((self.dim, self.dim), capacity=1, torus=False)

        alive_cells = self.random.sample(range(self.dim), k=num_alive_cells)
        cells_state = (
            AgentState.ALIVE if i in alive_cells and n == (self.dim - 1) else AgentState.DEAD
            for i in range(self.dim)
            for n in range(self.dim)
        )

        for state, cell in zip(cells_state, self.space.all_cells):
            CellAgent(
                self,
                cell,
                initial_state=state
            )

    def step(self) -> None:
        self.agents.do(CellAgent.calc_next_state)
        self.agents.do(CellAgent.assume_step)

        if self.steps >= self.dim:
            self.running = False

