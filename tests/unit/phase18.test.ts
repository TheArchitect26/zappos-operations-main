import { describe, expect, it } from "vitest";
import {
  assignAsset,
  calculateWorkforceReport,
  completeOnboardingStep,
  hrCapabilities,
  recordAttendance,
  recruitmentDecision,
  scheduleShift,
  trainingExpiryStatus,
  transitionEmployee,
  transitionExpense,
  transitionLeave,
  validateCertification,
} from "@/lib/hr/phase18";

describe("Phase 18 HR workforce workflows", () => {
  it("enforces employee lifecycle transitions and termination reasons", () => {
    expect(transitionEmployee("applicant", "interview")).toMatchObject({ status: "interview" });
    expect(transitionEmployee("onboarding", "probation")).toMatchObject({ status: "probation" });
    expect(() => transitionEmployee("applicant", "active")).toThrow("Illegal employee");
    expect(() => transitionEmployee("active", "terminated")).toThrow("Termination");
  });

  it("requires candidate scoring before recruitment advancement", () => {
    expect(() => recruitmentDecision({ applicantStatus: "interview", outcome: "advance" })).toThrow(
      "scoring",
    );
    expect(
      recruitmentDecision({ applicantStatus: "interview", interviewScore: 82, outcome: "advance" }),
    ).toBe("offer");
  });

  it("blocks employment activation until onboarding prerequisites are complete", () => {
    const incomplete = {
      contractIssued: true,
      documentsSubmitted: true,
      identityVerified: true,
      equipmentAssigned: false,
      systemAccessGranted: true,
      trainingScheduled: true,
      medicalCompleted: true,
      inductionCompleted: true,
      employmentActivated: false,
    };
    expect(() =>
      completeOnboardingStep({ state: incomplete, step: "employmentActivated" }),
    ).toThrow("All onboarding");
  });

  it("enforces leave approvals in manager then HR order", () => {
    expect(() =>
      transitionLeave("requested", "hr_approved", {
        isEmployeeOwner: false,
        isSupervisor: false,
        isHr: true,
      }),
    ).toThrow("Illegal leave");
    expect(
      transitionLeave("requested", "manager_approved", {
        isEmployeeOwner: false,
        isSupervisor: true,
        isHr: false,
      }),
    ).toBe("manager_approved");
  });

  it("records matched attendance only", () => {
    expect(
      recordAttendance({ action: "clock_in", at: new Date("2026-07-24T08:00:00Z") }),
    ).toMatchObject({ clockOutAt: null });
    expect(() => recordAttendance({ action: "clock_out", at: new Date() })).toThrow(
      "open clock-in",
    );
  });

  it("prevents overlapping shifts", () => {
    expect(() =>
      scheduleShift({
        employeeId: "e1",
        startsAt: new Date("2026-07-24T08:00:00Z"),
        endsAt: new Date("2026-07-24T16:00:00Z"),
        existing: [
          {
            employeeId: "e1",
            startsAt: new Date("2026-07-24T12:00:00Z"),
            endsAt: new Date("2026-07-24T20:00:00Z"),
          },
        ],
      }),
    ).toThrow("overlapping");
  });

  it("reports training expiry and validates assignment certifications", () => {
    expect(trainingExpiryStatus("2026-07-23", new Date("2026-07-24"))).toBe("expired");
    expect(() =>
      validateCertification({
        certification: "driver_licence",
        expiresAt: "2026-08-01",
        assignment: "warehouse",
        now: new Date("2026-07-24"),
      }),
    ).toThrow("warehouse");
  });

  it("keeps asset assignment tenant-safe", () => {
    expect(() =>
      assignAsset({ assetStatus: "available", assetCompanyId: "a", employeeCompanyId: "b" }),
    ).toThrow("company");
    expect(
      assignAsset({ assetStatus: "available", assetCompanyId: "a", employeeCompanyId: "a" }),
    ).toBe("assigned");
  });

  it("enforces expense approvals and limited payroll access", () => {
    expect(() =>
      transitionExpense("submitted", "payroll_approved", {
        isEmployeeOwner: false,
        isSupervisor: false,
        isPayroll: true,
      }),
    ).toThrow("Illegal expense");
    expect(
      transitionExpense("manager_approved", "payroll_approved", {
        isEmployeeOwner: false,
        isSupervisor: false,
        isPayroll: true,
      }),
    ).toBe("payroll_approved");
    expect(hrCapabilities(["payroll_officer"]).canManagePerformance).toBe(false);
    expect(hrCapabilities(["driver"]).selfServiceOnly).toBe(true);
    expect(hrCapabilities(["driver"]).canRead).toBe(true);
  });

  it("calculates workforce reporting from recorded facts", () => {
    expect(
      calculateWorkforceReport({
        employees: [
          { status: "active", departmentId: "ops" },
          { status: "terminated", departmentId: "ops" },
        ],
        attendance: [{ clockInAt: "2026-07-24T08:00:00Z", clockOutAt: "2026-07-24T16:00:00Z" }],
        shifts: [{ status: "scheduled" }],
      }),
    ).toMatchObject({
      totalEmployees: 2,
      activeEmployees: 1,
      attendanceRate: 100,
      shiftCoverage: 1,
      departmentHeadcount: { ops: 1 },
    });
  });
});
