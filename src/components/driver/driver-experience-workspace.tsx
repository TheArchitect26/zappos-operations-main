import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  MapPin,
  MessageSquare,
  Navigation,
  PackageCheck,
  Phone,
  ShieldAlert,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDriverWorkflow } from "@/hooks/use-driver-workflow";
import { useCompany } from "@/lib/company-context";
import { useDriverTripTracking } from "@/lib/telemetry/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  safeDrivingMode,
  nextJobAction,
  navigationAvailability,
  routePackState,
  batteryPolicy,
} from "@/lib/driver-experience";
import { toast } from "sonner";

const NAV = [
  ["/mobile/driver", "Today"],
  ["/mobile/driver/navigation", "Navigation"],
  ["/mobile/driver/stops", "Stops"],
  ["/mobile/driver/pod", "POD"],
  ["/mobile/driver/issues", "Issues"],
  ["/mobile/driver/messages", "Messages"],
  ["/mobile/driver/offline", "Offline"],
] as const;
export function DriverExperienceNav() {
  return (
    <nav aria-label="Driver workspace" className="flex gap-2 overflow-x-auto pb-1">
      {NAV.map(([href, label]) => (
        <a
          key={href}
          href={href}
          className="whitespace-nowrap rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
function Unavailable({ label }: { label: string }) {
  return <span className="text-sm text-muted-foreground">{label} unavailable</span>;
}
export function DriverHomeWorkspace() {
  const { activeCompany } = useCompany();
  const workflow = useDriverWorkflow();
  const tracking = useDriverTripTracking({
    driver: workflow.driver,
    currentJob: workflow.currentJob,
  });
  const [speed, setSpeed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const mode = safeDrivingMode(speed);
  const stage =
    workflow.currentJob?.status === "in_progress"
      ? "trip_started"
      : ((workflow.currentJob?.status as "assigned" | "accepted" | "arrived" | undefined) ??
        "assigned");
  const action = nextJobAction(stage, { hasInspection: true, hasPod: false });
  useEffect(() => {
    if (typeof navigator !== "undefined") setSpeed(null);
  }, []);
  const runAction = async () => {
    if (!workflow.currentJob || !action.allowed) return toast.info(action.reason);
    setBusy(true);
    try {
      const transition = workflow.currentJob.status === "assigned" ? "accept" : "start";
      await workflow.transition(workflow.currentJob.id, transition);
      toast.success("Existing controlled driver transition requested");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action unavailable");
    } finally {
      setBusy(false);
    }
  };
  if (!activeCompany)
    return (
      <Card className="p-6">
        <h1 className="font-semibold">Driver workspace unavailable</h1>
        <p className="text-sm text-muted-foreground">
          Select an active company before using driver operations.
        </p>
      </Card>
    );
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-5" data-testid="driver-experience">
      <DriverExperienceNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Driver · {activeCompany.name}
          </p>
          <h1 className="text-2xl font-semibold">Today</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {tracking.uiState === "offline" ? (
              <CloudOff className="mr-1 h-3 w-3" />
            ) : (
              <Wifi className="mr-1 h-3 w-3" />
            )}
            {tracking.uiState === "offline" ? "Offline" : "Sync status unavailable"}
          </Badge>
          <Badge variant={mode === "safe_driving" ? "destructive" : "secondary"}>
            {mode === "safe_driving" ? "Safe driving mode" : "Stationary mode"}
          </Badge>
        </div>
      </div>
      <Card className="border-primary/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Current job</p>
            <h2 className="mt-1 text-xl font-semibold">
              {workflow.currentJob?.reference ?? "No assigned job"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {workflow.currentJob
                ? "Pickup and dropoff assignment available"
                : "No live assignment evidence available"}
            </p>
          </div>
          <PackageCheck className="h-7 w-7 text-primary" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Next stop</p>
            <p className="font-medium">{workflow.nextJob?.dropoff_location ?? "Unavailable"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ETA</p>
            <Unavailable label="ETA" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Distance remaining</p>
            <Unavailable label="Distance" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Route pack</p>
            <Badge variant="outline">
              {routePackState({
                downloadedBytes: 0,
                expectedBytes: 1,
                expiresAt: null,
                failed: false,
                superseded: false,
                queued: false,
              })}
            </Badge>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={busy || mode === "safe_driving"} onClick={runAction}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {workflow.currentJob?.status === "assigned" ? "Accept Job" : "Start Trip"}
          </Button>
          <Button variant="outline" asChild>
            <a href="/mobile/driver/navigation">
              <Navigation className="mr-2 h-4 w-4" />
              Navigation
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/mobile/driver/issues">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report issue
            </a>
          </Button>
          <Button variant="destructive" asChild>
            <a href="/mobile/driver/issues?emergency=true">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Emergency
            </a>
          </Button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <h2 className="font-semibold">Shift overview</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              Shift status: <strong>Unknown</strong>
            </p>
            <p>
              Assigned vehicle: <strong>Unavailable</strong>
            </p>
            <p>
              Jobs today: <strong>Unavailable</strong>
            </p>
            <p>
              Completed: <strong>Unavailable</strong>
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Safety and health</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              GPS: <strong>{tracking.uiState === "active" ? "Active" : "Unavailable"}</strong>
            </p>
            <p>
              Battery: <strong>{batteryPolicy(null).low ? "Low" : "Unavailable"}</strong>
            </p>
            <p>
              Inspection: <strong>Unavailable</strong>
            </p>
            <p>
              Safe-driving threshold: <strong>10 km/h</strong>
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Quick access</h2>
          <div className="mt-3 grid gap-2">
            <Button variant="outline" asChild>
              <a href="/mobile/driver/stops">
                <MapPin className="mr-2 h-4 w-4" />
                Stops
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/mobile/driver/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/mobile/driver/offline">
                <CloudOff className="mr-2 h-4 w-4" />
                Offline queue
              </a>
            </Button>
          </div>
        </Card>
      </div>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <h2 className="font-semibold">Emergency access</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          SOS and assistance remain available while moving. Contact completion is not claimed
          without provider confirmation.
        </p>
      </Card>
    </main>
  );
}
export function DriverNavigationWorkspace() {
  const available = navigationAvailability(false);
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
      <DriverExperienceNav />
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Navigation className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Navigation</h1>
            <p className="text-sm text-muted-foreground">
              Cached route and GPS state are shown separately from live tracking.
            </p>
          </div>
        </div>
        <div className="mt-5 grid min-h-72 place-items-center rounded-lg border bg-muted/30 text-center">
          <div>
            <p className="font-medium">Route map unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">{available.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Full offline rerouting not configured · GPS quality unknown · last known position
              unavailable
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}
export function DriverWorkflowSubpage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const workflow = useDriverWorkflow();
  const [recipient, setRecipient] = useState("");
  const [outcome, setOutcome] = useState("delivered");
  const [photo, setPhoto] = useState<File | null>(null);
  const [queued, setQueued] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [serverSync, setServerSync] = useState<string | null>(null);
  const form = title === "Proof of delivery" || title === "Stops";
  const hasPod = Boolean(recipient.trim()) && Boolean(photo);
  const transition = async (action: "accept" | "start" | "arrive") => {
    if (!workflow.currentJob) return toast.info("No assigned job evidence is available");
    try {
      await workflow.transition(workflow.currentJob.id, action);
      toast.success("Existing controlled workflow transition requested");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transition unavailable");
    }
  };
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
      <DriverExperienceNav />
      <Card className="p-5">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {children ? (
          children
        ) : form ? (
          <div className="mt-5 space-y-4">
            {title === "Stops" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {["Current stop", "Next stop", "Completed stops", "Skipped stops"].map((label) => (
                  <div className="rounded-lg border p-3" key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 font-medium">Unavailable</p>
                  </div>
                ))}
              </div>
            ) : null}
            {title === "Proof of delivery" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Recipient
                    <input
                      className="mt-1 w-full rounded-md border p-2"
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    Outcome
                    <select
                      className="mt-1 w-full rounded-md border p-2"
                      value={outcome}
                      onChange={(event) => setOutcome(event.target.value)}
                    >
                      <option value="delivered">Delivered</option>
                      <option value="partial">Partial delivery</option>
                      <option value="rejected">Rejected</option>
                      <option value="damaged">Damaged goods</option>
                    </select>
                  </label>
                </div>
                <label className="text-sm">
                  Photo evidence
                  <input
                    className="mt-1 block w-full rounded-md border p-2"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Signature capture and checksum validation use the existing device abstraction.
                  Native camera support is unavailable in this web container.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setQueueError(null);
                      if (!workflow.currentJob) return toast.info("No active job");
                      try {
                        await workflow.queueServerItem({
                          operation: "pod_submit",
                          payload: { recipient_name: recipient, notes: outcome },
                          idempotencyKey: `pod:${workflow.currentJob.id}`,
                        });
                        setQueued(true);
                        toast.success("POD queued on this device");
                      } catch (error) {
                        setQueueError(error instanceof Error ? error.message : "POD queue failed");
                        toast.error(error instanceof Error ? error.message : "POD queue failed");
                      }
                    }}
                  >
                    {queued ? "Queued" : "Queue POD"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setQueueError(null);
                      if (!workflow.currentJob) return toast.info("No active job");
                      try {
                        await workflow.queueServerItem({
                          operation: "arrive",
                          idempotencyKey: `arrival:${workflow.currentJob.id}`,
                        });
                        setQueued(true);
                        toast.success("Arrival queued on this device");
                      } catch (error) {
                        setQueueError(
                          error instanceof Error ? error.message : "Arrival queue failed",
                        );
                        toast.error(
                          error instanceof Error ? error.message : "Arrival queue failed",
                        );
                      }
                    }}
                  >
                    Queue arrival
                  </Button>
                  <Button disabled={!recipient.trim()} onClick={() => transition("arrive")}>
                    Confirm arrival
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const summary = await workflow.syncServerQueue();
                        setServerSync(
                          summary.all_synced
                            ? "All server queue items acknowledged"
                            : `${summary.pending} pending · ${summary.failed} failed · ${summary.conflicted} conflicted`,
                        );
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Sync failed");
                      }
                    }}
                  >
                    Reconnect and sync
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!workflow.currentJob) return toast.info("No active job");
                      try {
                        await workflow.queueServerItem({
                          operation: "depart",
                          idempotencyKey: `depart:${workflow.currentJob.id}`,
                        });
                        toast.success("Departure queued");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Departure queue failed",
                        );
                      }
                    }}
                  >
                    Queue departure
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!workflow.currentJob) return toast.info("No active job");
                      try {
                        await workflow.queueServerItem({
                          operation: "complete",
                          idempotencyKey: `complete:${workflow.currentJob.id}`,
                        });
                        toast.success("Completion queued");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Completion queue failed",
                        );
                      }
                    }}
                  >
                    Queue completion
                  </Button>
                  <Badge variant="outline">
                    {queued ? "Queued" : hasPod ? "Local Draft" : "Missing evidence"}
                  </Badge>
                </div>
                {serverSync ? <p className="text-xs text-muted-foreground">{serverSync}</p> : null}
                {queueError ? (
                  <p role="alert" className="text-xs text-destructive">
                    Queue failed: {queueError}. Local draft preserved; retry is available.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border p-5">
            <Unavailable label={title} />
          </div>
        )}
      </Card>
    </main>
  );
}
