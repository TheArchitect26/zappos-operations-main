import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/executive/")({
  beforeLoad: () => {
    throw redirect({ to: "/executive/live" });
  },
});
