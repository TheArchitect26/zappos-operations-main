# 🌐 ZappOS Phase 22 — Fleet Digital Twin & Operational Simulation Platform

Welcome to the **Fleet Digital Twin & Operational Simulation Platform** (under `/src/lib/zapp-simulator/`).

This is a **high-fidelity, production-quality logistical simulation suite** designed to represent an entire transport enterprise operating in real time. It acts as an authentic data generator for the **Zapp Brain** cognitive reasoning engines, facilitating local benchmarking, verification, scenario stress-testing, and compliance auditing without requiring real customer live feeds.

---

## 🏗️ Core Architecture

The simulator mimics real physical and logistical variables, structured under a single coordinating core:

```
                  [ FleetDigitalTwin (engine.ts) ]
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
   [ Clock & Timeline ]   [ Environmental ]       [ Fleet Assets ]
     (clock.ts,              (weather.ts,           (vehicles.ts,
     timeline.ts)            traffic.ts,            drivers.ts)
                             cellular.ts)                |
                                                         v
                                                   [ Deliveries ]
                                                     (jobs.ts,
                                                    routes.ts)
```

### 📋 Module Registry

1. **`types.ts`**: Unified TypeScript specifications modeling transport nodes, environmental conditions, telemetry packages, and KPIs.
2. **`random.ts`**: Mulberry32-based seedable pseudo-random generator guaranteeing 100% deterministic and reproducible runs.
3. **`clock.ts`**: Simulates ticking, fast-forwarding, pausing, and custom operating playback rate multipliers.
4. **`config.ts`**: Houses standard predefined presets (e.g. `small`, `regional`, `enterprise`, `stressTest`) scaling from 10 to 10,000 trucks.
5. **`sample-data.ts`**: Presets containing realistic South African names, towns, license plates, customer hubs, and diagnostic trouble codes (DTCs).
6. **`company.ts`**: Simulates corporate structures, logistics regions, dispatch controls, and terminal counts.
7. **`vehicles.ts` & `fleet.ts`**: Models vehicle configurations (trucks, tankers, vans), mechanical wear (tyres, batteries), service overdue intervals, and fuel rates.
8. **`drivers.ts`**: Generates driver behavior types (`gentle`, `standard`, `aggressive`), fatigue accumulation, licenses, and punctuality ratings.
9. **`customers.ts` & `depots.ts`**: Models yard docking speeds, gate delays, dock waiting queues, and depot congestion indices.
10. **`routes.ts`**: Constructs transit checkpoints, tollgate cost vectors, border clearances, and cellular deadzones.
11. **`jobs.ts`**: State machine controlling cargo dispatches (`pending`, `assigned`, `active`, `completed`, `failed`).
12. **`telemetry.ts`**: Generates instantaneous coordinates, fuel levels, tachometer RPMs, voltages, and satellite signals.
13. **`device.ts`**: Simulates the Zapp Box P1 telematics device, handling backups, diagnostic logs, and tamper triggers.
14. **`fuel.ts`**: Models consumption formulas, refuelling actions, and unauthorized stationary fuel siphoning.
15. **`maintenance.ts`**: Simulates workshop checkups, labor hours, and heavy mechanical part replacements.
16. **`incidents.ts`**: Dispatches road crashes, SOS triggers, speeding alarms, and geofence deviations.
17. **`weather.ts` & `traffic.ts` & `cellular.ts`**: Simulates weather degradation, city congestion, and cellular signal attenuation (blackouts).
18. **`compliance.ts`**: Evaluates active violations (expired driver license cards, expired PrDP permits, missing COFs).
19. **`dispatcher.ts`**: Emulates supervisor response steps (acknowledging, investigating, and resolving alarms).
20. **`events.ts`**: Core pub/sub event bus coordinating telemetry, alarm, and status changes.
21. **`timeline.ts`**: Circular snapshot timeline frame buffer supporting frame scrubbing and resets.
22. **`scenarios.ts`**: Encapsulates micro-scenarios ("Heavy Rain", "Fuel Theft", "Multiple Breakdowns").
23. **`kpis.ts`**: Real-time evaluator calculating performance variables.
24. **`statistics.ts`**: Accumulator logging hourly, daily, weekly, and monthly averages.

---

## ⚡ Data Flow & Zapp Integration

```
  [ FleetDigitalTwin ]
          |
          v (Generates SimTelemetryBatch)
  [ Zapp Lightstream (Direct Stream) ]
          |
          v (Ingests telemetry & operational events)
  [ Zapp Brain Analytics Engine ]
```

### 1. Zapp Lightstream Integration
The twin outputs standard structured telemetry packages from the `streamTelemetryBatch(jobId)` interface. This directly aligns with the JSON formatting handled by the Lightstream consumer module, ensuring native, plug-and-play streaming.

### 2. Zapp Brain Core Analytics
All calculated metrics (Fleet Availability, Driver Reliability, Depot Delays) feed into the Brain's reasoning engine, allowing the Cognitive systems to discover delay vectors, recommend actions, and predict operational breakdowns.

---

## 🧪 Testing and Determinism Strategy

We validate the platform's reliability with an automated diagnostic test suite in `tests.ts`:
- **Strict Seeding**: Verifies that identical seeds produce identical random float and item choices.
- **Physical Accuracy**: Confirms that odometers and fuel levels change realistically with speed.
- **Non-Mutation Guidelines**: Tests that snapshot states do not mutate active buffers.
- **Scale and Benchmarks**: Runs stress tests measuring operating execution delays for larger vehicle sets (10 to 1,000 trucks) to maintain high frame-rates.

---

## 🚀 Extension Points

The simulator is designed to be easily extensible:
1. **Adding Custom Vehicles**: Register models in `sample-data.ts`.
2. **Altering Scenarios**: Insert customized case classes in `scenarios.ts` to trigger specific event clusters (e.g. wild strikes, border delays).
3. **New Telemetry Parameters**: Add sensor attributes to the `SimTelemetryBatch` schema inside `types.ts` and populate them in `telemetry.ts`.
