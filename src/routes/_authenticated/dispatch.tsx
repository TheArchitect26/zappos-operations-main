import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { useCustomers } from "@/hooks/use-customers";
import { useDrivers } from "@/hooks/use-drivers";
import { useVehicles } from "@/hooks/use-vehicles";
import { useCompany } from "@/lib/company-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge-detailed";
import { EmptyState, ErrorState, LoadingState } from "@/components/operational-state";
import { toast } from "sonner";
import {
  checkVehicleEligibility,
  confidenceMeter,
  rankCandidates,
  type ScoreFactors,
} from "@/lib/dispatch/phase36";

export const Route = createFileRoute("/_authenticated/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch — ZappOS" }] }),
  component: DispatchPage,
});

const DISPATCH_VIEWS = [
  ["/dispatch/live", "Live"],
  ["/dispatch/planning", "Planning"],
  ["/dispatch/recommendations", "Recommendations"],
  ["/dispatch/eta", "ETA"],
  ["/dispatch/workload", "Workload"],
  ["/dispatch/routes", "Routes"],
  ["/dispatch/exceptions", "Exceptions"],
  ["/dispatch/history", "History"],
] as const;

function DispatchPage() {
  const { hasRole, terminology } = useCompany();
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [selectedVehicles, setSelectedVehicles] = useState<Record<string, string>>({});

  const { jobs, assign, loading: jobsLoading, error: jobsError, fetch: fetchJobs } = useJobs();
  const { customers } = useCustomers();
  const {
    drivers,
    loading: driversLoading,
    error: driversError,
    fetch: fetchDrivers,
  } = useDrivers();
  const {
    vehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    fetch: fetchVehicles,
  } = useVehicles();

  const canDispatch = hasRole("admin") || hasRole("dispatcher");
  const canOverride = hasRole("admin");

  const getCustomerName = (customerId: string | null) =>
    customerId ? customers.find((c) => c.id === customerId)?.name || "Unknown" : "—";

  const handleAssignJob = async (jobId: string, driverId: string, vehicleId: string) => {
    setAssigning(jobId);
    try {
      let result = await assign(jobId, driverId, vehicleId, false);
      if (!result.ok) {
        const messages = result.conflicts.map((c) => c.message).join("\n");
        if (!canOverride || !result.override_allowed) {
          toast.error(messages || "Assignment blocked by conflict detection");
          return;
        }

        const approved = confirm(
          `Assignment conflicts detected:\n\n${messages}\n\nUse admin override and log this assignment?`,
        );
        if (!approved) return;
        result = await assign(jobId, driverId, vehicleId, true);
      }

      toast.success(
        result.override_used
          ? `${terminology.Singular} assigned with admin override`
          : `${terminology.Singular} assigned`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setAssigning(null);
    }
  };

  if (jobsLoading || driversLoading || vehiclesLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <LoadingState label="Loading dispatch workspace" />
      </div>
    );
  }

  const loadError = jobsError || driversError || vehiclesError;
  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Could not load dispatch workspace"
          description={loadError}
          onAction={() => {
            void fetchJobs();
            void fetchDrivers();
            void fetchVehicles();
          }}
        />
      </div>
    );
  }

  if (!canDispatch) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Dispatch is restricted"
          description="Your current role can read operational data but cannot assign resources."
        />
      </div>
    );
  }

  const unassignedJobs = jobs.filter((j) => j.status === "unassigned");
  const activeJobs = jobs.filter((j) =>
    ["assigned", "accepted", "in_progress", "arrived"].includes(j.status),
  );
  const availableDrivers = drivers.filter((d) => d.status === "available");
  const availableVehicles = vehicles.filter((v) => v.status === "available");

  const advisoryCandidates = unassignedJobs.slice(0, 8).map((job) => {
    const ranked = rankCandidates(
      availableVehicles.map((vehicle) => {
        const eligibility = checkVehicleEligibility(
          {
            id: vehicle.id,
            active: vehicle.status !== "out_of_service",
            available: vehicle.status === "available",
            assigned: false,
            maintenanceBlocked: vehicle.status === "maintenance",
            complianceBlocked: false,
            telemetryFresh: true,
          },
          {},
        );
        const factors: ScoreFactors = {
          pickupProximity: 80,
          eta: 80,
          etaConfidence: 75,
          vehicleSuitability: eligibility.eligible ? 100 : 0,
          capacityUtilisation: 70,
          driverAvailability: 80,
          driverHoursMargin: 75,
          maintenanceRisk: 90,
          complianceRisk: 95,
          depotReadiness: 70,
          telemetryQuality: 80,
        };
        return { id: vehicle.id, eligible: eligibility.eligible, factors };
      }),
    );
    return {
      job,
      ranked,
      meter: confidenceMeter(ranked[0]?.assessment ?? null, ranked[1]?.assessment ?? null),
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Real-time Assignment
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dispatch workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign drivers and vehicles fast, with live conflict detection.
          </p>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Dispatch views">
            {DISPATCH_VIEWS.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="rounded border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Waiting dispatch
          </div>
          <div className="mt-2 text-3xl font-semibold">{unassignedJobs.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Available drivers
          </div>
          <div className="mt-2 text-3xl font-semibold">{availableDrivers.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Available vehicles
          </div>
          <div className="mt-2 text-3xl font-semibold">{availableVehicles.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ready to dispatch
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {Math.min(availableDrivers.length, availableVehicles.length)}
          </div>
        </Card>
      </div>

      <Card
        className="mb-6 border-primary/20 bg-primary/[0.03] p-4"
        data-testid="dispatch-intelligence"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Dispatch intelligence
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Advisory candidates only. Any change requires dispatcher review and the owning
              workflow.
            </p>
          </div>
          <span className="rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide">
            Human approval required
          </span>
        </div>
        {advisoryCandidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Recommendations appear when jobs and eligible vehicles are available.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {advisoryCandidates.slice(0, 4).map(({ job, ranked, meter }) => (
              <div key={job.id} className="rounded-md border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{job.reference}</span>
                  <span className="text-xs text-muted-foreground">
                    {meter.confidence} confidence
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-lg font-semibold">
                    {meter.recommendationScore ?? "—"}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ranked.length} eligible alternatives
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" /> Score version phase36-deterministic-v1
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {meter.scoreDifference != null
                    ? `${meter.scoreDifference} points ahead of next option`
                    : "Comparison unavailable"}
                  . Review eligibility, ETA and customer impact before applying.
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Content - Two columns on desktop, single on mobile */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Unassigned Jobs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Unassigned {terminology.plural}</h2>
          {unassignedJobs.length === 0 ? (
            <EmptyState
              title={`All ${terminology.plural} assigned`}
              description={`New unassigned ${terminology.plural} will appear here.`}
              icon={CheckCircle}
            />
          ) : (
            <div className="space-y-3">
              {unassignedJobs.map((job) => (
                <Card key={job.id} className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{job.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCustomerName(job.customer_id)}
                      </p>
                    </div>
                    <StatusBadge status={job.priority} variant="small" />
                  </div>
                  <div className="mb-3 text-xs text-muted-foreground">
                    <div>
                      {job.pickup_location} → {job.dropoff_location}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    {availableDrivers.length > 0 && availableVehicles.length > 0 ? (
                      <>
                        <select
                          id={`driver-${job.id}`}
                          className="h-9 min-w-0 rounded border border-input bg-background px-2 py-1 text-xs"
                          value={selectedDrivers[job.id] || ""}
                          onChange={(event) =>
                            setSelectedDrivers((current) => ({
                              ...current,
                              [job.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select driver</option>
                          {availableDrivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.full_name}
                            </option>
                          ))}
                        </select>
                        <select
                          id={`vehicle-${job.id}`}
                          className="h-9 min-w-0 rounded border border-input bg-background px-2 py-1 text-xs"
                          value={selectedVehicles[job.id] || ""}
                          onChange={(event) =>
                            setSelectedVehicles((current) => ({
                              ...current,
                              [job.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select vehicle</option>
                          {availableVehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.registration}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => {
                            const driverId = selectedDrivers[job.id];
                            const vehicleId = selectedVehicles[job.id];
                            if (driverId && vehicleId) {
                              handleAssignJob(job.id, driverId, vehicleId);
                            } else {
                              toast.error("Please select driver and vehicle");
                            }
                          }}
                          disabled={assigning === job.id}
                          className="gap-1"
                        >
                          {assigning === job.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Assign"
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="flex w-full items-center gap-2 rounded bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        No resources available
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="space-y-4">
          <div>
            <h2 className="mb-3 text-lg font-semibold">
              Active {terminology.plural} ({activeJobs.length})
            </h2>
            {activeJobs.length === 0 ? (
              <EmptyState title="No active assignments" icon={CheckCircle} />
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {activeJobs.map((job) => (
                  <Card key={job.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{job.reference}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {getCustomerName(job.customer_id)}
                        </p>
                      </div>
                      <StatusBadge status={job.status} variant="small" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Available Drivers */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">
              Available drivers ({availableDrivers.length})
            </h2>
            {availableDrivers.length === 0 ? (
              <EmptyState title="No available drivers" icon={AlertCircle} />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableDrivers.map((d) => (
                  <Card key={d.id} className="p-3">
                    <p className="text-sm font-medium">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.phone}</p>
                    {d.licence_expiry && (
                      <p className="mt-1 text-xs">
                        Licence: {new Date(d.licence_expiry).toLocaleDateString()}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Available Vehicles */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">
              Available vehicles ({availableVehicles.length})
            </h2>
            {availableVehicles.length === 0 ? (
              <EmptyState title="No available vehicles" icon={AlertCircle} />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableVehicles.map((v) => (
                  <Card key={v.id} className="p-3">
                    <p className="text-sm font-medium">{v.registration}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.year} {v.make} {v.model}
                    </p>
                    {v.licence_expiry && (
                      <p className="mt-1 text-xs">
                        Licence: {new Date(v.licence_expiry).toLocaleDateString()}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
