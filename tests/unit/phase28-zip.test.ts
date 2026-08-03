import { describe, expect, it } from "vitest";
import { askFleetZip } from "@/lib/fleet-intelligence";

describe("Phase 28 ZIP persisted evidence", () => {
  it("explains a persisted assessment with an authorised citation", () => {
    const response = askFleetZip({
      requestId: "phase28-persisted-1",
      question: "Why is the vehicle health score low?",
      chunks: [
        {
          id: "evidence-1",
          documentId: "vehicle_health_assessments:assessment-1",
          documentVersionId: "feature-v1",
          title: "Vehicle assessment evidence · 2026-07-01 to 2026-07-31",
          text: "Battery voltage and recurring diagnostic evidence contributed to the assessment. Unknown: no tyre inspection was available.",
          allowed: true,
          dataClassification: "internal",
        },
      ],
    });
    expect(response.state).toBe("available");
    expect(response.citations[0]).toMatchObject({
      documentId: "vehicle_health_assessments:assessment-1",
    });
    expect(response.advisoryOnly).toBe(true);
  });

  it("withholds explanations when evidence is not authorised", () => {
    const response = askFleetZip({
      requestId: "phase28-denied-1",
      question: "Explain another company",
      chunks: [
        {
          id: "denied",
          documentId: "other-company",
          documentVersionId: "v1",
          title: "Denied",
          text: "Restricted",
          allowed: false,
          dataClassification: "restricted",
        },
      ],
    });
    expect(response.state).not.toBe("available");
    expect(response.citations).toHaveLength(0);
  });
});
