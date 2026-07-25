import { redactZipValue, type ZipCitation } from "./core";

export interface ZipKnowledgeChunk {
  id: string;
  documentId: string;
  documentVersionId: string;
  title: string;
  text: string;
  allowed: boolean;
  dataClassification: "public" | "internal" | "confidential" | "restricted" | "highly_restricted";
  sourceRecordId?: string | null;
}

const queryTerms = (value: string) =>
  Array.from(new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])).filter(
    (term) => !["with", "from", "that", "this", "show", "what", "which", "about"].includes(term),
  );

export function retrieveAuthorisedKnowledge(input: {
  query: string;
  chunks: readonly ZipKnowledgeChunk[];
  maximumCitations?: number;
}) {
  const terms = queryTerms(input.query);
  if (!terms.length)
    return { citations: [] as ZipCitation[], reason: "A specific query is required" };
  const citations = input.chunks
    .filter(
      (chunk) =>
        chunk.allowed && !["restricted", "highly_restricted"].includes(chunk.dataClassification),
    )
    .map((chunk) => {
      const text = chunk.text.toLowerCase();
      const matched = terms.filter((term) => text.includes(term));
      const score = Math.round((matched.length / terms.length) * 100);
      const position = matched.length ? Math.min(...matched.map((term) => text.indexOf(term))) : 0;
      return { chunk, score, position };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.position - right.position)
    .slice(0, input.maximumCitations ?? 5)
    .map(({ chunk, score }) => ({
      documentId: chunk.documentId,
      documentVersionId: chunk.documentVersionId,
      chunkId: chunk.id,
      title: chunk.title,
      excerpt: excerptForCitation(chunk.text, terms),
      sourceType: "knowledge_document" as const,
      sourceRecordId: chunk.sourceRecordId ?? null,
      score,
    }));
  return {
    citations,
    reason: citations.length ? null : "No authorised matching knowledge was found",
  };
}

export function excerptForCitation(text: string, terms: readonly string[], maximumLength = 360) {
  const lower = text.toLowerCase();
  const firstMatch =
    terms.map((term) => lower.indexOf(term)).find((position) => position >= 0) ?? 0;
  const start = Math.max(0, firstMatch - 100);
  const excerpt = text.slice(start, start + maximumLength).trim();
  return String(redactZipValue(excerpt));
}

export function validateCitations(input: {
  citations: readonly ZipCitation[];
  answer: string;
  minimumCitations?: number;
}) {
  const errors = [
    input.citations.length < (input.minimumCitations ?? 1) &&
      "At least one authorised citation is required",
    !input.answer.trim() && "Answer is empty",
    input.citations.some((citation) => !citation.excerpt || !citation.chunkId) &&
      "Citation is incomplete",
  ].filter((value): value is string => Boolean(value));
  return { valid: errors.length === 0, errors };
}
