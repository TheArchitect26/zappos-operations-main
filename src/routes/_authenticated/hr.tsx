/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import {
  calculateWorkforceReport,
  hrCapabilities,
  trainingExpiryStatus,
  type HrRole,
} from "@/lib/hr/phase18";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/hr")({
  head: () => ({ meta: [{ title: "HR & workforce — ZappOS" }] }),
  component: HrPage,
});

type Tab = "overview" | "employees" | "recruitment" | "workforce" | "compliance" | "self_service";
type Data = Record<
  | "employees"
  | "requisitions"
  | "applicants"
  | "onboarding"
  | "attendance"
  | "shifts"
  | "leave"
  | "training"
  | "medical"
  | "disciplinary"
  | "assets"
  | "assignments"
  | "expenses"
  | "performance"
  | "drivers"
  | "warehouseEmployees"
  | "crmAccounts",
  any[]
>;
const empty: Data = {
  employees: [],
  requisitions: [],
  applicants: [],
  onboarding: [],
  attendance: [],
  shifts: [],
  leave: [],
  training: [],
  medical: [],
  disciplinary: [],
  assets: [],
  assignments: [],
  expenses: [],
  performance: [],
  drivers: [],
  warehouseEmployees: [],
  crmAccounts: [],
};
const roles: HrRole[] = [
  "admin",
  "hr_manager",
  "hr_officer",
  "operations_manager",
  "fleet_manager",
  "warehouse_manager",
  "department_manager",
  "payroll_officer",
  "supervisor",
  "employee",
  "viewer",
  "driver",
];
const number = (input: unknown) => Number(input ?? 0) || 0;
const Status = ({ value }: { value?: string | null }) => (
  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
    {(value ?? "unknown").replaceAll("_", " ")}
  </span>
);
function Kpi({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: typeof UsersRound;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </Card>
  );
}

