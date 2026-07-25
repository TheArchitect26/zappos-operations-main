// The existing Phase 8 implementation is the production deterministic baseline.
// This dependency-free bridge keeps Phase 23A output parity while the broader standalone
// Brain rule set remains frozen for extraction review.
export {
  generateDeterministicBrainInsights as runDeterministicBrainV0,
  type DeterministicBrainInput,
} from "@/lib/zapp-brain-integration";
