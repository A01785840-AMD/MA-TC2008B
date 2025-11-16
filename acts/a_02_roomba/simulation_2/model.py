import math
from mesa import Model
from mesa.datacollection import DataCollector
from mesa.discrete_space import OrthogonalVonNeumannGrid

from .agent import MultiRoomba, DirtPatch, Obstacle, ChargingStation


class MultiRoombaModel(Model):
    def __init__(
        self,
        room_w: int = 20,
        room_h: int = 20,
        agents_num: int = 5,
        initial_dirty_cells: int = 30,
        obstacle_cells: int = 10,
        max_execution_steps: int | str | None = None,
        seed: int | None = 42,
    ):
        super().__init__(seed=seed)

        self.width = room_w
        self.height = room_h
        self.max_execution_steps = (
            math.inf if max_execution_steps in (None, "inf", "INF") else int(max_execution_steps)
        )

        self.grid = OrthogonalVonNeumannGrid([
            self.width, self.height
        ], torus=False, capacity=50, random=self.random)

        # Metrics
        self.cleaned_dirty_cells = 0
        self.total_dirty_cells = 0
        self.time_to_clean: int | None = None

        total_cells = self.width * self.height
        dirt_target = int(total_cells * (initial_dirty_cells / 100))
        obstacle_target = int(total_cells * (obstacle_cells / 100))

        all_cells_list = list(self.grid.all_cells.cells)
        self.random.shuffle(all_cells_list)
        dirt_cells = all_cells_list[:dirt_target]
        obstacle_cells_list = all_cells_list[dirt_target:dirt_target + obstacle_target]

        for cell in dirt_cells:
            DirtPatch(self, cell)
        self.total_dirty_cells = dirt_target

        for cell in obstacle_cells_list:
            if not any(isinstance(a, DirtPatch) for a in cell.agents):
                Obstacle(self, cell)

        # Spawn agents at random positions (with charging stations)
        spawn_cells = self.random.sample(all_cells_list, k=min(agents_num, len(all_cells_list)))
        self.roombas: list[MultiRoomba] = []
        for idx, cell in enumerate(spawn_cells):
            ChargingStation(self, cell)
            agent = MultiRoomba(self, cell, agent_id=idx)
            self.roombas.append(agent)

        # DataCollector with aggregate + per-agent metrics
        def aggregate_cleaned_percent(m):
            return 0 if m.total_dirty_cells == 0 else m.cleaned_dirty_cells / m.total_dirty_cells * 100

        model_reporters = {
            "CleanedPercent": aggregate_cleaned_percent,
            "TimeToClean": lambda m: m.time_to_clean if m.time_to_clean is not None else -1,
            "TotalMoves": lambda m: sum(r.moves for r in m.roombas),
            "AvgBattery": lambda m: sum(r.battery for r in m.roombas) / len(m.roombas),
        }
        # Add per-agent reporters
        for r in range(len(self.roombas)):
            model_reporters[f"Agent{r}_Moves"] = lambda m, rid=r: m.roombas[rid].moves
            model_reporters[f"Agent{r}_Battery"] = lambda m, rid=r: m.roombas[rid].battery
            model_reporters[f"Agent{r}_CleanedCells"] = lambda m, rid=r: m.roombas[rid].cleaned_cells

        self.datacollector = DataCollector(model_reporters=model_reporters)

        self.running = True
        self.datacollector.collect(self)

    def step(self):
        if self.steps >= self.max_execution_steps:
            self.running = False
        if not self.running:
            return
        self.agents_by_type[MultiRoomba].do("step")
        self.datacollector.collect(self)

        if self.time_to_clean is not None or self.steps >= self.max_execution_steps:
            if self.time_to_clean is not None:
                self.running = False

