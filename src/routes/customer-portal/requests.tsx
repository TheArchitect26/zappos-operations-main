/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { portalApi } from "@/lib/customer-portal-api";

export const Route = createFileRoute("/customer-portal/requests")({
  head: () => ({ meta: [{ title: "Requests — Customer portal" }] }),
  component: CustomerRequestsPage,
});

function CustomerRequestsPage() {
  const { session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      setLoading(true);
      setRequests(await portalApi.module("requests"));
      setLoading(false);
    };
    void load();
  }, [session?.user?.id]);

  const createRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.user.id || !subject.trim()) return;
    await portalApi.action("create_request", { subject, message, category: "support" });
    setRequests(await portalApi.module("requests"));
    setSubject("");
    setMessage("");
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Service requests</p>
        <h2 className="mt-2 text-2xl font-semibold">Requests</h2>
        <p className="mt-2 text-sm text-slate-400">
          Ask about a shipment, a document, or a delivery concern.
        </p>
      </div>
      <Card className="border-white/10 bg-slate-900/70 p-5">
        <form className="space-y-3" onSubmit={createRequest}>
          <Input
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="What do you need help with?"
            className="border-white/10 bg-slate-950"
          />
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Add details (optional)"
            className="border-white/10 bg-slate-950"
          />
          <Button type="submit">Create request</Button>
        </form>
      </Card>

      {loading ? (
        <Card className="border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
          Loading requests...
        </Card>
      ) : requests.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          No requests yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <Card key={request.id} className="border-white/10 bg-slate-900/70 p-4">
              <p className="font-medium text-white">{request.subject}</p>
              <p className="mt-1 text-sm text-slate-400">
                {request.category} • {request.status}
              </p>
              {request.customer_visible_response ? (
                <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  {request.customer_visible_response}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
