/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

export type PortalModule =
  | "requests"
  | "quotes"
  | "invoices"
  | "messages"
  | "notifications"
  | "api_keys"
  | "security"
  | "profile"
  | "preferences";

async function invoke<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (supabase as any).rpc(name, args);
  if (error) throw new Error(error.message || "Customer portal request failed");
  return data as T;
}

export const portalApi = {
  context: () => invoke<Record<string, any>>("portal_context"),
  dashboard: () => invoke<Record<string, any>>("portal_dashboard"),
  shipments: (limit = 100) => invoke<any[]>("portal_shipments", { _limit: limit }),
  shipment: (jobId: string) =>
    invoke<Record<string, any> | null>("portal_shipment", { _job_id: jobId }),
  documents: () => invoke<any[]>("portal_documents"),
  analytics: () => invoke<Record<string, number | null>>("portal_analytics"),
  module: <T = any[]>(module: PortalModule) => invoke<T>("portal_module", { _module: module }),
  action: (action: string, payload: Record<string, unknown>) =>
    invoke<{ id: string; status: string }>("portal_action", {
      _action: action,
      _payload: payload,
    }),
  createApiKey: (name: string, type: "read_only_api" | "webhook") =>
    invoke<{ id: string; prefix: string; secret: string }>("portal_create_api_key", {
      _name: name,
      _type: type,
    }),
  askZip: (question: string) =>
    invoke<{
      id: string;
      answer: string;
      citations: Array<{ type: string; id: string; label: string }>;
      outcome: "answered" | "refused" | "unavailable";
      deterministic: true;
    }>("portal_zip_answer", { _question: question }),
};
