export type EmployeeStatus =
  | "applicant"
  | "interview"
  | "offer"
  | "accepted"
  | "onboarding"
  | "active"
  | "probation"
  | "suspended"
  | "leave"
  | "terminated"
  | "retired"
  | "archived";
export type LeaveStatus =
  "requested" | "manager_approved" | "hr_approved" | "rejected" | "cancelled" | "completed";
export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "manager_approved"
  | "payroll_approved"
  | "rejected"
  | "paid"
  | "archived";
export type HrRole =
  | "admin"
  | "hr_manager"
  | "hr_officer"
  | "operations_manager"
  | "fleet_manager"
  | "warehouse_manager"
  | "department_manager"
  | "payroll_officer"
  | "supervisor"
  | "employee"
  | "viewer"
  | "driver";

const employeeTransitions: Record<EmployeeStatus, readonly EmployeeStatus[]> = {
  applicant: ["interview", "archived"],
  interview: ["offer", "archived"],
  offer: ["accepted", "archived"],
  accepted: ["onboarding"],
  onboarding: ["active", "probation", "archived"],
  active: ["probation", "suspended", "leave", "terminated", "retired", "archived"],
  probation: ["active", "suspended", "leave", "terminated", "archived"],
  suspended: ["active", "terminated", "archived"],
  leave: ["active", "terminated", "archived"],
  terminated: ["archived"],
  retired: ["archived"],
  archived: [],
};

export function transitionEmployee(from: EmployeeStatus, to: EmployeeStatus, reason?: string) {
  if (!employeeTransitions[from].includes(to)) {
    throw new Error(`Illegal employee transition from ${from} to ${to}`);
  }
  if (to === "terminated" && !reason?.trim()) throw new Error("Termination requires a reason");
  return { status: to, terminationReason: to === "terminated" ? reason!.trim() : null };
}

export function recruitmentDecision(input: {
  applicantStatus: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  interviewScore?: number | null;
  outcome: "advance" | "reject";
}) {
  if (
    input.outcome === "advance" &&
    (input.interviewScore === null || input.interviewScore === undefined)
  ) {
    throw new Error("Candidate scoring is required before advancing");
  }
  if (input.outcome === "advance" && input.interviewScore! < 0)
    throw new Error("Candidate score is invalid");
  return input.outcome === "advance" ? "offer" : "rejected";
}

export function completeOnboardingStep(input: {
  state: Record<
    | "contractIssued"
    | "documentsSubmitted"
    | "identityVerified"
    | "equipmentAssigned"
    | "systemAccessGranted"
    | "trainingScheduled"
    | "medicalCompleted"
    | "inductionCompleted"
    | "employmentActivated",
    boolean
  >;
  step: string;
}) {
  const known = new Set([
    "contractIssued",
    "documentsSubmitted",
    "identityVerified",
    "equipmentAssigned",
    "systemAccessGranted",
    "trainingScheduled",
    "medicalCompleted",
    "inductionCompleted",
    "employmentActivated",
  ]);
  if (!known.has(input.step)) throw new Error("Unknown onboarding step");
  const next = { ...input.state };
  if (input.step === "employmentActivated") {
    const prerequisites = Object.entries(next).filter(([key]) => key !== "employmentActivated");
    if (prerequisites.some(([, complete]) => !complete)) {
      throw new Error("All onboarding steps must complete before activation");
    }
  }
  next[input.step as keyof typeof next] = true;
  return next;
}

export function transitionLeave(
  from: LeaveStatus,
  to: LeaveStatus,
  permissions: { isEmployeeOwner: boolean; isSupervisor: boolean; isHr: boolean },
) {
  const allowed =
    (from === "requested" && to === "cancelled" && permissions.isEmployeeOwner) ||
    (from === "requested" &&
      ["manager_approved", "rejected"].includes(to) &&
      permissions.isSupervisor) ||
    (from === "manager_approved" && ["hr_approved", "rejected"].includes(to) && permissions.isHr) ||
    (from === "hr_approved" && to === "completed" && permissions.isHr);
  if (!allowed) throw new Error(`Illegal leave transition from ${from} to ${to}`);
  return to;
}

export function recordAttendance(input: {
  action: "clock_in" | "clock_out";
  clockInAt?: Date | null;
  clockOutAt?: Date | null;
  at: Date;
}) {
  if (input.action === "clock_in") {
    if (input.clockInAt) throw new Error("Employee is already clocked in");
    return { clockInAt: input.at, clockOutAt: null };
  }
  if (!input.clockInAt || input.clockOutAt) throw new Error("A matching open clock-in is required");
  if (input.at < input.clockInAt) throw new Error("Clock-out cannot precede clock-in");
  return { clockInAt: input.clockInAt, clockOutAt: input.at };
}

