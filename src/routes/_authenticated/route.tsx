import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { CompanyProvider, useCompany } from "@/lib/company-context";
import { AppShell } from "@/components/app-shell";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <CompanyProvider>
      <CompanyGate>
        <AppShell>
          <Outlet />
        </AppShell>
      </CompanyGate>
    </CompanyProvider>
  );
}

function CompanyGate({ children }: { children: React.ReactNode }) {
  const { loading, companies, roles } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();

  const hasElevatedAccess = roles.some((role) =>
    ["admin", "fleet_manager", "dispatcher"].includes(role),
  );
  const hasWarehouseRole = roles.some((role) =>
    [
      "warehouse_manager",
      "warehouse_supervisor",
      "warehouse_operator",
      "inventory_controller",
      "forklift_operator",
      "receiving_clerk",
      "packing_clerk",
      "quality_inspector",
    ].includes(role),
  );
  const driverRestricted = roles.includes("driver") && !hasElevatedAccess && !hasWarehouseRole;
  const warehouseRestricted = hasWarehouseRole && !hasElevatedAccess;
  const hasCrmRole = roles.some((role) =>
    [
      "sales_manager",
      "sales_representative",
      "customer_success_manager",
      "customer_care",
      "finance_manager",
    ].includes(role),
  );
  const crmRestricted = hasCrmRole && !hasElevatedAccess && !hasWarehouseRole;
  const hasHrRole = roles.some((role) =>
    [
      "hr_manager",
      "hr_officer",
      "operations_manager",
      "department_manager",
      "payroll_officer",
      "supervisor",
      "employee",
    ].includes(role),
  );
  const hrRestricted = hasHrRole && !hasElevatedAccess && !hasWarehouseRole && !hasCrmRole;

  useEffect(() => {
    if (!loading && companies.length === 0) navigate({ to: "/onboarding", replace: true });
  }, [loading, companies.length, navigate]);

  useEffect(() => {
    if (!loading && driverRestricted) {
      const allowed = ["/driver", "/hr", "/notifications"].some((prefix) =>
        location.pathname.startsWith(prefix),
      );
      if (!allowed) {
        navigate({ to: "/driver", replace: true });
      }
    }
  }, [driverRestricted, loading, location.pathname, navigate]);

  useEffect(() => {
    if (!loading && warehouseRestricted) {
      const allowed = ["/warehouse", "/hr", "/notifications"].some((prefix) =>
        location.pathname.startsWith(prefix),
      );
      if (!allowed) {
        navigate({ to: "/warehouse", replace: true });
      }
    }
  }, [warehouseRestricted, loading, location.pathname, navigate]);

  useEffect(() => {
    if (!loading && crmRestricted) {
      const allowed = ["/crm", "/notifications"].some((prefix) =>
        location.pathname.startsWith(prefix),
      );
      if (!allowed) {
        navigate({ to: "/crm", replace: true });
      }
    }
  }, [crmRestricted, loading, location.pathname, navigate]);

  useEffect(() => {
    if (!loading && hrRestricted) {
      const allowed = ["/hr", "/notifications"].some((prefix) =>
        location.pathname.startsWith(prefix),
      );
      if (!allowed) {
        navigate({ to: "/hr", replace: true });
      }
    }
  }, [hrRestricted, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (companies.length === 0) return null;
  return <>{children}</>;
}
