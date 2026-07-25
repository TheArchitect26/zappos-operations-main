# Zapp Brain — Phase 25: Causal Intelligence, Decision Simulation & Explainable Reasoning Engine

This module introduces Phase 25 of Zapp Brain, introducing high-fidelity **Causal Reasoning, Decision Simulation, and transparent Explainable Reasoning** algorithms. 

---

## 🚀 Core Mission

Instead of traditional black-box machine learning models, Phase 25 leverages fully **deterministic, human-auditable, and replayable causal networks** to trace operational faults back to primary root causes, project cascading risk propagation across the fleet, simulate branching decision outcomes (Strategy A vs. B), and deliver transparently justified advice to human dispatchers.

---

## 🏗️ Architecture & Modules

The engine is strictly modular:

```text
               +--------------------------------------+
               |        AutonomousCausalEngine        | [engine.ts]
               +------------------+-------------------+
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        ▼                                                   ▼
+-----------------------+                           +-----------------------+
|   CausalGraphEngine   | [causal-graph.ts]         |   RootCauseAnalyzer   | [root-cause.ts]
+-----------------------+                           +-----------------------+
        |                                                   |
        ▼                                                   ▼
+-----------------------+                           +-----------------------+
|   DependencyMapper    | [dependency-map.ts]       | CounterfactualSimulat | [counterfactual.ts]
+-----------------------+                           +-----------------------+
        |                                                   |
        ▼                                                   ▼
+-----------------------+                           +-----------------------+
|  CascadingImpactEngi  | [impact.ts]               | DecisionSimulator/Tre | [simulator.ts]
+-----------------------+                           +-----------------------+ [decision-tree.ts]
        |                                                   |
        ▼                                                   ▼
+-----------------------+                           +-----------------------+
| RecommendationCompar  | [recommendation.ts]       |  ExplanationGenerator | [explanation.ts]
+-----------+-----------+                           +-----------+-----------+
            |                                                   |
            ▼                                                   ▼
+-----------------------+                           +-----------------------+
|  DecisionRankingEngi  | [scoring.ts]              |    ScenarioPlanner    | [planner.ts]
+-----------+-----------+                           +-----------+-----------+
            |                                                   |
            ▼                                                   ▼
+-----------------------+                           +-----------------------+
| ExecutiveBriefCompile | [reports.ts]              |  CausalDataExporter   | [export.ts]
+-----------------------+                           +-----------------------+
```

---

## 🔒 Strict Safety & Operational Constraints

1.  **Advisory Only**: This engine has **ZERO WRITE PERMISSIONS** across any real or simulated vehicle dispatch, driver job assignment, or customer CRM record. Everything compiled is strictly advisory; dispatcher approval remains fully mandatory.
2.  **No Black-Box Logic**: Recommendations must explicitly document why they were generated, raw diagnostic evidence used, specific cognitive rules involved, and alternatives considered.
3.  **100% Determinism**: Run results are fully replayable and deterministic based on static seed contexts.
