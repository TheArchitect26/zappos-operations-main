import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Camera,
  MapPin,
  PackageSearch,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mobileCapabilities, type MobileWorkspace } from "@/lib/mobile";

const WORKSPACE_CONTENT: Record<
  MobileWorkspace,
  { title: string; description: string; actions: string[] }
> = {
  driver: {
    title: "Driver",
    description: "Today's route, jobs and proof of delivery",
    actions: [
      "Today's jobs",
      "Route list",
      "Arrival & departure",
      "Loading confirmation",
      "POD & signature",
      "Photos & scans",
      "Fuel & expenses",
      "Inspection & checklist",
      "Incidents & messages",
    ],
  },
  technician: {
    title: "Technician",
    description: "Assigned installations and field diagnostics",
    actions: [
      "Assigned installations",
      "QR & barcode pairing",
      "Installation checklist",
      "Diagnostics & firmware",
      "Tests & photos",
      "Parts used",
      "Customer signature",
      "Device activation",
    ],
  },
  warehouse: {
    title: "Warehouse",
    description: "Offline-first warehouse execution",
    actions: [
      "Receiving",
      "Putaway",
      "Picking",
      "Packing",
      "Loading",
      "Transfers",
      "Counts",
      "Bin lookup",
      "Shipment & inventory lookup",
    ],
  },
  supervisor: {
    title: "Supervisor",
    description: "Team execution, exceptions and alerts",
    actions: [
      "Team & shift overview",
      "Attendance",
      "Outstanding work",
      "Exception approvals",
      "Compliance alerts",
      "Incident review",
      "Mobile dashboards",
    ],
  },
  executive: {
    title: "Executive",
    description: "Read-only operational intelligence",
    actions: [
      "KPIs",
      "Fleet health",
      "Financial summary",
      "Warehouse summary",
      "CRM summary",
      "Compliance summary",
      "Brain insights",
    ],
  },
  customer_care: {
    title: "Customer Care",
    description: "Limited customer and shipment support",
    actions: [
      "Customer lookup",
      "Shipment lookup",
      "Service requests",
      "Messages",
      "Notifications",
    ],
  },
};

export function MobilePlatform({
  roles,
  deviceNickname = "This device",
}: {
  roles: readonly string[];
  deviceNickname?: string;
}) {
  const access = useMemo(() => mobileCapabilities(roles), [roles]);
  const [workspace, setWorkspace] = useState<MobileWorkspace | null>(access.workspaces[0] ?? null);
  const [online] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  if (!access.canAccess)
    return (
      <Card className="p-6">
        <h2 className="font-semibold">Mobile access unavailable</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your assigned role does not include a mobile workspace.
        </p>
      </Card>
    );
  const active = workspace ? WORKSPACE_CONTENT[workspace] : null;
  return (
    <div className="space-y-4" data-testid="mobile-platform">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/10 p-2">
              <Smartphone className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">{deviceNickname}</h2>
              <p className="text-xs text-muted-foreground">Secure session · biometric-ready</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {online ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {online ? "Online" : "Offline"}
            </Badge>
            <Badge variant="secondary">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Trusted hook
            </Badge>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <Progress value={100} className="h-2" />
          <span className="whitespace-nowrap text-xs text-muted-foreground">Synced</span>
        </div>
      </Card>
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Mobile workspaces">
        {access.workspaces.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={workspace === item ? "default" : "outline"}
            onClick={() => setWorkspace(item)}
          >
            {WORKSPACE_CONTENT[item].title}
          </Button>
        ))}
      </div>
      {active && (
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{active.title} workspace</h2>
              <p className="text-sm text-muted-foreground">{active.description}</p>
            </div>
            {access.readOnly && <Badge>Read only</Badge>}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {active.actions.map((action) => (
              <button
                key={action}
                disabled={access.readOnly && workspace !== "executive"}
                className="min-h-14 rounded-lg border bg-card p-3 text-left text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
              >
                {action}
              </button>
            ))}
          </div>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">ZIP Mobile</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Role-aware, permission-filtered answers grounded in cited ZappOS evidence.
          </p>
          <Button className="mt-3" variant="outline" size="sm">
            Ask ZIP
          </Button>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold">Device toolkit</h3>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
            <span>
              <Camera className="mx-auto mb-1 h-5 w-5" />
              Camera
            </span>
            <span>
              <QrCode className="mx-auto mb-1 h-5 w-5" />
              Scanner
            </span>
            <span>
              <MapPin className="mx-auto mb-1 h-5 w-5" />
              GPS
            </span>
            <span>
              <PackageSearch className="mx-auto mb-1 h-5 w-5" />
              Files
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
