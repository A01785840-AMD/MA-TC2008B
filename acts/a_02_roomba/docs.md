# Roomba Cleaning Robot Simulations Documentation

## 1. Problem Statement (Problema)

We need to simulate autonomous cleaning robots ("Roombas") operating in a 2D discrete grid environment. Each agent
attempts to maximize cleaning coverage of randomly distributed dirt patches while managing a limited battery, navigating
around static obstacles, and using charging stations to replenish energy. Two scenarios are studied:

1. Single-agent cleaning with a fixed starting position and charging station.
2. Multi-agent cleaning with agents spawned at random positions, each with an initial charging station; agents may use
   any station.

Key questions:

- How efficiently can a single agent clean under limited energy constraints?
- How does increasing the number of agents affect cleaning time, movement cost, and resource (charging station)
  utilization? 

## 2. Proposed Solution (Propuesta de solución)

We implement two Mesa-based Agent-Based Models (ABMs): `RoombaModel` (single agent) and `MultiRoombaModel` (multiple
agents). Agents follow a lightweight subsumption architecture prioritizing battery survival and cleaning goals:

Priority order per step:

1. Recharge if on a charging station and battery < 100%.
2. Move toward nearest charging station if battery is low.
3. Clean current cell if dirty.
4. Explore (random movement) otherwise.

Both models collect time-series metrics for analysis (coverage %, moves, battery, per-agent contributions) and stop when
all dirt is cleaned or a maximum execution step limit is reached.

## 3. Agent Design (Diseño de los agentes)

### 3.1 Agent Types

| Agent            | Class             | Role                                      |
|------------------|-------------------|-------------------------------------------|
| Roomba (single)  | `RoombaAgent`     | Cleans, moves, recharges                  |
| Roomba (multi)   | `MultiRoomba`     | Same as single with per-agent tracking    |
| Dirt Patch       | `DirtPatch`       | Consumable resource; switches dirty→clean |
| Obstacle         | `Obstacle`        | Blocks movement; passive                  |
| Charging Station | `ChargingStation` | Location where agents recharge +5%/step   |

### 3.2 Objectives

- Primary: Maximize % of cleaned dirty cells before termination.
- Secondary: Avoid battery depletion (maintain autonomy), minimize unnecessary movement.

### 3.3 Actuators (Capacidad efectora)

- Movement to adjacent non-obstacle cell (Von Neumann neighborhood).
- Cleaning action (changes dirt state, consumes battery).
- Charging (restore battery if on station).

### 3.4 Sensors / Perception (Percepción)

Each Roomba perceives:

- Contents of current cell (dirt, station, obstacles).
- Non-obstacle neighbors for random exploration.
- Set of all charging stations (`agents_by_type[ChargingStation]`).
- Its own battery level & movement count.

### 3.5 Internal State

- `battery` (0–100).
- `moves` (movement action counter).
- `cleaned_cells` (multi-agent only, local contribution).
- Reference to `home_station_cell` (multi-agent) for initial spawn; can use any station.

### 3.6 Proactivity (Proactividad)

Agents take initiative to return to a station before battery depletion based on a threshold (
`low_battery_threshold = 20`). They do not wait passively until battery is critically low.

### 3.7 Reactivity (Reactividad)

Agents adapt each step: if the current cell becomes clean, they explore; if battery is low they redirect toward
charging; if on station they recharge instead of moving.

### 3.8 Social Ability (Habilidad social)

Multi-agent model exhibits implicit coordination through shared environment—no direct messaging. Potential extensions
include negotiation for charging station usage or partitioned coverage.

### 3.9 Rationality (Racionalidad)

Locally rational under given knowledge: chooses highest-priority safe action that preserves future ability to clean (
battery management precedes exploration).

### 3.10 Performance Metrics (Métricas de desempeño)

Collected via `DataCollector`:

