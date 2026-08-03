import { describe, expect, it } from "vitest";
import {
  INDUSTRY_PACKS,
  SEARCH_SOURCES,
  TERMINOLOGY_KEYS,
  quickActions,
  rankResults,
  unifiedTimeline,
  workspaceSections,
} from "../../src/lib/unified-work-experience";
import { HIGH_VALUE_SEARCH_ADAPTERS } from "../../src/lib/unified-search-adapters";

describe("Phase 29 unified work experience", () => {
  it("provides one permission-shaped role workspace", () => {
    expect(workspaceSections(["dispatcher"])).toEqual(
      expect.arrayContaining(["Active vehicles", "Delayed jobs", "Open incidents"]),
    );
    expect(workspaceSections(["hr_manager"])).toContain("Leave awaiting approval");
    expect(workspaceSections(["viewer"])).not.toContain("Financial summary");
  });

  it("covers every required universal search domain without duplicating search systems", () => {
    for (const source of [
      "vehicles",
      "drivers",
      "employees",
      "customers",
      "suppliers",
      "shipments",
      "invoices",
      "documents",
      "integrations",
      "Brain recommendations",
      "ZIP conversations",
      "support requests",
    ])
      expect(SEARCH_SOURCES).toContain(source);
    const result = {
      id: "1",
      type: "Vehicle",
      title: "ABC 123",
      status: "available",
      companyId: "c",
      metadata: "Volvo",
      path: "/vehicles",
      source: "vehicles",
    };
    expect(rankResults([result], "abc")).toEqual([result]);
    expect(rankResults([result], "private")).toEqual([]);
  });

  it("uses dedicated adapters for the prioritized high-value domains", () => {
    expect(HIGH_VALUE_SEARCH_ADAPTERS.map((adapter) => adapter.domain)).toEqual([
      "purchase orders",
      "warehouse inventory",
      "maintenance work",
      "support cases",
      "invoices",
      "documents",
      "devices",
    ]);
  });

  it("combines chronological activity into one timeline", () => {
    const base = {
      type: "Shipment",
      title: "S",
      status: "active",
      companyId: "c",
      metadata: "",
      path: "/operations",
      source: "jobs",
    };
    const timeline = unifiedTimeline([
      { ...base, id: "old", occurredAt: "2026-01-01T00:00:00Z" },
      { ...base, id: "new", occurredAt: "2026-02-01T00:00:00Z" },
    ]);
    expect(timeline.map((item) => item.id)).toEqual(["new", "old"]);
  });

  it("offers contextual actions and keeps ZIP read-only", () => {
    expect(quickActions("Vehicle")).toEqual(
      expect.arrayContaining(["Assign driver", "View tracking", "Telemetry", "Documents"]),
    );
    expect(quickActions("Customer")).toContain("Ask ZIP");
    expect(quickActions("Unknown")).not.toContain("Delete");
  });

  it("provides ten industry starter packs and configurable terminology", () => {
    expect(Object.keys(INDUSTRY_PACKS)).toHaveLength(10);
    expect(INDUSTRY_PACKS.cold_chain).toContain("compliance");
    expect(TERMINOLOGY_KEYS).toEqual(
      expect.arrayContaining([
        "jobs",
        "loads",
        "drivers",
        "customers",
        "warehouse",
        "fleet",
        "assets",
      ]),
    );
  });
});
