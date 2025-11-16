from typing import List, TYPE_CHECKING

from mesa.discrete_space import CellAgent, FixedAgent

if TYPE_CHECKING:  # avoid circular import at runtime
    from .model import RoombaModel


class DirtPatch(FixedAgent):
    """Represents a patch of dirt that can be cleaned by a Roomba."""

    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
        self.dirty = True  # Initially dirty

    def clean(self):
        if self.dirty:
            self.dirty = False
            self.model.cleaned_dirty_cells += 1  # type: ignore[attr-defined]


class Obstacle(FixedAgent):
    """Represents an obstacle that blocks movement."""

    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell


class ChargingStation(FixedAgent):
    """Represents a charging station. Agents on this cell can recharge."""

    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell


class RoombaAgent(CellAgent):
    """Cleaning agent with battery and simple behavior hierarchy (subsumption).

    Behavior priority:
    1. Recharge if at station and battery < 100.
    2. Move toward nearest station if battery low (< low_battery_threshold).
    3. Clean current cell if dirty.
    4. Explore (random move to non-obstacle cell).
    """

    def __init__(self, model: 'RoombaModel', cell, low_battery_threshold: int = 20):
        super().__init__(model)
        self.cell = cell
        self.battery = 100
        self.low_battery_threshold = low_battery_threshold
        self.moves = 0
        self._home_station_cell = cell  # Initial charging station cell reference

    # ----------------- Helper / Perception Methods -----------------
    def on_charging_station(self) -> bool:
        return any(isinstance(a, ChargingStation) for a in self.cell.agents)

    def current_dirt(self) -> DirtPatch | None:
        for a in self.cell.agents:
            if isinstance(a, DirtPatch) and a.dirty:
                return a
        return None

    def obstacles_in_cell(self, cell) -> bool:
        return any(isinstance(a, Obstacle) for a in cell.agents)

    def charging_stations(self) -> List[ChargingStation]:
        return list(self.model.agents_by_type[ChargingStation])

    # ----------------- Navigation -----------------
    def manhattan_distance(self, cell_a, cell_b) -> int:
        ax, ay = cell_a.coordinate
        bx, by = cell_b.coordinate
        return abs(ax - bx) + abs(ay - by)

    def nearest_station_cell(self):
        stations = self.charging_stations()
        if not stations:
            return None
        return min((s.cell for s in stations), key=lambda c: self.manhattan_distance(self.cell, c))

    def step_toward(self, target_cell):
        """Take one step toward target using greedy Manhattan approach avoiding obstacles."""
        if target_cell is None:
            return False
        tx, ty = target_cell.coordinate
        sx, sy = self.cell.coordinate
        candidates = []
        # Determine primary directions
        if tx > sx:
            candidates.append((sx + 1, sy))
        elif tx < sx:
            candidates.append((sx - 1, sy))
        if ty > sy:
            candidates.append((sx, sy + 1))
        elif ty < sy:
            candidates.append((sx, sy - 1))
        # If both axes aligned choose any orth direction to reduce distance
        # Filter valid neighbor cells
        valid_cells = []
        for coord in candidates:
            x, y = coord
            # bounds check against model dimensions
            if 0 <= x < self.model.width and 0 <= y < self.model.height:
                cell = self.model.grid[x, y]
                if cell is not None and not self.obstacles_in_cell(cell):
                    valid_cells.append(cell)
        if not valid_cells:
            return False
        # Choose first (deterministic) or random among valid
        chosen = self.random.choice(valid_cells)
        if chosen is not self.cell:
            self.cell = chosen
            self.moves += 1
            self.battery -= 1
            return True
        return False

    def random_move(self):
        neighbors = self.cell.neighborhood.select(lambda c: not self.obstacles_in_cell(c))
        if len(neighbors) == 0:
            return False
        chosen = neighbors.select_random_cell()
        if chosen is not None and chosen is not self.cell:
            self.cell = chosen
            self.moves += 1
            self.battery -= 1
            return True
        return False

    # ----------------- Behavior -----------------
    def recharge_behavior(self):
        if self.on_charging_station() and self.battery < 100:
            # Recharge 5% per step on station
            self.battery = min(100, self.battery + 5)
            return True  # Consumes the step (no battery cost per spec)
        return False

    def low_battery_behavior(self):
        if self.battery <= self.low_battery_threshold and not self.on_charging_station():
            target = self.nearest_station_cell()
            moved = self.step_toward(target)
            return moved
        return False

    def clean_behavior(self):
        dirt = self.current_dirt()
        if dirt:
            dirt.clean()
            # Cleaning is an action costing battery
            self.battery -= 1
            return True
        return False

    def explore_behavior(self):
        return self.random_move()

    def step(self):
        # If no battery and not at station: remain idle until recharged
        if self.battery <= 0 and not self.on_charging_station():
            return
        # Priority order
        if self.recharge_behavior():
            return
        if self.low_battery_behavior():
            return
        if self.clean_behavior():
            return
        self.explore_behavior()

        # If everything cleaned, model can mark completion
        if self.model.cleaned_dirty_cells >= self.model.total_dirty_cells:  # type: ignore[attr-defined]
            if self.model.time_to_clean is None:
                self.model.time_to_clean = self.model.steps
            self.model.running = False
