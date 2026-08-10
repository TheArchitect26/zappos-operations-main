/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { portalApi } from "@/lib/customer-portal-api";

export type Phase38PageMode = "tracking" | "deliveries" | "appointments" | "exceptions" | "actions";
const copy: Record<Phase38PageMode, { eyebrow: string; title: string; description: string }> = {
  tracking: {
    eyebrow: "Live tracking",
    title: "Where are my deliveries?",
    description:
      "Location detail, ETA and freshness are enforced by your server-side visibility policy.",
  },
  deliveries: {
    eyebrow: "Deliveries",
    title: "Delivery experience",
    description: "Simple milestones, delivery windows, completion and POD availability.",
  },
  appointments: {
    eyebrow: "Appointments",
    title: "Delivery and collection appointments",
    description:
      "Confirm or request changes through controlled workflows. Schedules are never edited directly.",
  },
  exceptions: {
    eyebrow: "Delivery exceptions",
    title: "Issues and next steps",
    description:
      "Customer-safe explanations only. Internal incident, security and staffing notes remain private.",
  },
  actions: {
    eyebrow: "Action Centre",
    title: "Things that need your attention",
    description: "Complete authorised delivery, appointment, document and support actions.",
  },
};
export function Phase38PortalPage({ mode }: { mode: Phase38PageMode }) {
  const [shipments, setShipments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    void portalApi.visibilityShipments(25, 0).then(async (rows) => {
      setShipments(rows);
      if (rows[0]) setSelected(await portalApi.visibilityShipment(rows[0].id));
    });
  }, [mode]);
  const action = async (kind: string) => {
    if (!selected?.job?.id) return;
    await portalApi.visibilityAction(kind, {
      job_id: selected.job.id,
      summary: summary || "Customer action submitted",
      subject: `${mode} request`,
    });
    setSaved(true);
  };
  const shell = copy[mode];
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[.24em] text-slate-400">{shell.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold">{shell.title}</h2>
        <p className="mt-2 text-sm text-slate-400">{shell.description}</p>
      </div>
      {selected ? (
        <>
          <Card className="border-white/10 bg-slate-900/70 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <p className="font-semibold">{selected.job.reference}</p>
                <p className="mt-1 text-sm capitalize text-slate-400">
                  {selected.job.status?.replaceAll("_", " ")}
                </p>
              </div>
              <Link to="/customer-portal/shipments/$jobId" params={{ jobId: selected.job.id }}>
                <Button variant="outline">Open live delivery</Button>
              </Link>
            </div>
            {selected.eta ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Expected"
                  value={
                    selected.eta.window_start && selected.eta.window_end
                      ? `${new Date(selected.eta.window_start).toLocaleTimeString()}–${new Date(selected.eta.window_end).toLocaleTimeString()}`
                      : "Unavailable"
                  }
                />
                <Metric label="Confidence" value={selected.eta.confidence} />
                <Metric label="Next" value={selected.eta.next_milestone ?? "Unavailable"} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                ETA unavailable — no estimate is fabricated.
              </p>
            )}
          </Card>
          {mode === "tracking" ? (
            <Card className="border-white/10 bg-slate-900/70 p-5">
              <h3 className="font-semibold">Policy-controlled location</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Metric label="Visibility" value={selected.tracking?.visibility_mode ?? "hidden"} />
                <Metric label="Area" value={selected.tracking?.general_area ?? "Restricted"} />
                <Metric
                  label="Last update"
                  value={
                    selected.tracking?.last_update
                      ? new Date(selected.tracking.last_update).toLocaleString()
                      : "Unavailable"
                  }
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Unrelated stops, route alternatives, driver-private data and Yard layouts are not
                included.
              </p>
            </Card>
          ) : null}
          {mode === "deliveries" ? (
            <Card className="border-white/10 bg-slate-900/70 p-5">
              <h3 className="font-semibold">Journey and completion</h3>
              <div className="mt-3 space-y-2">
                {(selected.timeline ?? []).map((event: any) => (
                  <div key={event.id} className="rounded-lg border border-white/10 p-3">
                    <p className="capitalize">{event.milestone.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-500">
                      {event.source} · {event.freshness} ·{" "}
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-400">
                POD: {selected.proof?.status ?? "Pending"}
              </p>
            </Card>
          ) : null}
          {mode === "exceptions" ? (
            <Card className="border-white/10 bg-slate-900/70 p-5">
              <h3 className="font-semibold">Customer-safe exceptions</h3>
              {(selected.exceptions ?? []).length ? (
                (selected.exceptions ?? []).map((issue: any) => (
                  <div key={issue.id} className="mt-3 rounded-lg border border-white/10 p-3">
                    <p className="capitalize">{issue.type.replaceAll("_", " ")}</p>
                    <p className="text-sm text-slate-400">{issue.summary}</p>
                  </div>
                ))
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  No customer-visible exception is recorded.
                </p>
              )}
            </Card>
          ) : null}
          {mode === "appointments" || mode === "actions" ? (
            <Card className="border-white/10 bg-slate-900/70 p-5">
              <h3 className="font-semibold">Controlled customer action</h3>
              <Textarea
                className="mt-3 bg-slate-950"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Add an instruction or request"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    void action(
                      mode === "appointments" ? "appointment_confirm" : "site_instruction",
                    )
                  }
                >
                  {mode === "appointments" ? "Confirm appointment" : "Provide site instruction"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void action(mode === "appointments" ? "appointment_change" : "delivery_issue")
                  }
                >
                  {mode === "appointments" ? "Request change" : "Report delivery issue"}
                </Button>
              </div>
              {saved ? (
                <p className="mt-2 text-sm text-emerald-300">Submitted for controlled review.</p>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : (
        <Card className="border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
          No authorised shipment is available.
        </Card>
      )}
      {shipments.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {shipments.map((row) => (
            <Button
              key={row.id}
              variant="outline"
              onClick={() => void portalApi.visibilityShipment(row.id).then(setSelected)}
            >
              {row.reference}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm capitalize">{String(value).replaceAll("_", " ")}</p>
    </div>
  );
}
