from typing import List, TYPE_CHECKING

from mesa.discrete_space import CellAgent, FixedAgent

if TYPE_CHECKING:
    from .model import MultiRoombaModel


class DirtPatch(FixedAgent):
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
        self.dirty = True

    def clean(self):
        if self.dirty:
            self.dirty = False
            self.model.cleaned_dirty_cells += 1  # type: ignore[attr-defined]


class Obstacle(FixedAgent):
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell


class ChargingStation(FixedAgent):
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell


class MultiRoomba(CellAgent):
    def __init__(self, model: 'MultiRoombaModel', cell, agent_id: int, low_battery_threshold: int = 20):
        super().__init__(model)
        self.cell = cell
        self.agent_id = agent_id
        self.battery = 100
        self.low_battery_threshold = low_battery_threshold
        self.moves = 0
        self.cleaned_cells = 0
        self.home_station_cell = cell

    def on_station(self):
        return any(isinstance(a, ChargingStation) for a in self.cell.agents)

    def current_dirt(self) -> DirtPatch | None:
        for a in self.cell.agents:
            if isinstance(a, DirtPatch) and a.dirty:
                return a
        return None

    def obstacles_in_cell(self, cell) -> bool:
        return any(isinstance(a, Obstacle) for a in cell.agents)

    def stations(self) -> List[ChargingStation]:
        return list(self.model.agents_by_type[ChargingStation])

    def manhattan(self, a, b):
        ax, ay = a.coordinate
        bx, by = b.coordinate
        return abs(ax - bx) + abs(ay - by)

    def nearest_station_cell(self):
        sts = self.stations()
        if not sts:
            return None
        return min((s.cell for s in sts), key=lambda c: self.manhattan(self.cell, c))

    def step_toward(self, target_cell):
        if target_cell is None:
            return False
        tx, ty = target_cell.coordinate
        sx, sy = self.cell.coordinate
        candidates = []
        if tx > sx:
            candidates.append((sx + 1, sy))
        elif tx < sx:
            candidates.append((sx - 1, sy))
        if ty > sy:
            candidates.append((sx, sy + 1))
        elif ty < sy:
            candidates.append((sx, sy - 1))
        valid = []
        for coord in candidates:
            x, y = coord
            if 0 <= x < self.model.width and 0 <= y < self.model.height:
                cell = self.model.grid[x, y]
                if cell is not None and not self.obstacles_in_cell(cell):
                    valid.append(cell)
        if not valid:
            return False
        chosen = self.random.choice(valid)
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
        if chosen and chosen is not self.cell:
            self.cell = chosen
            self.moves += 1
            self.battery -= 1
            return True
        return False

    def recharge(self):
        if self.on_station() and self.battery < 100:
            self.battery = min(100, self.battery + 5)
            return True
        return False

    def low_battery(self):
        if self.battery <= self.low_battery_threshold and not self.on_station():
            return self.step_toward(self.nearest_station_cell())
        return False

    def clean(self):
        dirt = self.current_dirt()
        if dirt:
            dirt.clean()
            self.cleaned_cells += 1
            self.battery -= 1
            return True
        return False

    def explore(self):
        return self.random_move()

    def step(self):
        if self.battery <= 0 and not self.on_station():
            return
        if self.recharge():
            return
        if self.low_battery():
            return
        if self.clean():
            return
        self.explore()

        if self.model.cleaned_dirty_cells >= self.model.total_dirty_cells:  # type: ignore[attr-defined]
            if self.model.time_to_clean is None:
                self.model.time_to_clean = self.model.steps
            self.model.running = False
