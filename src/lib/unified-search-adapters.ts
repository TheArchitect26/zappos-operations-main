import type { SupabaseClient } from "@supabase/supabase-js";
import type { UnifiedResult } from "@/lib/unified-work-experience";

type SearchContext = {
  client: SupabaseClient;
  companyId: string;
  query: string;
};

export type UnifiedSearchAdapter = {
  domain: string;
  search: (context: SearchContext) => Promise<UnifiedResult[]>;
};

function text(value: unknown, fallback = "") {
  return value == null ? fallback : String(value);
}

async function rows(
  context: SearchContext,
  table: string,
  columns: string,
  filter: string,
): Promise<Record<string, unknown>[]> {
  const response = await context.client
    .from(table)
    .select(columns)
    .eq("company_id", context.companyId)
    .or(filter)
    .limit(8);
  return response.error ? [] : ((response.data ?? []) as unknown as Record<string, unknown>[]);
}

export const purchaseOrderSearchAdapter: UnifiedSearchAdapter = {
  domain: "purchase orders",
  async search(context) {
    const data = await rows(
      context,
      "proc_purchase_orders",
      "id,company_id,order_number,status,total_amount,currency_code,updated_at",
      `order_number.ilike.%${context.query}%`,
    );
    return data.map((row) => ({
      id: text(row.id),
      type: "Purchase order",
      title: text(row.order_number, "Purchase order"),
      status: text(row.status, "available"),
      companyId: context.companyId,
      metadata: `${text(row.currency_code)} ${text(row.total_amount)}`.trim(),
      path: "/procurement",
      source: "proc_purchase_orders",
      occurredAt: text(row.updated_at) || undefined,
    }));
  },
};

export const warehouseInventorySearchAdapter: UnifiedSearchAdapter = {
  domain: "warehouse inventory",
  async search(context) {
    const value = context.query.replaceAll(",", " ");
    const data = await rows(
      { ...context, query: value },
      "warehouse_stock",
      "id,company_id,serial_number,batch_number,lot_number,status,quantity,updated_at",
      `serial_number.ilike.%${value}%,batch_number.ilike.%${value}%,lot_number.ilike.%${value}%`,
    );
    return data.map((row) => {
      const identity = row.serial_number ?? row.batch_number ?? row.lot_number;
      return {
        id: text(row.id),
        type: "Warehouse inventory",
        title: text(identity, "Warehouse stock"),
        status: text(row.status, "available"),
        companyId: context.companyId,
        metadata: `Quantity ${text(row.quantity, "0")}`,
        path: "/warehouse",
        source: "warehouse_stock",
        occurredAt: text(row.updated_at) || undefined,
      };
    });
  },
};

export const maintenanceWorkSearchAdapter: UnifiedSearchAdapter = {
  domain: "maintenance work",
  async search(context) {
    const data = await rows(
      context,
      "maintenance",
      "id,company_id,title,description,status,maintenance_type,updated_at",
      `title.ilike.%${context.query}%,description.ilike.%${context.query}%`,
    );
    return data.map((row) => ({
      id: text(row.id),
      type: "Maintenance",
      title: text(row.title, "Maintenance work"),
      status: text(row.status, "available"),
      companyId: context.companyId,
      metadata: text(row.maintenance_type),
      path: "/maintenance",
      source: "maintenance",
      occurredAt: text(row.updated_at) || undefined,
    }));
  },
};

export const supportCaseSearchAdapter: UnifiedSearchAdapter = {
  domain: "support cases",
  async search(context) {
    const data = await rows(
      context,
      "customer_service_requests",
      "id,company_id,subject,category,priority,status,updated_at",
      `subject.ilike.%${context.query}%,category.ilike.%${context.query}%`,
    );
    return data.map((row) => ({
      id: text(row.id),
      type: "Support request",
      title: text(row.subject, "Support request"),
      status: text(row.status, "available"),
      companyId: context.companyId,
      metadata: [row.category, row.priority].filter(Boolean).join(" · "),
      path: "/crm",
      source: "customer_service_requests",
      occurredAt: text(row.updated_at) || undefined,
    }));
  },
};

export const invoiceSearchAdapter: UnifiedSearchAdapter = {
  domain: "invoices",
  async search(context) {
    const data = await rows(
      context,
      "proc_supplier_invoices",
      "id,company_id,invoice_number,status,amount,due_date,updated_at",
      `invoice_number.ilike.%${context.query}%`,
    );
    return data.map((row) => ({
      id: text(row.id),
      type: "Invoice",
      title: text(row.invoice_number, "Invoice"),
      status: text(row.status, "available"),
      companyId: context.companyId,
      metadata: `Amount ${text(row.amount)}${row.due_date ? ` · due ${text(row.due_date)}` : ""}`,
      path: "/procurement",
      source: "proc_supplier_invoices",
      occurredAt: text(row.updated_at) || undefined,
    }));
  },
};

export const documentSearchAdapter: UnifiedSearchAdapter = {
  domain: "documents",
  async search(context) {
    const data = await rows(
      context,
      "documents",
      "id,company_id,name,document_type,owner_type,expiry_date,updated_at",
      `name.ilike.%${context.query}%,document_type.ilike.%${context.query}%`,
    );
    return data.map((row) => ({
      id: text(row.id),
      type: "Document",
      title: text(row.name, "Document"),
      status: row.expiry_date ? `expires ${text(row.expiry_date)}` : "available",
      companyId: context.companyId,
      metadata: [row.document_type, row.owner_type].filter(Boolean).join(" · "),
      path: "/documents",
      source: "documents",
      occurredAt: text(row.updated_at) || undefined,
    }));
  },
};

export const deviceSearchAdapter: UnifiedSearchAdapter = {
  domain: "devices",
  async search(context) {
    const data = await rows(
      context,
      "devices",
      "id,company_id,serial_number,hardware_model,imei,status,last_seen_at",
      `serial_number.ilike.%${context.query}%,hardware_model.ilike.%${context.query}%,imei.ilike.%${context.query}%`,
    );
    return data.map((row) => ({
      id: text(row.id),
      type: "Device",
      title: text(row.serial_number, "Device"),
      status: text(row.status, "available"),
      companyId: context.companyId,
      metadata: text(row.hardware_model),
      path: "/hardware-readiness",
      source: "devices",
      occurredAt: text(row.last_seen_at) || undefined,
    }));
  },
};

export const HIGH_VALUE_SEARCH_ADAPTERS = [
  purchaseOrderSearchAdapter,
  warehouseInventorySearchAdapter,
  maintenanceWorkSearchAdapter,
  supportCaseSearchAdapter,
  invoiceSearchAdapter,
  documentSearchAdapter,
  deviceSearchAdapter,
] as const;