export function scheduleShift(input: {
  employeeId: string;
  startsAt: Date;
  endsAt: Date;
  existing: Array<{ employeeId: string; startsAt: Date; endsAt: Date }>;
}) {
  if (input.endsAt <= input.startsAt) throw new Error("Shift end must follow shift start");
  const conflict = input.existing.some(
    (shift) =>
      shift.employeeId === input.employeeId &&
      input.startsAt < shift.endsAt &&
      input.endsAt > shift.startsAt,
  );
  if (conflict) throw new Error("Employee already has an overlapping shift");
  return {
    status: "scheduled" as const,
    coverageHours: (input.endsAt.getTime() - input.startsAt.getTime()) / 3_600_000,
  };
}

export function trainingExpiryStatus(expiresAt: string | null | undefined, now = new Date()) {
  if (!expiresAt) return "not_expiring" as const;
  const days = (new Date(expiresAt).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "expired" as const;
  if (days <= 30) return "due" as const;
  return "valid" as const;
}

export function validateCertification(input: {
  certification:
    | "driver_licence"
    | "pdp"
    | "forklift"
    | "dangerous_goods"
    | "first_aid"
    | "fire_fighting"
    | "defensive_driving"
    | "health_safety";
  expiresAt: string;
  assignment: "fleet" | "warehouse" | "dispatch";
  now?: Date;
}) {
  if (trainingExpiryStatus(input.expiresAt, input.now) === "expired") {
    throw new Error("An expired certification cannot support an assignment");
  }
  if (input.assignment === "warehouse" && input.certification === "driver_licence") {
    throw new Error("Driver licence alone is not a warehouse equipment certification");
  }
  return true;
}

export function assignAsset(input: {
  assetStatus: "available" | "assigned" | "returned" | "damaged" | "lost" | "retired";
  assetCompanyId: string;
  employeeCompanyId: string;
}) {
  if (input.assetCompanyId !== input.employeeCompanyId)
    throw new Error("Assets cannot cross company boundaries");
  if (input.assetStatus !== "available") throw new Error("Only available assets may be assigned");
  return "assigned" as const;
}

export function transitionExpense(
  from: ExpenseStatus,
  to: ExpenseStatus,
  permissions: { isEmployeeOwner: boolean; isSupervisor: boolean; isPayroll: boolean },
) {
  const allowed =
    (from === "draft" && to === "submitted" && permissions.isEmployeeOwner) ||
    (from === "submitted" &&
      ["manager_approved", "rejected"].includes(to) &&
      permissions.isSupervisor) ||
    (from === "manager_approved" &&
      ["payroll_approved", "rejected"].includes(to) &&
      permissions.isPayroll) ||
    (from === "payroll_approved" && to === "paid" && permissions.isPayroll);
  if (!allowed) throw new Error(`Illegal expense transition from ${from} to ${to}`);
  return to;
}

export function hrCapabilities(roles: HrRole[]) {
  const has = (role: HrRole) => roles.includes(role);
  const hr = has("admin") || has("hr_manager") || has("hr_officer");
  const supervisor =
    hr ||
    has("operations_manager") ||
    has("fleet_manager") ||
    has("warehouse_manager") ||
    has("department_manager") ||
    has("supervisor");
  return {
    canRead: roles.length > 0,
    canManageHr: hr,
    canSupervise: supervisor,
    canViewPayroll: has("admin") || has("hr_manager") || has("payroll_officer"),
    selfServiceOnly: (has("employee") || has("driver")) && !hr && !supervisor,
    canManagePerformance: hr || has("department_manager") || has("supervisor"),
  };
}

export function calculateWorkforceReport(input: {
  employees: Array<{
    status: EmployeeStatus;
    departmentId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  attendance: Array<{ clockInAt?: string | null; clockOutAt?: string | null }>;
  shifts: Array<{ status: string }>;
  now?: Date;
}) {
  const active = input.employees.filter((employee) =>
    ["active", "probation", "leave", "suspended"].includes(employee.status),
  );
  const attendanceRate = input.attendance.length
    ? Math.round(
        (input.attendance.filter((item) => item.clockInAt && item.clockOutAt).length /
          input.attendance.length) *
          100,
      )
    : 0;
  const departmentHeadcount = new Map<string, number>();
  active.forEach((employee) => {
    const key = employee.departmentId ?? "unassigned";
    departmentHeadcount.set(key, (departmentHeadcount.get(key) ?? 0) + 1);
  });
  return {
    totalEmployees: input.employees.length,
    activeEmployees: active.length,
    attendanceRate,
    shiftCoverage: input.shifts.filter((shift) =>
      ["scheduled", "confirmed", "completed"].includes(shift.status),
    ).length,
    departmentHeadcount: Object.fromEntries(departmentHeadcount),
  };
}
