import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardCheck,
  FileCheck2,
  HardHat,
  History,
  PackageCheck,
  Radio,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  TestTube2,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/components/operational-state";
import { StatusBadge } from "@/components/ui/status-badge-detailed";
import { useCompany } from "@/lib/company-context";
import {
  labelFitmentSource,
  rolloutTruthLabel,
  supportDiagnosticCopy,
  type ChecklistStepStatus,
  type FitmentStatus,
  type FitmentTestResult,
  type RoadTestSource,
  type RolloutStatus,
  type TestSource,
} from "@/lib/field-deployment/phase12";

export const Route = createFileRoute("/_authenticated/field-deployment")({
  head: () => ({ meta: [{ title: "Field Deployment - ZappOS" }] }),
  component: FieldDeploymentPage,
});

interface FitmentJobRow {
  id: string;
  company_id: string;
  reference: string;
  vehicle_id: string;
  device_id: string;
  sim_id: string | null;
  technician_user_id: string | null;
  supervisor_user_id: string | null;
  status: FitmentStatus;
  workflow_stage: string;
  controlled_staging: boolean;
  project_name: string | null;
  site_name: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  installation_location: string | null;
  odometer_at_fitment: number | null;
  notes: string | null;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface VehicleRow {
  id: string;
  registration: string;
}

interface MemberRow {
  user_id: string;
}

interface DeviceRow {
  id: string;
  device_type: string;
  serial_number: string;
  status: string;
  simulated: boolean;
  firmware_version: string | null;
  hardware_model: string;
  hardware_revision: string | null;
  inventory_state: string | null;
  issued_to_user_id: string | null;
  reserved_for_fitment_job_id: string | null;
}

interface SimRow {
  id: string;
  iccid: string;
  status: string;
  provider: string | null;
  assigned_device_id: string | null;
  inventory_state: string | null;
  issued_to_user_id: string | null;
  reserved_for_fitment_job_id: string | null;
}

interface ChecklistRow {
  id: string;
  fitment_job_id: string;
  step_number: number;
  title: string;
  mandatory: boolean;
  critical: boolean;
  status: ChecklistStepStatus;
  technician_notes: string | null;
  failure_reason: string | null;
  supervisor_comment: string | null;
}

interface TestRow {
  id: string;
  fitment_job_id: string;
  test_category: string;
  test_type: string;
  expected_range: string | null;
  measured_value: number | null;
  unit: string | null;
  result: FitmentTestResult;
  source: TestSource;
  critical: boolean;
  notes: string | null;
  override_reason: string | null;
  observed_at: string;
}

interface RoadTestRow {
  id: string;
  fitment_job_id: string;
  result: FitmentTestResult;
  source: RoadTestSource;
  distance_meters: number | null;
  duration_seconds: number | null;
  accepted_telemetry_count: number;
  gps_quality: string | null;
  network_drop_count: number;
  reconnect_count: number;
  technician_conclusion: string | null;
}

interface EvidenceRow {
  id: string;
  fitment_job_id: string;
  evidence_type: string;
  storage_bucket: string;
  uploaded_at: string;
  notes: string | null;
}

interface RolloutRow {
  id: string;
  name: string;
  status: RolloutStatus;
  rollout_stage: string;
  target_count: number;
  planned_start: string | null;
  approved_at: string | null;
}

interface SupportCaseRow {
  id: string;
  device_id: string | null;
  vehicle_id: string | null;
  fitment_job_id: string | null;
  priority: string;
  status: string;
  reported_issue: string;
  diagnostic_summary: string | null;
}

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  reason: string | null;
  source: string;
  created_at: string;
}

type TabId =
  | "jobs"
  | "technician"
  | "inventory"
  | "checklist"
  | "tests"
  | "review"
  | "firmware"
  | "diagnostics"
  | "audit";

const tabs: Array<{ id: TabId; label: string; icon: typeof ClipboardCheck }> = [
  { id: "jobs", label: "Fitment jobs", icon: ClipboardCheck },
  { id: "technician", label: "Technician work", icon: Smartphone },
  { id: "inventory", label: "Inventory", icon: PackageCheck },
  { id: "checklist", label: "Checklist", icon: FileCheck2 },
  { id: "tests", label: "Tests", icon: TestTube2 },
  { id: "review", label: "Supervisor", icon: ShieldCheck },
  { id: "firmware", label: "Firmware plans", icon: RotateCcw },
  { id: "diagnostics", label: "Remote diagnostics", icon: Radio },
  { id: "audit", label: "Audit", icon: History },
];

