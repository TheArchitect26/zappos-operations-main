import {
  datasetEligible,
  sensitivityAllowed,
  validateAllowedFields,
  type AuthorisedBrainDataset,
  type BrainDatasetContract,
  type BrainEventEnvelope,
} from "../core";

export interface BrainDatasetAdapter<TInput, TRecord extends Record<string, unknown>> {
  datasetCode: string;
  datasetVersion: number;
  load(input: TInput): Promise<AuthorisedBrainDataset<TRecord>>;
}

export interface ReadOnlyDatasetRequest<TRecord extends Record<string, unknown>> {
  contract: BrainDatasetContract;
  event: BrainEventEnvelope;
  actorRoles: readonly string[];
  specificallyApprovedRestrictedUse?: boolean;
  now: Date;
  loadSourceRecords: () => Promise<readonly TRecord[]>;
  sourceRecordExists: (id: string) => Promise<boolean>;
}

export function createReadOnlyDatasetAdapter<
  TRecord extends Record<string, unknown>,
>(): BrainDatasetAdapter<ReadOnlyDatasetRequest<TRecord>, TRecord> {
  return {
    datasetCode: "contract-bound",
    datasetVersion: 1,
    async load(input) {
      if (!datasetEligible(input.contract, input.event, input.actorRoles)) {
        throw new Error("Brain dataset contract is not authorised for this event and role");
      }
      if (
        !sensitivityAllowed(
          input.event.sensitivity,
          input.contract.sensitivity,
          input.specificallyApprovedRestrictedUse,
        )
      ) {
        throw new Error("Event sensitivity is not authorised by the dataset contract");
      }
      if (!(await input.sourceRecordExists(input.event.sourceRecordId))) {
        throw new Error("Source record does not exist in the authorised company scope");
      }
      const records = await input.loadSourceRecords();
      const redactedFields = new Set<string>();
      const sanitised = records.map((record) => {
        const { accepted, rejected } = validateAllowedFields(record, input.contract);
        rejected.forEach((item) => redactedFields.add(item.field));
        return accepted as TRecord;
      });
      const observed = Date.parse(input.event.recordedAt);
      const ageMinutes = Number.isNaN(observed)
        ? Number.POSITIVE_INFINITY
        : Math.max(0, (input.now.getTime() - observed) / 60_000);
      return {
        contract: input.contract,
        event: input.event,
        records: sanitised,
        loadedAt: input.now.toISOString(),
        freshness: ageMinutes > input.contract.freshnessRequirementMinutes ? "stale" : "fresh",
        redactedFields: [...redactedFields].sort(),
      };
    },
  };
}