- Global: `CleanedPercent`, `TimeToClean`, `Moves`, `Battery` (single), `TotalMoves`, `AvgBattery` (multi).
- Per-agent: `Agent{i}_Moves`, `Agent{i}_Battery`, `Agent{i}_CleanedCells` (multi).

### 3.11 Autonomy (Autonomía)

Agents decide actions purely from local perception + global list of charging stations (model-level reference) without
external commands.

## 4. Subsumption Architecture (Arquitectura de subsunción)

Layers (higher overrides lower):

1. **Recharge Layer**: If at a station and not full battery → recharge.
2. **Survival Navigation Layer**: If battery ≤ threshold and not at station → move greedily toward nearest station.
3. **Task Execution Layer**: If cell contains dirty patch → clean.
4. **Exploration Layer**: Else random movement among non-obstacle neighbors.

This simple hierarchy ensures energy management dominates cleaning priority when necessary.

## 5. Environment Characteristics (Características del ambiente)

- Grid: Orthogonal Von Neumann (non-torus), dimensions `room_w × room_h`.
- Capacity: Multiple agents/resources per cell (except conceptual obstruction by obstacles for movement).
- Dirt patches & obstacles placed randomly according to configured percentages.
- Charging stations: Single fixed at (1,1) for single-agent; one per Roomba initial spawn in multi-agent.
- Termination: All dirt cleaned OR max steps reached.

## 6. Simulation Configurations (Simulaciones)

### Simulation 1: Single Agent

- Start position & charging station: (1,1).
- One Roomba agent cleans until completion or timeout.
- Focus: Baseline coverage efficiency and energy management.

### Simulation 2: Multiple Agents

- Agents spawn at random unique cells; each spawn cell gets a charging station.
- Agents may recharge at any station (increases flexibility).
- Focus: Impact of agent count on total cleaning time, movement overhead, and per-agent fairness (battery usage,
  contributions).

## 7. Data Collected (Estadísticas)

| Metric                | Description                                  | Purpose                        |
|-----------------------|----------------------------------------------|--------------------------------|
| CleanedPercent        | % of initial dirt cleaned                    | Coverage progress              |
| TimeToClean           | Steps until full clean (or -1 if incomplete) | Completion efficiency          |
| Moves / TotalMoves    | Movement actions taken                       | Energy & path efficiency proxy |
| Battery / AvgBattery  | Current / avg battery across agents          | Energy dynamics                |
| Agent{i}_Moves        | Per-agent movement                           | Load balance                   |
| Agent{i}_CleanedCells | Contribution to cleaning                     | Fairness & effectiveness       |
| Agent{i}_Battery      | Battery state                                | Autonomy sustainability        |

## 8. Observations & Expected Trends (Observaciones)

- Increasing agents generally reduces completion time up to saturation; diminishing returns when collision for coverage
  leads to overlapping exploration.
- Movement count may rise super-linearly if agents duplicate cleaning paths (inefficiency).
- Multiple charging stations reduce downtime risk vs. single-station bottleneck.
- Low battery threshold influences risk: higher threshold → safer but potentially slower due to earlier detours.

## 9. Conclusions (Conclusiones)

The subsumption approach balances task pursuit with survivability. Battery-aware navigation prevents premature stalls.
Multi-agent deployment accelerates cleaning but introduces redundancy; smarter coordination (e.g., territorial
partitioning) would further enhance efficiency and reduce wasted movement.

## 10. Intelligent Agent Theory (Teoría del Agente Inteligente)

Below integrates the provided conceptual framework tailored to our context.

### What Makes an Agent “Intelligent”? (Resumen)

An intelligent agent autonomously perceives and acts to achieve goals, using sensors (cell contents, battery level) and
actuators (move, clean, recharge) to optimize performance.

### Core Characteristics Applied

- **Proactivity**: Roomba decides to seek charging before battery depletion.
- **Reactivity**: Immediately cleans dirty cell or switches to recharge when conditions change.
- **Social Ability**: In multi-agent scenario, indirect coordination via shared environment; potential for future
  explicit communication.
