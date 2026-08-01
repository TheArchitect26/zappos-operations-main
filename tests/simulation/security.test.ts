import { describe, expect, it } from "vitest";
import { appendAudit, assertTenant, authorise } from "./assertions";
import { SIMULATION_COMPANY_ID } from "./company-fixture";
import { askZip, validateZipOperation, type ZipKnowledgeChunk } from "@/lib/zip";
describe("simulation security and integrity attacks", () => {
  it("denies cross-company records", () => {
    expect(() => assertTenant({ companyId: "another-company" })).toThrow(/cross-company/);
    expect(() => assertTenant({ companyId: SIMULATION_COMPANY_ID })).not.toThrow();
  });
  it("denies unauthorised mutations", () => {
    expect(authorise("viewer", "operations")).toBe(false);
    expect(authorise("driver", "fleet")).toBe(false);
    expect(authorise("finance", "compliance")).toBe(false);
  });
  it("models append-only audit history", () => {
    const original = Object.freeze([{ id: "audit-1" }]);
    const next = appendAudit(original, { id: "audit-2" });
    expect(original).toHaveLength(1);
    expect(next).toHaveLength(2);
  });
  it("prevents ZIP restricted retrieval and autonomous action", () => {
    const chunks: ZipKnowledgeChunk[] = [
      {
        id: "restricted",
        documentId: "sim-doc",
        documentVersionId: "v1",
        title: "Simulation payroll",
        text: "restricted salary evidence",
        allowed: true,
        dataClassification: "restricted",
      },
    ];
    const answer = askZip({
      requestId: "sim-question",
      module: "fleet",
      question: "salary evidence",
      chunks,
    });
    expect(answer.availability).toBe("unavailable");
    expect(answer.citations).toHaveLength(0);
    expect(validateZipOperation("dispatch_vehicle").allowed).toBe(false);
  });
});
