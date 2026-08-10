# Phase 37 performance validation

`tests/unit/phase37-performance.test.ts` measures deterministic in-process Yard
transformations for 50 live vehicles, 250 vehicle/trailer search records, 1,000
appointments, 100 docks, and 10,000 loading scan events. The test also covers
queue recomputation, wall aggregation, chronological replay, and search/filtering.

The test prints the elapsed wall-clock time for each transformation. These
measurements are local regression budgets; they are not production throughput,
database latency, concurrency, or hardware-integration claims.
