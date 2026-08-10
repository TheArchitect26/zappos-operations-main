import { describe, expect, it } from "vitest";
import { customerAnalytics, deriveCustomerMilestones } from "@/lib/customer-visibility/phase38";

const measured = <T>(label: string, operation: () => T) => {
  const start = performance.now();
  const result = operation();
  const elapsed = performance.now() - start;
  console.info(`[phase38-performance] ${label}: ${elapsed.toFixed(3)}ms (in-process)`);
  return { result, elapsed };
};
describe("Phase 38 bounded customer transformations", () => {
  it.each([1, 100])("transforms %i customer shipments", (count) => {
    const { result, elapsed } = measured(`${count} shipments`, () =>
      Array.from({ length: count }, (_, i) =>
        deriveCustomerMilestones({
          status: i % 3 ? "in_progress" : "completed",
          vehicleAssigned: true,
        }),
      ),
    );
    expect(result).toHaveLength(count);
    expect(elapsed).toBeLessThan(100);
  });
  it("transforms 1,000 shipment history records", () => {
    const { result, elapsed } = measured("1,000 history records", () =>
      Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        at: new Date(1_700_000_000_000 + i * 1000).toISOString(),
      })).sort((a, b) => a.at.localeCompare(b.at)),
    );
    expect(result).toHaveLength(1000);
    expect(elapsed).toBeLessThan(150);
  });
  it("replays 10,000 authorised timeline events", () => {
    const { result, elapsed } = measured("10,000 authorised events", () =>
      Array.from({ length: 10_000 }, (_, i) => ({
        sequence: 10_000 - i,
        customerSafe: i % 2 === 0,
      }))
        .filter((x) => x.customerSafe)
        .sort((a, b) => a.sequence - b.sequence),
    );
    expect(result).toHaveLength(5000);
    expect(elapsed).toBeLessThan(300);
  });
  it("aggregates analytics, tracking refresh, notifications, search and documents within bounded pages", () => {
    const shipments = Array.from({ length: 100 }, (_, i) => ({
      reference: `S-${i}`,
      onTime: i % 2 === 0,
      durationHours: i % 8,
      delayed: i % 5 === 0,
      podAvailable: i % 3 === 0,
      support: i % 7 === 0,
    }));
    const notifications = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      state: i % 4 === 0 ? "failed" : "delivered",
    }));
    const documents = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `POD ${i}` }));
    const { result, elapsed } = measured("bounded composite customer page", () => ({
      analytics: customerAnalytics(shipments),
      refresh: shipments.slice(0, 25),
      notifications: notifications.slice(0, 50),
      search: shipments.filter((x) => x.reference.includes("2")).slice(0, 25),
      documents: documents.slice(0, 50),
    }));
    expect(result.refresh).toHaveLength(25);
    expect(result.notifications).toHaveLength(50);
    expect(result.documents).toHaveLength(50);
    expect(elapsed).toBeLessThan(100);
  });
});