function maskIdentifier(value: string | null | undefined) {
  if (!value) return "not set";
  const compact = value.replace(/\s+/g, "");
  if (compact.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, compact.length - 4))}${compact.slice(-4)}`;
}

function relativeTime(value: string | null | undefined) {
  if (!value) return "not recorded";
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(value).toLocaleDateString();
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error)
    return String((error as { message: unknown }).message);
  return String(error);
}

function FieldDeploymentPage() {
  const { activeCompany, hasAnyRole } = useCompany();
  const activeCompanyId = activeCompany?.id;
  const canRead = hasAnyRole(["admin", "fleet_manager", "dispatcher", "technician", "viewer"]);
  const canManage = hasAnyRole(["admin", "fleet_manager"]);
  const canWork = hasAnyRole(["admin", "fleet_manager", "technician"]);
  const canTransition = canWork;
  const requestRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("jobs");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [jobs, setJobs] = useState<FitmentJobRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [sims, setSims] = useState<SimRow[]>([]);
  const [checklist, setChecklist] = useState<ChecklistRow[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [roadTests, setRoadTests] = useState<RoadTestRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [rollouts, setRollouts] = useState<RolloutRow[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCaseRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    reference: "",
    projectName: "",
    vehicleId: "",
    deviceId: "",
    technicianId: "",
    scheduledAt: "",
    siteName: "",
    notes: "",
  });

  const load = useCallback(async () => {
    if (!activeCompanyId) {
      setLoading(false);
      return;
    }
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const [
        jobResult,
        vehicleResult,
        memberResult,
        deviceResult,
        simResult,
        checklistResult,
        testResult,
        roadResult,
        evidenceResult,
        rolloutResult,
        supportResult,
        auditResult,
      ] = await Promise.all([
        supabase
          .from("device_fitment_jobs" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("updated_at", { ascending: false })
          .limit(120),
        supabase
          .from("vehicles")
          .select("id,registration")
          .eq("company_id", activeCompanyId)
          .order("registration"),
        supabase.from("company_members").select("user_id").eq("company_id", activeCompanyId),
        supabase
          .from("devices" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("device_sims" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("fitment_job_checklist_steps" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("step_number", { ascending: true })
          .limit(300),
        supabase
          .from("fitment_test_results" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("observed_at", { ascending: false })
          .limit(160),
        supabase
          .from("fitment_road_tests" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("updated_at", { ascending: false })
          .limit(80),
        supabase
          .from("fitment_evidence" as never)
          .select("id,fitment_job_id,evidence_type,storage_bucket,uploaded_at,notes")
          .eq("company_id", activeCompanyId)
          .order("uploaded_at", { ascending: false })
          .limit(80),
        supabase
          .from("firmware_rollout_plans" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("field_support_cases" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .order("opened_at", { ascending: false })
          .limit(80),
        supabase
          .from("field_audit_ledger" as never)
          .select("id,action,entity_type,entity_id,reason,source,created_at")
          .eq("company_id", activeCompanyId)
          .order("created_at", { ascending: false })
          .limit(120),
      ]);

      if (requestId !== requestRef.current) return;
      for (const result of [
        jobResult,
        vehicleResult,
        memberResult,
        deviceResult,
        simResult,
        checklistResult,
        testResult,
        roadResult,
        evidenceResult,
        rolloutResult,
        supportResult,
        auditResult,
      ]) {
        if (result.error) throw result.error;
      }

      const nextJobs = (jobResult.data ?? []) as unknown as FitmentJobRow[];
      setJobs(nextJobs);
      setVehicles((vehicleResult.data ?? []) as VehicleRow[]);
      setMembers((memberResult.data ?? []) as MemberRow[]);
      setDevices((deviceResult.data ?? []) as unknown as DeviceRow[]);
      setSims((simResult.data ?? []) as unknown as SimRow[]);
      setChecklist((checklistResult.data ?? []) as unknown as ChecklistRow[]);
      setTests((testResult.data ?? []) as unknown as TestRow[]);
      setRoadTests((roadResult.data ?? []) as unknown as RoadTestRow[]);
      setEvidence((evidenceResult.data ?? []) as unknown as EvidenceRow[]);
      setRollouts((rolloutResult.data ?? []) as unknown as RolloutRow[]);
      setSupportCases((supportResult.data ?? []) as unknown as SupportCaseRow[]);
      setAudit((auditResult.data ?? []) as unknown as AuditRow[]);
      setSelectedJobId((current) =>
        current && nextJobs.some((job) => job.id === current) ? current : (nextJobs[0]?.id ?? null),
      );
    } catch (err) {
      if (requestId === requestRef.current) setError(errorMessage(err));
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );
  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedJob?.device_id) ?? null,
    [devices, selectedJob],
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedJob?.vehicle_id) ?? null,
    [vehicles, selectedJob],
  );
  const selectedSim = useMemo(
    () => sims.find((sim) => sim.id === selectedJob?.sim_id) ?? null,
    [sims, selectedJob],
  );
  const selectedChecklist = useMemo(
    () => checklist.filter((step) => step.fitment_job_id === selectedJob?.id),
    [checklist, selectedJob],
  );
  const selectedTests = useMemo(
    () => tests.filter((test) => test.fitment_job_id === selectedJob?.id),
    [tests, selectedJob],
  );
  const selectedRoadTest = useMemo(
    () => roadTests.find((test) => test.fitment_job_id === selectedJob?.id) ?? null,
    [roadTests, selectedJob],
  );
  const selectedEvidence = useMemo(
    () => evidence.filter((item) => item.fitment_job_id === selectedJob?.id),
    [evidence, selectedJob],
  );
  const selectedSupport = useMemo(
    () => supportCases.filter((item) => item.fitment_job_id === selectedJob?.id),
    [supportCases, selectedJob],
  );

  const checklistPassed = selectedChecklist.filter((step) => step.status === "passed").length;
  const criticalFailures = selectedTests.filter(
    (test) => test.critical && test.result === "failed" && !test.override_reason,
  );
  const diagnosticCopy = supportDiagnosticCopy({
    evidenceCount: selectedEvidence.length + selectedTests.length,
    simulatedOnly:
      selectedTests.length > 0 && selectedTests.every((test) => test.source === "simulated"),
  });
  const today = new Date().toISOString().slice(0, 10);
  const completedJobs = jobs.filter((job) => job.workflow_stage === "completed");
  const completedDurations = completedJobs
    .filter((job) => job.started_at && job.completed_at)
    .map((job) => (Date.parse(job.completed_at!) - Date.parse(job.started_at!)) / 60_000)
    .filter((minutes) => minutes >= 0);
  const firstTimeCompleted = completedJobs.filter((job) => !job.blocked_reason).length;

  const filteredJobs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return jobs.filter(
      (job) =>
        (statusFilter === "all" || job.workflow_stage === statusFilter) &&
        (!needle ||
          job.reference.toLowerCase().includes(needle) ||
          job.project_name?.toLowerCase().includes(needle) ||
          job.site_name?.toLowerCase().includes(needle)),
    );
  }, [jobs, search, statusFilter]);

  const transitionJob = async (nextStage: string, reason?: string) => {
    if (!activeCompanyId || !selectedJob || !canTransition) return;
    setSaving("saving");
    try {
      const { error: transitionError } = await (
        supabase as unknown as {
          rpc: (
            name: string,
            args: Record<string, unknown>,
          ) => Promise<{ error: { message: string } | null }>;
        }
      ).rpc("transition_field_deployment_stage", {
        _company_id: activeCompanyId,
        _fitment_job_id: selectedJob.id,
        _next_stage: nextStage,
        _reason: reason ?? null,
      });
      if (transitionError) throw transitionError;
      setSaving("saved");
      await load();
    } catch (err) {
      setSaving("error");
      setError(errorMessage(err));
    }
  };

  const createDeployment = async () => {
    if (!activeCompanyId || !canManage) return;
    setSaving("saving");
    setError(null);
    try {
      const { error: createError } = await (
        supabase as unknown as {
          rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: Error | null }>;
        }
      ).rpc("create_field_deployment", {
        _company_id: activeCompanyId,
        _reference: createForm.reference,
        _project_name: createForm.projectName,
        _vehicle_id: createForm.vehicleId,
        _device_id: createForm.deviceId,
        _sim_id: null,
        _technician_user_id: createForm.technicianId || null,
        _scheduled_at: createForm.scheduledAt
          ? new Date(createForm.scheduledAt).toISOString()
          : null,
        _appointment_end_at: null,
        _site_name: createForm.siteName || null,
        _notes: createForm.notes || null,
      });
      if (createError) throw createError;
      setCreateForm({
        reference: "",
        projectName: "",
        vehicleId: "",
        deviceId: "",
        technicianId: "",
        scheduledAt: "",
        siteName: "",
        notes: "",
      });
      setShowCreate(false);
      setSaving("saved");
      await load();
    } catch (err) {
      setSaving("error");
      console.warn("[Field deployment] governed create failed", {
        message: err instanceof Error ? err.message : "unknown",
      });
      setError("The deployment could not be created. Check asset availability and try again.");
    }
  };

  if (!canRead) {
    return (
      <main className="p-4 md:p-6">
        <EmptyState
          title="Field deployment access is restricted"
          description="Drivers do not have field-deployment administration access."
          icon={HardHat}
        />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-4 md:p-6">
        <LoadingState label="Loading field deployment workspace" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 md:p-6">
        <ErrorState
          title="Could not load field deployment"
          description={error}
          onAction={() => void load()}
        />
      </main>
    );
  }

  return (
    <main className="space-y-4 p-4 md:p-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <HardHat className="h-4 w-4" />
            Phase 12 field deployment
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">
            Fitment operations
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Manual field workflow for device issue, installation checks, supervisor review, planned
            OTA metadata, and support diagnostics. No live hardware command is sent from this page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <TruthChip
            tone={saving === "error" ? "error" : saving === "saving" ? "warning" : "success"}
          >
            {saving === "saving" ? "Saving" : saving === "error" ? "Retryable error" : "Saved"}
          </TruthChip>
          <TruthChip tone="info">Manual + simulated only</TruthChip>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label="Planned"
          value={jobs.filter((job) => job.workflow_stage === "planned").length}
        />
        <SummaryCard
          label="Scheduled today"
          value={jobs.filter((job) => job.scheduled_at?.slice(0, 10) === today).length}
        />
        <SummaryCard
          label="In progress"
          value={
            jobs.filter((job) =>
              [
                "en_route",
                "on_site",
                "installation_started",
                "hardware_installed",
                "connectivity_verified",
                "gps_verified",
                "telemetry_verified",
                "qa_review",
              ].includes(job.workflow_stage),
            ).length
          }
        />
        <SummaryCard
          label="Completed today"
          value={completedJobs.filter((job) => job.completed_at?.slice(0, 10) === today).length}
        />
        <SummaryCard
          label="Failed"
          value={jobs.filter((job) => job.workflow_stage === "failed").length}
          tone={jobs.some((job) => job.workflow_stage === "failed") ? "error" : "success"}
        />
        <SummaryCard
          label="Revisit required"
          value={jobs.filter((job) => job.workflow_stage === "revisit_required").length}
        />
        <SummaryCard
          label="Awaiting activation"
          value={jobs.filter((job) => job.workflow_stage === "qa_review").length}
        />
        <SummaryCard
          label="Device issues"
          value={
            supportCases.filter((item) => !["resolved", "closed"].includes(item.status)).length
          }
        />
        <SummaryCard
          label="Average fitment time"
          value={
            completedDurations.length
              ? `${Math.round(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length)} min`
              : "No completed data"
          }
        />
        <SummaryCard
          label="First-time success"
          value={
            completedJobs.length
              ? `${Math.round((firstTimeCompleted / completedJobs.length) * 100)}%`
              : "No completed data"
          }
        />
      </section>

      {canManage ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Deployment planning</h2>
              <p className="text-sm text-muted-foreground">
                Schedule a physical device, vehicle, site, and assigned company technician.
              </p>
            </div>
            <Button
              variant={showCreate ? "outline" : "default"}
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? "Close" : "Create deployment"}
            </Button>
          </div>
          {showCreate ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Reference">
                <Input
                  aria-label="Deployment reference"
                  value={createForm.reference}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, reference: event.target.value })
                  }
                />
              </Field>
              <Field label="Project">
                <Input
                  aria-label="Deployment project"
                  value={createForm.projectName}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, projectName: event.target.value })
                  }
                />
              </Field>
              <Field label="Site">
                <Input
                  aria-label="Deployment site"
                  value={createForm.siteName}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, siteName: event.target.value })
                  }
                />
              </Field>
              <Field label="Vehicle">
                <select
                  aria-label="Deployment vehicle"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={createForm.vehicleId}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, vehicleId: event.target.value })
                  }
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Physical device">
                <select
                  aria-label="Deployment physical device"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={createForm.deviceId}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, deviceId: event.target.value })
                  }
                >
                  <option value="">Select device</option>
                  {devices
                    .filter((device) => !device.simulated && !device.reserved_for_fitment_job_id)
                    .map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.hardware_model} · {maskIdentifier(device.serial_number)}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Technician">
                <select
                  aria-label="Deployment technician"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={createForm.technicianId}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, technicianId: event.target.value })
                  }
                >
                  <option value="">Assign later</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      Company member {member.user_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Scheduled start">
                <Input
                  aria-label="Deployment scheduled start"
                  type="datetime-local"
                  value={createForm.scheduledAt}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, scheduledAt: event.target.value })
                  }
                />
              </Field>
              <Field label="Installer notes">
                <Input
                  aria-label="Deployment installer notes"
                  value={createForm.notes}
                  onChange={(event) => setCreateForm({ ...createForm, notes: event.target.value })}
                />
              </Field>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  disabled={
                    saving === "saving" ||
                    !createForm.reference.trim() ||
                    !createForm.projectName.trim() ||
                    !createForm.vehicleId ||
                    !createForm.deviceId
                  }
                  onClick={() => void createDeployment()}
                >
                  {saving === "saving" ? "Creating…" : "Create deployment"}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(260px,360px)_1fr]">
        <Card className="p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Fitment jobs</h2>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
          <div className="mb-3 grid gap-2">
            <Input
              aria-label="Search deployments"
              placeholder="Search reference, project, or site"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Filter deployment status"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All workflow stages</option>
              {[...new Set(jobs.map((job) => job.workflow_stage))].map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          {filteredJobs.length ? (
            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-md border p-3 text-left text-sm transition ${
                    selectedJob?.id === job.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{job.reference}</span>
                    <StatusBadge status={job.workflow_stage} />
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                    <span className="truncate">Vehicle {job.vehicle_id.slice(0, 8)}</span>
                    <span>{job.installation_location ?? "Location not set"}</span>
                    <span>Updated {relativeTime(job.updated_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No fitment jobs"
              description={
                jobs.length
                  ? "No deployments match the current search and filters."
                  : canManage
                    ? "Create the first governed deployment for a physical device and vehicle."
                    : "No deployments are currently assigned to this workspace."
              }
              icon={ClipboardCheck}
            />
          )}
        </Card>

        <div className="min-w-0 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={tab === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTab(item.id)}
                  className="shrink-0"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {!selectedJob ? (
            <EmptyState
              title="Select a fitment job"
              description="The workspace keeps job details separate from Phase 11 hardware readiness."
              icon={HardHat}
            />
          ) : (
            <TabPanel
              tab={tab}
              job={selectedJob}
              device={selectedDevice}
              vehicle={selectedVehicle}
              sim={selectedSim}
              checklist={selectedChecklist}
              tests={selectedTests}
              roadTest={selectedRoadTest}
              evidence={selectedEvidence}
              rollouts={rollouts}
              supportCases={selectedSupport}
              audit={audit}
              canManage={canManage}
              canWork={canWork}
              criticalFailures={criticalFailures.length}
              checklistPassed={checklistPassed}
              diagnosticCopy={diagnosticCopy}
              onTransition={transitionJob}
              onReload={load}
              companyId={activeCompanyId!}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone = "info",
}: {
  label: string;
  value: number | string;
  tone?: "info" | "success" | "error";
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div
        className={
          tone === "error"
            ? "mt-2 text-2xl font-semibold text-status-error"
            : "mt-2 text-2xl font-semibold"
        }
      >
        {value}
      </div>
    </Card>
  );
}

function TruthChip({
  children,
  tone,
}: {
  children: string;
  tone: "info" | "success" | "warning" | "error";
}) {
  const toneClass = {
    info: "bg-status-info/15 text-status-info",
    success: "bg-status-success/15 text-status-success",
    warning: "bg-status-warning/15 text-status-warning",
    error: "bg-status-error/15 text-status-error",
  }[tone];
  return (
    <span className={`rounded-md px-2.5 py-1 text-sm font-medium ${toneClass}`}>{children}</span>
  );
}

function TabPanel(props: {
  tab: TabId;
  job: FitmentJobRow;
  device: DeviceRow | null;
  vehicle: VehicleRow | null;
  sim: SimRow | null;
  checklist: ChecklistRow[];
  tests: TestRow[];
  roadTest: RoadTestRow | null;
  evidence: EvidenceRow[];
  rollouts: RolloutRow[];
  supportCases: SupportCaseRow[];
  audit: AuditRow[];
  canManage: boolean;
  canWork: boolean;
  criticalFailures: number;
  checklistPassed: number;
  diagnosticCopy: ReturnType<typeof supportDiagnosticCopy>;
  onTransition: (nextStage: string, reason?: string) => void;
  onReload: () => Promise<void>;
  companyId: string;
}) {
  const {
    tab,
    job,
    device,
    vehicle,
    sim,
    checklist,
    tests,
    roadTest,
    evidence,
    rollouts,
    supportCases,
    audit,
    canManage,
    canWork,
    criticalFailures,
    checklistPassed,
    diagnosticCopy,
    onTransition,
    onReload,
    companyId,
  } = props;

  const [captureError, setCaptureError] = useState<string | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [testForm, setTestForm] = useState({
    category: "power",
    result: "not_run",
    measuredValue: "",
    unit: "V",
    notes: "",
    controlledStaging: false,
    telemetryCount: "",
    distanceMeters: "",
    confirmPhysicalRoadTest: false,
  });

  const saveChecklistStep = async (step: ChecklistRow, status: ChecklistStepStatus) => {
    if (!canWork) return;
    setCaptureBusy(true);
    setCaptureError(null);
    const { error } = await supabase
      .from("fitment_job_checklist_steps")
      .update({ status, technician_notes: "Recorded in the authenticated field workspace" })
      .eq("id", step.id)
      .eq("company_id", companyId);
    setCaptureBusy(false);
    if (error) setCaptureError(error.message);
    else await onReload();
  };

  const recordTest = async () => {
    if (!canWork) return;
    setCaptureBusy(true);
    setCaptureError(null);
    const measured = testForm.measuredValue.trim() ? Number(testForm.measuredValue) : null;
    const { error } = await supabase.from("fitment_test_results").insert({
      company_id: companyId,
      fitment_job_id: job.id,
      test_category: testForm.category,
      test_type: `${testForm.category}_field_check`,
      measured_value: measured,
      unit: testForm.unit || null,
      result: testForm.result as FitmentTestResult,
      source: "manual_measurement",
      critical: ["power", "ignition", "gnss", "gsm", "connectivity"].includes(testForm.category),
      notes: testForm.controlledStaging
        ? `CONTROLLED STAGING EVIDENCE — physical hardware unavailable; not production commissioning proof. ${testForm.notes}`.trim()
        : testForm.notes || null,
      metadata: {
        controlled_staging: testForm.controlledStaging,
        hardware_available: !testForm.controlledStaging,
      },
    });
    setCaptureBusy(false);
    if (error) setCaptureError(error.message);
    else await onReload();
  };

  const recordRoadTest = async (controlledStaging: boolean) => {
    if (!canWork) return;
    setCaptureBusy(true);
    setCaptureError(null);
    const startedAt = new Date(Date.now() - 15 * 60_000).toISOString();
    const { error } = await supabase.from("fitment_road_tests").insert({
      company_id: companyId,
      fitment_job_id: job.id,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      distance_meters: controlledStaging ? null : Number(testForm.distanceMeters),
      duration_seconds: 900,
      accepted_telemetry_count: controlledStaging ? 0 : Number(testForm.telemetryCount),
      gps_quality: controlledStaging ? "unknown" : "acceptable",
      network_drop_count: 0,
      reconnect_count: 0,
      result: controlledStaging ? "not_run" : "passed",
      source: controlledStaging ? "simulated_validation" : "manual_field_test",
      technician_conclusion: controlledStaging
        ? "CONTROLLED STAGING EVIDENCE — physical road test and hardware telemetry unavailable; activation is not eligible."
        : "Authenticated technician recorded the completed manual field road test.",
    });
    setCaptureBusy(false);
    if (error) setCaptureError(error.message);
    else await onReload();
  };

  const uploadEvidence = async (file: File) => {
    if (!canWork) return;
    setCaptureBusy(true);
    setCaptureError(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const fingerprint = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const path = `${companyId}/${job.id}/${fingerprint}-${safeName}`;
    const uploaded = await supabase.storage.from("fitment-evidence").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploaded.error) {
      const existing = await supabase
        .from("fitment_evidence")
        .select("id")
        .eq("company_id", companyId)
        .eq("fitment_job_id", job.id)
        .eq("storage_path", path)
        .maybeSingle();
      if (existing.data) {
        setCaptureBusy(false);
        await onReload();
        return;
      }
      if (!/already exists|duplicate/i.test(uploaded.error.message)) {
        setCaptureBusy(false);
        setCaptureError(uploaded.error.message);
        return;
      }
    }
    const { error } = await supabase.from("fitment_evidence").insert({
      company_id: companyId,
      fitment_job_id: job.id,
      evidence_type: "technician_declaration",
      storage_path: path,
      notes: "Captured in the authenticated field workspace",
      metadata: { original_name: file.name, content_type: file.type || null },
    });
    setCaptureBusy(false);
    if (error) setCaptureError(error.message);
    else await onReload();
  };

  if (tab === "jobs") {
    const nextStage: Record<string, [string, string] | undefined> = {
      planned: ["scheduled", "Schedule"],
      scheduled: ["technician_assigned", "Confirm technician"],
      technician_assigned: ["en_route", "Mark en route"],
      en_route: ["on_site", "Mark on site"],
      on_site: ["installation_started", "Start installation"],
      installation_started: ["hardware_installed", "Confirm hardware installed"],
      hardware_installed: ["connectivity_verified", "Verify connectivity"],
      connectivity_verified: ["gps_verified", "Verify GPS"],
      gps_verified: ["telemetry_verified", "Verify telemetry"],
      telemetry_verified: ["qa_review", "Submit for QA review"],
      qa_review: ["activated", "Activate"],
      activated: ["completed", "Complete and hand over"],
      revisit_required: ["technician_assigned", "Reschedule revisit"],
    };
    const primary = nextStage[job.workflow_stage];
    return (
      <Card className="p-4">
        <SectionTitle icon={Truck} title={job.reference} />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Fact label="Workflow stage" value={job.workflow_stage.replaceAll("_", " ")} />
          <Fact
            label="Evidence boundary"
            value={
              job.controlled_staging
                ? "CONTROLLED STAGING — physical activation not claimed"
                : "Physical commissioning"
            }
          />
          <Fact
            label="Scheduled"
            value={job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : "not scheduled"}
          />
          <Fact label="Location" value={job.installation_location ?? "not recorded"} />
          <Fact
            label="Odometer"
            value={job.odometer_at_fitment ? `${job.odometer_at_fitment} km` : "not recorded"}
          />
          <Fact
            label="Device"
            value={
              device
                ? `${device.device_type} ${maskIdentifier(device.serial_number)}`
                : "not assigned"
            }
          />
          <Fact
            label="SIM"
            value={sim ? `${sim.provider ?? "SIM"} ${maskIdentifier(sim.iccid)}` : "not assigned"}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {primary && (!["activated", "completed"].includes(primary[0]) || canManage) ? (
            <Button size="sm" onClick={() => onTransition(primary[0])}>
              {primary[1]}
            </Button>
          ) : null}
          {!["completed", "cancelled", "removed", "replaced"].includes(job.workflow_stage) ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onTransition("blocked", "Operational blocker recorded in field workspace")
              }
            >
              Block
            </Button>
          ) : null}
          {["blocked", "failed"].includes(job.workflow_stage) ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTransition("revisit_required", "Follow-up field visit is required")}
            >
              Require revisit
            </Button>
          ) : null}
          {job.workflow_stage === "activated" && canManage ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTransition("removed", "Hardware removal recorded by field manager")}
            >
              Remove device
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  if (tab === "technician") {
    return (
      <Card className="p-4">
        <SectionTitle icon={Smartphone} title="Assigned technician work" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Fact
            label="Checklist progress"
            value={`${checklistPassed}/${checklist.length || 14} passed`}
          />
          <Fact label="Critical blockers" value={String(criticalFailures)} />
          <Fact label="Draft state" value="Saved locally until Supabase confirms changes" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Weak-connectivity UX preserves normal form state during refreshes and surfaces retryable
          errors. Full offline queueing is not claimed in Phase 12.
        </p>
        {canWork ? (
          <p className="mt-3 rounded-md border border-status-info/30 bg-status-info/10 p-3 text-sm">
            Use Checklist, Tests, and Supervisor evidence to capture work. Every save is confirmed
            by the server before the job refreshes.
          </p>
        ) : null}
      </Card>
    );
  }

  if (tab === "inventory") {
    return (
      <Card className="p-4">
        <SectionTitle icon={PackageCheck} title="Device and SIM inventory" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InventoryCard
            title="Device"
            lines={[
              device?.hardware_model ?? "Model not assigned",
              device ? `Serial ${maskIdentifier(device.serial_number)}` : "Serial not assigned",
              device?.inventory_state ?? "not assigned",
              device?.simulated ? "SIMULATOR - not physical" : "Physical device candidate",
              `Firmware ${device?.firmware_version ?? "not set"}`,
              vehicle
                ? `Assigned vehicle ${vehicle.registration}`
                : "Vehicle relationship not assigned",
            ]}
          />
          <InventoryCard
            title="SIM"
            lines={[
              sim?.inventory_state ?? "not assigned",
              sim?.status ?? "not assigned",
              sim ? `ICCID ${maskIdentifier(sim.iccid)}` : "No SIM",
            ]}
          />
        </div>
      </Card>
    );
  }

  if (tab === "checklist") {
    return (
      <Card className="p-4">
        <SectionTitle icon={FileCheck2} title="Versioned 14-step checklist" />
        <div className="mt-4 space-y-2">
          {checklist.length ? (
            checklist.map((step) => (
              <div key={step.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {step.step_number}. {step.title}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {step.mandatory ? "Mandatory" : "Optional"}
                      {step.critical ? " - critical" : ""}
                    </div>
                  </div>
                  <StatusBadge status={step.status} />
                </div>
                {step.failure_reason ? (
                  <p className="mt-2 text-xs text-status-error">{step.failure_reason}</p>
                ) : null}
                {step.supervisor_comment ? (
                  <p className="mt-2 text-xs text-muted-foreground">{step.supervisor_comment}</p>
                ) : null}
                {canWork &&
                !["qa_review", "activated", "completed"].includes(job.workflow_stage) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.status !== "passed" ? (
                      <Button
                        size="sm"
                        disabled={captureBusy}
                        onClick={() => void saveChecklistStep(step, "passed")}
                      >
                        Pass step
                      </Button>
                    ) : null}
                    {step.status !== "blocked" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={captureBusy}
                        onClick={() => void saveChecklistStep(step, "blocked")}
                      >
                        Mark blocked
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <EmptyState
              title="Checklist not instantiated"
              description="A job receives the template version at creation."
              icon={FileCheck2}
            />
          )}
        </div>
      </Card>
    );
  }

  if (tab === "tests") {
    return (
      <Card className="p-4">
        <SectionTitle icon={Zap} title="Power, ignition, GNSS, GSM, CAN/J1939, and road test" />
        {canWork ? (
          <div className="mt-4 grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Test category">
              <select
                aria-label="Test category"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={testForm.category}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, category: event.target.value }))
                }
              >
                {["power", "ignition", "gnss", "gsm", "connectivity", "telemetry", "can_j1939"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Result">
              <select
                aria-label="Test result"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={testForm.result}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, result: event.target.value }))
                }
              >
                {["not_run", "passed", "failed", "warning"].map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Measured value">
              <Input
                aria-label="Test measured value"
                inputMode="decimal"
                value={testForm.measuredValue}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, measuredValue: event.target.value }))
                }
              />
            </Field>
            <Field label="Unit">
              <Input
                aria-label="Test unit"
                value={testForm.unit}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, unit: event.target.value }))
                }
              />
            </Field>
            <Field label="Technician notes">
              <Input
                aria-label="Test technician notes"
                value={testForm.notes}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                aria-label="Controlled staging hardware unavailable"
                type="checkbox"
                checked={testForm.controlledStaging}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    controlledStaging: event.target.checked,
                  }))
                }
              />
              Controlled staging; hardware unavailable
            </label>
            {testForm.controlledStaging ? (
              <p className="sm:col-span-2 lg:col-span-3 rounded-md bg-status-warning/10 p-2 text-xs text-status-warning">
                This evidence is labelled non-production and must not be represented as physical
                commissioning proof.
              </p>
            ) : null}
            <Button disabled={captureBusy} onClick={() => void recordTest()}>
              Record immutable test
            </Button>
            <Button
              variant="outline"
              disabled={captureBusy}
              onClick={() => void recordRoadTest(true)}
            >
              Record hardware-unavailable road test
            </Button>
            <Field label="Accepted telemetry points">
              <Input
                aria-label="Accepted telemetry points"
                inputMode="numeric"
                value={testForm.telemetryCount}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, telemetryCount: event.target.value }))
                }
              />
            </Field>
            <Field label="Road-test distance (metres)">
              <Input
                aria-label="Road test distance metres"
                inputMode="decimal"
                value={testForm.distanceMeters}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, distanceMeters: event.target.value }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                aria-label="Confirm physical road test"
                type="checkbox"
                checked={testForm.confirmPhysicalRoadTest}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    confirmPhysicalRoadTest: event.target.checked,
                  }))
                }
              />
              I performed this physical road test and entered observed values
            </label>
            <Button
              variant="outline"
              disabled={
                captureBusy ||
                testForm.controlledStaging ||
                !testForm.confirmPhysicalRoadTest ||
                Number(testForm.telemetryCount) <= 0 ||
                Number(testForm.distanceMeters) <= 0
              }
              onClick={() => void recordRoadTest(false)}
            >
              Record completed physical road test
            </Button>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {tests.map((test) => (
            <div key={test.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">
                    {test.test_category.replaceAll("_", " ")} -{" "}
                    {test.test_type.replaceAll("_", " ")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {labelFitmentSource(test.source)} measurement
                  </div>
                  {test.notes?.includes("CONTROLLED STAGING EVIDENCE") ? (
                    <div className="mt-1 text-xs font-medium text-status-warning">
                      Controlled staging — hardware unavailable
                    </div>
                  ) : null}
                </div>
                <StatusBadge status={test.result} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {test.measured_value == null
                  ? "No measured value"
                  : `${test.measured_value} ${test.unit ?? ""}`}
                {test.expected_range ? `, expected ${test.expected_range}` : ""}
              </div>
            </div>
          ))}
          {roadTest ? (
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium">Road test</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {labelFitmentSource(roadTest.source)}
              </div>
              <div className="mt-2 text-xs">
                {roadTest.result.replaceAll("_", " ")} - {roadTest.accepted_telemetry_count}{" "}
                accepted points, {roadTest.network_drop_count} drops, {roadTest.reconnect_count}{" "}
                reconnects
              </div>
              {roadTest.technician_conclusion?.includes("CONTROLLED STAGING EVIDENCE") ? (
                <div className="mt-2 text-xs font-medium text-status-warning">
                  Hardware unavailable — not activation eligible
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  if (tab === "review") {
    return (
      <Card className="p-4">
        <SectionTitle icon={ShieldCheck} title="Supervisor review" />
        {canWork ? (
          <div className="mt-4 rounded-md border p-3">
            <Label htmlFor={`evidence-${job.id}`}>Installation evidence file</Label>
            <Input
              id={`evidence-${job.id}`}
              className="mt-2"
              type="file"
              accept="image/*,.pdf,text/plain"
              disabled={captureBusy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadEvidence(file);
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Files are uploaded to private company/job-scoped storage before metadata is recorded.
            </p>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Fact label="Checklist" value={`${checklistPassed}/${checklist.length || 14} passed`} />
          <Fact label="Critical failures" value={String(criticalFailures)} />
          <Fact label="Evidence files" value={String(evidence.length)} />
        </div>
        <div className="mt-4 space-y-2">
          {evidence.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <span>{item.evidence_type.replaceAll("_", " ")}</span>
              <span className="text-xs text-muted-foreground">
                {relativeTime(item.uploaded_at)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Evidence uses private company-scoped storage metadata. Raw storage paths are not shown in
          this list.
        </p>
        {captureError ? <p className="mt-3 text-sm text-status-error">{captureError}</p> : null}
      </Card>
    );
  }

  if (tab === "firmware") {
    return (
      <Card className="p-4">
        <SectionTitle icon={RotateCcw} title="Firmware compatibility and planned OTA batches" />
        <div className="mt-4 space-y-3">
          {rollouts.length ? (
            rollouts.map((plan) => (
              <div key={plan.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{plan.name}</div>
                  <StatusBadge status={plan.status} />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Stage {plan.rollout_stage}. Target {plan.target_count}.{" "}
                  {rolloutTruthLabel(plan.status)}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No rollout plans"
              description="Planned rollout metadata only. No firmware command sent."
              icon={RotateCcw}
            />
          )}
        </div>
      </Card>
    );
  }

  if (tab === "diagnostics") {
    return (
      <Card className="p-4">
        <SectionTitle icon={Wrench} title="Remote support diagnostics" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Fact
            label="Evidence available"
            value={`${selectedEvidenceLabel(evidence.length, tests.length)}`}
          />
          <Fact label="Priority" value={diagnosticCopy.priority} />
          <Fact label="Device status" value={device?.status ?? "not assigned"} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InventoryCard
            title={diagnosticCopy.possibleCausesHeading}
            lines={[
              "Installation test failure",
              "Weak GSM/GNSS evidence",
              "Power or ignition measurement requires field check",
            ]}
          />
          <InventoryCard
            title={diagnosticCopy.recommendedChecksHeading}
            lines={[
              "Review manual measurements",
              "Confirm antenna and SIM state",
              "Do not treat simulated validation as physical verification",
            ]}
          />
        </div>
        {supportCases.length ? (
          <div className="mt-4 space-y-2">
            {supportCases.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{item.reported_issue}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {item.status} - {item.priority}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <SectionTitle icon={History} title="Field audit ledger" />
      <div className="mt-4 space-y-2">
        {audit
          .filter((item) => item.entity_id === job.id || item.entity_type !== "fitment_job")
          .slice(0, 40)
          .map((item) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{item.action.replaceAll("_", " ")}</span>
                <span className="text-xs text-muted-foreground">
                  {relativeTime(item.created_at)}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.entity_type} - {item.source}
                {item.reason ? ` - ${item.reason}` : ""}
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof HardHat; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function InventoryCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function selectedEvidenceLabel(evidenceCount: number, testCount: number) {
  if (!evidenceCount && !testCount) return "none";
  return `${evidenceCount} evidence files, ${testCount} tests`;
}