function HrPage() {
  const { activeCompany, roles: assignedRoles } = useCompany();
  const { user } = useSession();
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [clocking, setClocking] = useState(false);
  const capabilities = useMemo(() => hrCapabilities(assignedRoles as HrRole[]), [assignedRoles]);
  const hasAccess = assignedRoles.some((role) => roles.includes(role as HrRole));
  const self = useMemo(
    () => data.employees.find((employee) => employee.user_id === user?.id),
    [data.employees, user?.id],
  );
  const load = useCallback(async () => {
    if (!activeCompany || !hasAccess) {
      setData(empty);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const id = activeCompany.id;
    const results = await Promise.all([
      (supabase as any)
        .from("hr_employees")
        .select(
          "id,user_id,driver_id,first_name,last_name,employment_number,status,department_id,position_title,start_date,probation_end_date",
        )
        .eq("company_id", id)
        .order("last_name"),
      (supabase as any)
        .from("hr_requisitions")
        .select("id,title,vacancy_count,status,department_id,opened_at")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("hr_applicants")
        .select("id,first_name,last_name,status,score,requisition_id")
        .eq("company_id", id)
        .limit(100),
      (supabase as any)
        .from("hr_onboarding")
        .select(
          "id,employee_id,contract_issued,documents_submitted,identity_verified,equipment_assigned,system_access_granted,training_scheduled,medical_completed,induction_completed,employment_activated",
        )
        .eq("company_id", id),
      (supabase as any)
        .from("hr_attendance_records")
        .select("id,employee_id,work_date,clock_in_at,clock_out_at,overtime_minutes,exception_type")
        .eq("company_id", id)
        .order("work_date", { ascending: false })
        .limit(200),
      (supabase as any)
        .from("hr_shift_assignments")
        .select("id,employee_id,shift_date,starts_at,ends_at,status,assignment_area")
        .eq("company_id", id)
        .order("shift_date", { ascending: true })
        .limit(200),
      (supabase as any)
        .from("hr_leave_requests")
        .select("id,employee_id,leave_type,start_date,end_date,status")
        .eq("company_id", id)
        .order("start_date", { ascending: true }),
      (supabase as any)
        .from("hr_training_records")
        .select("id,employee_id,training_type,status,expires_at")
        .eq("company_id", id)
        .order("expires_at"),
      (supabase as any)
        .from("hr_medical_compliance")
        .select("id,employee_id,compliance_type,status,expires_at")
        .eq("company_id", id)
        .order("expires_at"),
      (supabase as any)
        .from("hr_disciplinary_cases")
        .select("id,employee_id,case_type,status,created_at")
        .eq("company_id", id)
        .limit(100),
      (supabase as any)
        .from("hr_assets")
        .select("id,asset_type,asset_tag,status")
        .eq("company_id", id),
      (supabase as any)
        .from("hr_asset_assignments")
        .select("id,asset_id,employee_id,issued_at,returned_at")
        .eq("company_id", id),
      (supabase as any)
        .from("hr_expense_claims")
        .select("id,employee_id,claim_type,amount,status,incurred_on")
        .eq("company_id", id)
        .limit(100),
      (supabase as any)
        .from("hr_performance_reviews")
        .select("id,employee_id,status,supervisor_rating,review_period_end")
        .eq("company_id", id)
        .limit(100),
      supabase
        .from("drivers")
        .select("id,full_name,status,licence_expiry,assigned_vehicle_id")
        .eq("company_id", id),
      (supabase as any)
        .from("warehouse_employees")
        .select("id,user_id,warehouse_id,employee_role,active")
        .eq("company_id", id),
      (supabase as any)
        .from("crm_accounts")
        .select("id,account_name,account_manager_id,account_status")
        .eq("company_id", id)
        .limit(100),
    ]);
    const core = results.slice(0, 14).find((result) => result.error);
    if (core?.error) {
      setError(core.error.message);
      setLoading(false);
      return;
    }
    setData({
      employees: results[0].data ?? [],
      requisitions: results[1].data ?? [],
      applicants: results[2].data ?? [],
      onboarding: results[3].data ?? [],
      attendance: results[4].data ?? [],
      shifts: results[5].data ?? [],
      leave: results[6].data ?? [],
      training: results[7].data ?? [],
      medical: results[8].data ?? [],
      disciplinary: results[9].data ?? [],
      assets: results[10].data ?? [],
      assignments: results[11].data ?? [],
      expenses: results[12].data ?? [],
      performance: results[13].data ?? [],
      drivers: results[14].data ?? [],
      warehouseEmployees: results[15].data ?? [],
      crmAccounts: results[16].data ?? [],
    });
    setLoading(false);
  }, [activeCompany, hasAccess]);
  useEffect(() => {
    void load();
  }, [load]);
  const clock = async (action: "clock_in" | "clock_out") => {
    if (!self) return;
    setClocking(true);
    const { error: rpcError } = await (supabase as any).rpc("hr_clock_attendance", {
      _employee_id: self.id,
      _action: action,
      _at: new Date().toISOString(),
    });
    setClocking(false);
    if (rpcError) toast.error(rpcError.message);
    else {
      toast.success(action === "clock_in" ? "Clock-in recorded" : "Clock-out recorded");
      void load();
    }
  };
  const metrics = useMemo(() => {
    const report = calculateWorkforceReport({
      employees: data.employees.map((e) => ({
        status: e.status,
        departmentId: e.department_id,
        startDate: e.start_date,
      })),
      attendance: data.attendance.map((a) => ({
        clockInAt: a.clock_in_at,
        clockOutAt: a.clock_out_at,
      })),
      shifts: data.shifts.map((s) => ({ status: s.status })),
    });
    const dueTraining = data.training.filter((item) =>
      ["due", "expired"].includes(trainingExpiryStatus(item.expires_at)),
    ).length;
    const expiringMedical = data.medical.filter((item) =>
      ["due", "expired"].includes(trainingExpiryStatus(item.expires_at)),
    ).length;
    const today = new Date();
    return {
      ...report,
      newHires: data.employees.filter(
        (e) => e.start_date && new Date(e.start_date).getMonth() === today.getMonth(),
      ).length,
      onLeave: data.employees.filter((e) => e.status === "leave").length,
      contractsExpiring: data.employees.filter(
        (e) =>
          e.probation_end_date &&
          new Date(e.probation_end_date) < new Date(today.getTime() + 30 * 864e5),
      ).length,
      dueTraining,
      expiringMedical,
      licencesExpiring: data.drivers.filter(
        (d) => trainingExpiryStatus(d.licence_expiry) !== "valid",
      ).length,
      disciplinary: data.disciplinary.filter((item) => item.status !== "closed").length,
      openPositions: data.requisitions.filter((item) => ["approved", "open"].includes(item.status))
        .length,
      vacancies: data.requisitions.reduce((sum, item) => sum + number(item.vacancy_count), 0),
      pendingLeave: data.leave.filter((item) =>
        ["requested", "manager_approved"].includes(item.status),
      ).length,
    };
  }, [data]);
  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <LoadingState label="Loading workforce operations" />
      </div>
    );
  if (!hasAccess || !capabilities.canRead)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="HR access is restricted"
          description="This role has no workforce management access."
        />
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState title="Could not load HR" description={error} onAction={() => void load()} />
      </div>
    );
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "employees", label: "Employees" },
    { id: "recruitment", label: "Recruitment" },
    { id: "workforce", label: "Workforce" },
    { id: "compliance", label: "Compliance" },
    { id: "self_service", label: "Self-service" },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            HR & workforce
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Workforce operations</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Company-scoped recruitment, employment, shifts, compliance, and employee self-service.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh live data
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? "default" : "outline"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Total employees"
              value={String(metrics.totalEmployees)}
              detail={`${metrics.activeEmployees} active`}
              icon={UsersRound}
            />
            <Kpi
              label="New hires"
              value={String(metrics.newHires)}
              detail={`${metrics.onLeave} on leave`}
              icon={BriefcaseBusiness}
            />
            <Kpi
              label="Training due"
              value={String(metrics.dueTraining)}
              detail={`${metrics.expiringMedical} medicals expiring`}
              icon={ShieldCheck}
            />
            <Kpi
              label="Driver compliance"
              value={String(metrics.licencesExpiring)}
              detail="Licences not currently valid"
              icon={AlertTriangle}
            />
            <Kpi
              label="Attendance rate"
              value={`${metrics.attendanceRate}%`}
              detail="Completed attendance records"
              icon={ClipboardCheck}
            />
            <Kpi
              label="Shift coverage"
              value={String(metrics.shiftCoverage)}
              detail={`${metrics.pendingLeave} leave requests pending`}
              icon={CalendarDays}
            />
            <Kpi
              label="Open recruitment"
              value={String(metrics.openPositions)}
              detail={`${metrics.vacancies} vacancies`}
              icon={BriefcaseBusiness}
            />
            <Kpi
              label="Disciplinary cases"
              value={String(metrics.disciplinary)}
              detail={`${metrics.contractsExpiring} probation/contract dates due`}
              icon={HeartPulse}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold">Operational workforce integration</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Read-only staffing context for fleet, warehouse, dispatch, CRM, and operations
                control.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Drivers</p>
                  <p className="mt-1 text-xl font-semibold">{data.drivers.length}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Warehouse operators</p>
                  <p className="mt-1 text-xl font-semibold">
                    {data.warehouseEmployees.filter((e) => e.active).length}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">CRM account managers</p>
                  <p className="mt-1 text-xl font-semibold">
                    {
                      new Set(data.crmAccounts.map((a) => a.account_manager_id).filter(Boolean))
                        .size
                    }
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Assets assigned</p>
                  <p className="mt-1 text-xl font-semibold">
                    {data.assignments.filter((a) => !a.returned_at).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Workforce alerts</h2>
              <div className="mt-4 space-y-2">
                {[
                  ...data.training.map((item) => ({
                    id: item.id,
                    label: item.training_type,
                    status: trainingExpiryStatus(item.expires_at),
                  })),
                  ...data.medical.map((item) => ({
                    id: item.id,
                    label: item.compliance_type,
                    status: trainingExpiryStatus(item.expires_at),
                  })),
                ]
                  .filter((item) => item.status !== "valid" && item.status !== "not_expiring")
                  .slice(0, 6)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium capitalize">
                        {item.label.replaceAll("_", " ")}
                      </span>
                      <Status value={item.status} />
                    </div>
                  ))}
                {metrics.dueTraining + metrics.expiringMedical === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No expiry alerts recorded.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
        </>
      ) : null}
      {tab === "employees" ? (
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold">Employee records & organizational structure</h2>
            <p className="text-sm text-muted-foreground">
              Employment numbers, reporting relationships, departments, positions, and lifecycle
              status.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Number</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3 font-medium">
                      {e.first_name} {e.last_name}
                    </td>
                    <td className="p-3 font-mono text-xs">{e.employment_number}</td>
                    <td className="p-3">{e.position_title}</td>
                    <td className="p-3">
                      <Status value={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
      {tab === "recruitment" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Requisitions & vacancies</h2>
            <div className="mt-4 space-y-2">
              {data.requisitions.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.vacancy_count} vacancy positions
                    </p>
                  </div>
                  <Status value={r.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Applicants & interviews</h2>
            <div className="mt-4 space-y-2">
              {data.applicants.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      {a.first_name} {a.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Score {a.score ?? "not scored"}</p>
                  </div>
                  <Status value={a.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "workforce" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Shifts, attendance & leave</h2>
            <div className="mt-4 space-y-2">
              {data.shifts.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium capitalize">{s.assignment_area} shift</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.starts_at).toLocaleString()}
                    </p>
                  </div>
                  <Status value={s.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Leave calendar</h2>
            <div className="mt-4 space-y-2">
              {data.leave.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium capitalize">{l.leave_type.replaceAll("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.start_date} to {l.end_date}
                    </p>
                  </div>
                  <Status value={l.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "compliance" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Training & certifications</h2>
            <div className="mt-4 space-y-2">
              {data.training.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{t.training_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {t.expires_at ?? "not recorded"}
                    </p>
                  </div>
                  <Status value={trainingExpiryStatus(t.expires_at)} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Medical & asset compliance</h2>
            <div className="mt-4 space-y-2">
              {data.medical.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium capitalize">
                      {m.compliance_type.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {m.expires_at ?? "not recorded"}
                    </p>
                  </div>
                  <Status value={m.status} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Sensitive medical documents are stored as restricted document references, never public
              paths.
            </p>
          </Card>
        </div>
      ) : null}
      {tab === "self_service" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">My employee self-service</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Profile, leave, training, certifications, expenses, assigned assets, and reviews are
              restricted to your employee record.
            </p>
            {self ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border p-3">
                  <p className="font-medium">
                    {self.first_name} {self.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {self.position_title} · {self.employment_number}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button disabled={clocking} onClick={() => void clock("clock_in")}>
                    Clock in
                  </Button>
                  <Button
                    disabled={clocking}
                    variant="outline"
                    onClick={() => void clock("clock_out")}
                  >
                    Clock out
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No employee profile is linked to this user yet.
              </p>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">My workforce records</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Leave requests</p>
                <p className="mt-1 text-xl font-semibold">
                  {self ? data.leave.filter((l) => l.employee_id === self.id).length : 0}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Training records</p>
                <p className="mt-1 text-xl font-semibold">
                  {self ? data.training.filter((t) => t.employee_id === self.id).length : 0}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Assigned assets</p>
                <p className="mt-1 text-xl font-semibold">
                  {self
                    ? data.assignments.filter((a) => a.employee_id === self.id && !a.returned_at)
                        .length
                    : 0}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Expense claims</p>
                <p className="mt-1 text-xl font-semibold">
                  {self ? data.expenses.filter((e) => e.employee_id === self.id).length : 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