- **Rationality**: Chooses actions maximizing expected future cleaning capability under current battery constraints.

### Rationality Dimensions in Model

- Performance measure: Coverage % and completion time.
- Knowledge: Local cell contents + known stations list.
- Actions: Move, clean, recharge (and movement toward station).
- Percept sequence: Accumulated states of battery, location, cleaned status.

### PEAS Framework (Specific to Simulations)

| Component   | Simulation 1                                                | Simulation 2                                                       |
|-------------|-------------------------------------------------------------|--------------------------------------------------------------------|
| Performance | Max % cleaned; minimal steps/moves; avoid battery depletion | Same + balanced contributions, minimized overlap                   |
| Environment | 2D grid; one station; random dirt/obstacles                 | 2D grid; multiple stations; random dirt/obstacles; multiple agents |
| Actuators   | Movement; cleaning; recharging                              | Same                                                               |
| Sensors     | Cell contents; neighbors; battery; stations                 | Same + relative spatial distribution of other stations             |

## 11. Design Trade-Offs (Compromisos)

- Simplicity vs. Optimality: Greedy Manhattan return path may fail when obstacles block direct route; full pathfinding (
  A*) would be more optimal.
- Random exploration vs. systematic coverage: Simplicity chosen; systematic sweeping reduces redundancy but needs global
  planning.
- No inter-agent messaging: Reduces complexity but allows duplicated effort.

## 12. Limitations (Limitaciones)

- Agents cannot currently plan multi-step optimal paths around obstacles.
- No dirt regeneration or dynamic obstacles.
- Battery threshold static; no adaptive strategy based on distance to nearest station.

## 13. Potential Extensions (Extensiones Futuras)

- A* or D* Lite pathfinding for station return.
- Frontier-based coverage planning / territory partitioning.
- Dynamic battery threshold (distance-aware).
- Communication layer (task handoff, station load balancing).
- Visualization of per-agent heatmap (coverage areas).
- Charging station capacity limits (queuing model).

## 14. Implementation Summary (Resumen de Implementación)

- `RoombaModel`: Initializes grid, random dirt & obstacles, single station, one Roomba.
- `MultiRoombaModel`: Random spawn cells each with station, multiple Roombas, per-agent metrics.
- Agents use hierarchical decision logic; battery recharge is passive (no cost) while movement & cleaning cost 1%
  battery.
- Termination sets `time_to_clean` when complete; otherwise stops after `max_execution_steps`.

## 15. Example Parameter Effects (Ejemplos)

| Parameter                          | Increase Effect                                |
|------------------------------------|------------------------------------------------|
| `initial_dirty_cells`              | More total steps needed; longer battery cycles |
| `obstacle_cells`                   | More detours; greater movement count           |
| `agents_num` (multi)               | Faster cleaning until overlap overhead appears |
| `low_battery_threshold` (implicit) | Safer operation; possibly more station visits  |

## 16. Data Interpretation Guidelines

- Rapid early rise in `CleanedPercent` suggests efficient exploration; plateau indicates redundancy or isolated
  remaining dirt.
- High `TotalMoves` with modest coverage indicates inefficiency (loops or blockage).
- Divergence in `Agent{i}_CleanedCells` signals imbalance; consider partition strategies.

## 17. Glossary

- **Coverage**: Ratio of cleaned dirt patches to initial dirt patches.
- **Exploration**: Random movement seeking new dirty cells.
- **Subsumption**: Layered priority-based behavior selection.
- **Greedy Manhattan**: Simple heuristic step toward target reducing Manhattan distance.

## 18. References

- Russell, S. & Norvig, P. (Artificial Intelligence: A Modern Approach) – Rational agents framework.
- Brooks, R. (Subsumption architecture) – Layered control inspiration.
- Mesa Framework Documentation – ABM implementation details.

---
*Prepared for TC2008B – Modeling of Multi-Agent Systems.*

