import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/customer-portal/preferences")({
  beforeLoad: () => {
    throw redirect({ to: "/customer-portal/settings" });
  },
});
