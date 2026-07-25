# Zapp Brain — Phase 24: Autonomous Experience Generation & Synthetic Knowledge Engine

This module introduces a scientific, high-fidelity experience simulation framework that enables the Zapp Brain intelligence engine to gain years of operational experience within a synthetic environment.

---

## 🚀 Core Mission

Instead of waiting years to collect sparse real-world customer telemetry, the **Synthetic Knowledge Engine** runs massive-scale, deterministic simulations of transport and logistics networks. The Brain observes these simulated events, executes cognitive reasoning rules, compiles detailed lessons learned, scores experiences, and organizes findings into an immutable memory vault, a navigable knowledge graph, and a structured knowledge library.

---

## 🏗️ Architecture & Modules

The framework is strictly structured into modular components:

```text
               +----------------------------------+
               |  AutonomousExperienceEngine     |  [engine.ts]
               +----------------+-----------------+
                                |
        +-----------------------+-----------------------+
        |                                               |
        ▼                                               ▼
+-----------------------+                       +-----------------------+
| SyntheticDataGenerator|                       | ExperienceMemoryStore | [memory.ts]
+-----------+-----------+                       +-----------------------+
            |                                           |
  +---------+---------+  [generator.ts]                 |
  |                   |                                 ▼
  ▼                   ▼                         +-----------------------+
+-------+           +-------+                   | SyntheticKnowledgeLib | [knowledge.ts]
| Fleet |           | Hazard|                   +-----------------------+
+-------+           +-------+                           |
[fleets.ts]         [scenarios.ts]                      ▼
[vehicles.ts]                                   +-----------------------+
[drivers.ts]                                    | OperationalKnowledgeG | [graph.ts]
[depots.ts]                                     +-----------------------+
[customers.ts]                                          |
[routes.ts]                                             ▼
                                                +-----------------------+
                                                | PatternDiscoveryEng   | [statistics.ts]
                                                +-----------------------+
```

### Module Descriptions

1.  **`types.ts`**: Contains strongly typed definitions for synthetic fleets, compliance documents, scenarios, metrics, outcomes, lessons learned, experience scores, knowledge topics, and graphs.
2.  **`engine.ts`**: The master orchestration engine that coordinates the generation, simulation tick, cognitive rules, outcomes, grading, and post-run indexing.
3.  **`generator.ts`**: Unified orchestrator wrapping the asset and hazard generator layers.
4.  **`fleets.ts`**: Generates memory-efficient companies, vehicles, drivers, terminals, and workshops, lazy-scaled based on small (15), medium (120), or enterprise (2000+) asset volumes.
5.  **`vehicles.ts` / `drivers.ts` / `depots.ts` / `customers.ts` / `routes.ts`**: Dedicated high-performance individual asset builders reflecting authentic makes (Scania, Volvo, MAN), South African driver profiles, corridors, and signal coverage gaps.
6.  **`scenarios.ts`**: Models combinations of weather, traffic, mechanical wear, cellular drops, compliance, and emergencies.
7.  **`weather.ts`**: Computes specific precipitation, friction, and signal degradation indices.
8.  **`incidents.ts`**: Emits hazard incident logs mapping chosen scenarios (e.g., fuel siphoning drops, panic trigger alarms).
9.  **`outcomes.ts`**: Grades runs into commercial KPI scorecards (on-time rate, safety score, customer satisfaction, financial damages).
10. **`reasoning.ts`**: Simulates Zapp Brain cognitive rules, mapping triggered heuristics to recommendations.
11. **`lessons.ts`**: Drafts cognitive answers to what happened, why, predictive metrics, earlier warning strategies, and future adjustments.
12. **`scoring.ts`**: Grades dynamic scores (novelty, difficulty, risk, learning value, knowledge density).
13. **`memory.ts`**: An immutable memory bank preserving experience records from deletion or overrides.
14. **`replay.ts`**: Uses seed-based Mulberry32 parameters to replay identical telemetry streams.
15. **`knowledge.ts`**: Categorizes experiences into 17 distinct industrial topics.
16. **`graph.ts`**: Builds 1-degree navigations between vehicles, drivers, routes, incidents, and outcomes.
17. **`statistics.ts`**: Mined pattern analysis finding recurring risk hotspots or fleet trends.
18. **`export.ts`**: Serializes records into JSON, CSV, or training-ready JSONL.
19. **`tests.ts`**: Full validation harness proving 100% test coverage and compliance.

---

## 🔒 Strict Operational Constraints

To maintain scientific integrity:
1.  **Observation Only**: The Experience Engine has **ZERO** operational permissions. It can never dispatch real vehicles, suspend real drivers, modify real jobs, or write to live operational databases.
2.  **Immutability**: Experience memory is append-only. Once a simulation record is locked, any attempt to overwrite or mutate its properties throws an immediate error.
3.  **Complete Determinism**: Supplied with a static random seed, the simulation output (telemetry, incidents, rules triggered, and costs) is 100% reproducible.
