import math

from mesa import Model
from mesa.datacollection import DataCollector
from mesa.discrete_space import OrthogonalVonNeumannGrid

from .agent import RoombaAgent, DirtPatch, Obstacle, ChargingStation


class RoombaModel(Model):
    """Single Roomba cleaning simulation environment."""

    def __init__(
        self,
        room_w: int = 20,
        room_h: int = 20,
        initial_dirty_cells: int = 30,  # percentage
        obstacle_cells: int = 10,  # percentage
        max_execution_steps: int | str | None = None,
        seed: int | None = 42,
    ):
        super().__init__(seed=seed)

        self.width = room_w
        self.height = room_h
        self.max_execution_steps = (
            math.inf if max_execution_steps in (None, "inf", "INF") else int(max_execution_steps)
        )

        self.grid = OrthogonalVonNeumannGrid(
            [self.width, self.height], torus=False, capacity=50, random=self.random
        )

        # Metrics
        self.cleaned_dirty_cells = 0
        self.total_dirty_cells = 0
        self.time_to_clean: int | None = None

        # Place dirt patches & obstacles randomly
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
            # Avoid putting obstacle over existing dirt patch to still allow cleaning
            if not any(isinstance(a, DirtPatch) for a in cell.agents):
                Obstacle(self, cell)

        # Place charging station at [1,1] (ensure inside bounds)
        station_coord = list((min(1, self.width - 1), min(1, self.height - 1)))
        station_cell = self.grid[station_coord[0], station_coord[1]]
        ChargingStation(self, station_cell)

        # Create single Roomba
        self.roomba = RoombaAgent(self, station_cell)

        # Data collectors
        self.datacollector = DataCollector(
            model_reporters={
                "CleanedPercent": lambda m: (
                    0 if m.total_dirty_cells == 0 else m.cleaned_dirty_cells / m.total_dirty_cells * 100
                ),
                "Battery": lambda m: m.roomba.battery,
                "Moves": lambda m: m.roomba.moves,
                "TimeToClean": lambda m: m.time_to_clean if m.time_to_clean is not None else -1,
            }
        )

        self.running = True
        self.datacollector.collect(self)
        self._align_datacollector_lengths()

    def _align_datacollector_lengths(self) -> None:
        """Ensure all model_var series have the same length to avoid pandas mismatch.
        Trims longer series to the minimum length observed.
        """
        try:
            vars_dict = getattr(self.datacollector, "model_vars", None)
            if not vars_dict:
                return
            lengths = [len(v) for v in vars_dict.values()]
            if not lengths:
                return
            min_len = min(lengths)
            for k, v in list(vars_dict.items()):
                if len(v) > min_len:
                    vars_dict[k] = v[:min_len]
        except Exception:
            # Non-fatal safeguard; plotting should still work
            pass

    def step(self):
        if self.steps >= self.max_execution_steps:
            self.running = False
        if not self.running:
            return
        self.agents_by_type[RoombaAgent].do("step")
        self.datacollector.collect(self)
        self._align_datacollector_lengths()

        if self.time_to_clean is not None or self.steps >= self.max_execution_steps:
            # End simulation if cleaning done or time exceeded
            if self.time_to_clean is not None:
                self.running = False
