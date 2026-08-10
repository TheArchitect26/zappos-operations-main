import { PredictiveSubview } from "@/components/fleet-predictive/predictive-workspace";
export const subview = (section: Parameters<typeof PredictiveSubview>[0]["section"]) => () => (
  <PredictiveSubview section={section} />
);
