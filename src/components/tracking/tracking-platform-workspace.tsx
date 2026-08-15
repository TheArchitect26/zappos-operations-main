import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock3, MapPinned, Radio, Search, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const routes = [
  ["/tracking", "Live Map"],
  ["/tracking/control", "Control"],
  ["/tracking/customer-care", "Customer Care"],
  ["/tracking/replay", "Replay"],
  ["/tracking/wall", "Wall Mode"],
] as const;
const states = [
  "Moving",
  "Idle",
  "Stationary",
  "Loading",
  "Unloading",
  "At Customer",
  "At Depot",
  "At Warehouse",
  "At Fuel Stop",
  "At Border",
  "At Port",
  "Breakdown",
  "Incident",
  "SOS",
  "Offline",
  "Stale",
  "Unknown",
  "No Device",
  "Device Fault",
];
const unavailable = [
  "Total Vehicles",
  "Moving",
  "Idle",
  "Stopped",
  "Loading",
  "Unloading",
  "At Customer",
  "At Depot",
  "In Maintenance",
  "Breakdown",
  "SOS",
  "Offline",
  "Stale",
  "Unknown",
];
export function TrackingPlatformNav() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Tracking workspace">
      {routes.map(([to, label]) => (
        <Link key={to} to={to} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
          {label}
        </Link>
      ))}
    </nav>
  );
}
const EmptyMetric = ({ label }: { label: string }) => (
  <div className="min-w-28 rounded-md border p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold">Unavailable</p>
  </div>
);
export function TrackingControlWorkspace() {
  return (
    <div className="space-y-5" data-testid="tracking-control">
      <TrackingPlatformNav />
      <div className="flex gap-3 overflow-x-auto pb-1">
        {unavailable.map((x) => (
          <EmptyMetric label={x} key={x} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="min-h-[520px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned />
              Live fleet map
            </CardTitle>
            <CardDescription>
              MapLibre vector map, clustered live and last-known positions, routes, stops, depots,
              warehouses, geofences, incidents and telemetry quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid min-h-96 place-items-center rounded-md border bg-muted/30 text-center text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Map data unavailable</p>
              <p>No fresh authorised vehicle positions are loaded.</p>
              <p>No approved map provider is configured for this environment.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle context panel</CardTitle>
            <CardDescription>
              Select a marker or search result to open one operational context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              "Registration, fleet number and vehicle class",
              "Driver, job, shipment and trip",
              "Location, speed, heading and ignition",
              "Device, signal and battery evidence",
              "ETA, confidence and next stop",
              "Deviation, geofence and incident state",
              "Maintenance and compliance warnings",
              "Customer instructions and operational notes",
              "Brain advisory insight",
              "ZIP cited explanation",
              "Documents, timeline and permission-aware actions",
            ].map((x) => (
              <div className="rounded border p-2" key={x}>
                {x}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="states">
        <TabsList>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="progress">Route Progress</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        <TabsContent value="states">
          <Card>
            <CardHeader>
              <CardTitle>Truthful vehicle-state model</CardTitle>
              <CardDescription>
                Source state is preserved separately from deterministic derived state.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {states.map((x) => (
                <Badge key={x} variant="secondary">
                  {x}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <Search />
                Universal tracking search
              </CardTitle>
              <CardDescription>
                Registration, fleet or driver number, driver, shipment, job, trip, customer,
                address, container, trailer, device, and authorised phone metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              Results pan and zoom the map, then open the owning entity context.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Route and stop progress</CardTitle>
              <CardDescription>
                Planned versus persisted actual route; telemetry gaps remain visible.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {[
                "Completed and remaining distance",
                "Completed and remaining stops",
                "Current segment and dwell time",
                "ETA with confidence band",
                "Deviation distance and duration",
                "Planned, completed, skipped and unplanned stops",
                "Fuel, rest, border, port, warehouse, customer and incident stops",
                "Expected and actual arrival/departure evidence",
              ].map((x) => (
                <div className="rounded border p-2" key={x}>
                  {x}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Tracking alerts</CardTitle>
              <CardDescription>
                New → Acknowledged → Investigating → Resolved or Dismissed as false positive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              No alert is deleted to hide history. SOS, breakdown, severe delay, deviation, missed
              arrival, offline, stale, device fault, low-confidence ETA and geofence breaches link
              to evidence.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export function TrackingCustomerCareWorkspace() {
  return (
    <div className="space-y-5" data-testid="tracking-customer-care">
      <TrackingPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle>Hourly Fleet Tracker</CardTitle>
          <CardDescription>
            Fast, customer-safe exception review—one persisted active shipment or vehicle per row.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-[1200px] text-left text-sm">
            <thead>
              <tr>
                {[
                  "Customer",
                  "Shipment",
                  "Vehicle",
                  "Driver",
                  "Current Area",
                  "Current Status",
                  "Last Update",
                  "ETA",
                  "ETA Confidence",
                  "Delay",
                  "Delay Reason",
                  "Next Stop",
                  "POD State",
                  "Customer Contacted",
                  "Last Customer Update",
                  "Required Action",
                  "Owner",
                ].map((x) => (
                  <th className="border-b p-2" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={17} className="p-8 text-center text-muted-foreground">
                  No authorised active tracking rows. Missing data is not a successful hourly check.
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Care Search</CardTitle>
            <CardDescription>
              Customer, order, shipment, registration, driver, delivery address, invoice and POD
              reference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            Internal margins, supplier pricing, employee-sensitive data, internal Brain diagnostics
            and unauthorised route history are excluded.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer-safe update summary</CardTitle>
            <CardDescription>
              Status, general area, qualified ETA, delay reason, next milestone, POD state and
              freshness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            Copy or queue through existing communication workflows. Prepared does not mean sent;
            provider confirmation remains required.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export function TrackingReplayWorkspace() {
  return (
    <div className="space-y-5" data-testid="tracking-replay">
      <TrackingPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2">
            <Clock3 />
            Persisted Route Replay
          </CardTitle>
          <CardDescription>
            Today, Yesterday, Last 7 Days, Custom Range, Specific Trip or Specific Vehicle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid min-h-96 place-items-center rounded border bg-muted/30 text-center text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Replay unavailable</p>
              <p>Select authorised persisted telemetry. Missing segments will remain gaps.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Play",
              "Pause",
              "Scrub",
              "Speed",
              "Jump to event",
              "Stops",
              "Speed",
              "Idling",
              "Incidents",
              "Geofences",
              "Deviation",
              "Deliveries",
              "Telemetry gaps",
            ].map((x) => (
              <Badge variant="outline" key={x}>
                {x}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Evidence-linked timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            "Trip started",
            "Depot exit",
            "Stop arrival",
            "Stop departure",
            "Delay",
            "Route deviation",
            "Geofence entry",
            "Geofence exit",
            "Incident",
            "Breakdown",
            "SOS",
            "Message",
            "Customer contact",
            "POD",
            "Trip completed",
            "Device offline",
            "Device recovered",
          ].map((x) => (
            <Badge key={x} variant="secondary">
              {x}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
export function TrackingWallWorkspace() {
  return (
    <div className="space-y-5" data-testid="tracking-wall">
      <TrackingPlatformNav />
      <Card className="min-h-[70vh]">
        <CardHeader>
          <CardTitle role="heading" aria-level={1} className="text-3xl">
            Tracking Wall
          </CardTitle>
          <CardDescription className="text-base">
            Control-room display · automatic refresh and saved-view rotation use governed company
            settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              "Fleet counts",
              "Delays",
              "Incidents",
              "SOS",
              "Offline vehicles",
              "Stale vehicles",
              "Warehouse queues",
              "High-priority alerts",
            ].map((x) => (
              <div className="rounded-lg border p-6 text-xl" key={x}>
                {x}
                <p className="mt-2 text-sm text-muted-foreground">Unavailable</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid min-h-96 place-items-center rounded-lg border bg-muted/30">
            <span className="text-muted-foreground">No fresh authorised map observations</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export function TrackingSafetyBoundary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2">
          <ShieldCheck />
          Tracking boundaries
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-3">
        <span>
          <Radio className="mr-1 inline h-4 w-4" />
          Freshness-qualified live data
        </span>
        <span>
          <Truck className="mr-1 inline h-4 w-4" />
          Role and scope enforced server-side
        </span>
        <span>
          <AlertTriangle className="mr-1 inline h-4 w-4" />
          Brain advisory; ZIP cited/read-only
        </span>
      </CardContent>
    </Card>
  );
}
