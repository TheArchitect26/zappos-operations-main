export function validateLegacyMapping(input: {
  legacySource: string;
  legacyRecordType: string;
  legacyRecordId: string;
  zapposRecordId: string;
  companyId: string;
  mappedCompanyId: string;
  recordIsDerived: boolean;
}) {
  if (!input.recordIsDerived)
    return { valid: false, reason: "Business records must not be migrated from Brain" };
  if (
    !input.legacySource ||
    !input.legacyRecordType ||
    !input.legacyRecordId ||
    !input.zapposRecordId
  ) {
    return { valid: false, reason: "Legacy and ZappOS record identifiers are required" };
  }
  if (input.companyId !== input.mappedCompanyId)
    return { valid: false, reason: "Explicit company mapping is required" };
  return { valid: true, reason: null };
}
