export type EvidenceMatch = {
  id: string;
  title: string;
  source_url: string;
  citation: string;
  content: string;
  evidence_level: string;
  tags: string[];
  similarity: number;
};

export type GroundedAnswer = {
  answer: string;
  evidenceIds: string[];
  limitations: string[];
  clinicalEscalation: boolean;
};

export const RAG_PROMPT_VERSION = "preseed-rag-1";
export const RAG_DISCLAIMER =
  "Research prototype only. Not a diagnosis or medical device. Use a qualified laboratory and clinician for fertility or hormone concerns.";

export async function safetyIdentifier(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`preseed:${userId}`),
  );
  return `preseed_${
    Array.from(new Uint8Array(digest)).slice(0, 16).map((byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("")
  }`;
}

export const answerSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "evidenceIds", "limitations", "clinicalEscalation"],
  properties: {
    answer: { type: "string" },
    evidenceIds: {
      type: "array",
      items: { type: "string" },
    },
    limitations: {
      type: "array",
      items: { type: "string" },
    },
    clinicalEscalation: { type: "boolean" },
  },
} as const;

export function extractResponseText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (typeof item !== "object" || item === null) continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (
        typeof part === "object" && part !== null &&
        (part as { type?: unknown }).type === "output_text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) return (part as { text: string }).text;
    }
  }
  return null;
}

export function validateGroundedAnswer(
  value: unknown,
  allowedEvidenceIds: Set<string>,
): value is GroundedAnswer {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const answer = value as Record<string, unknown>;
  return typeof answer.answer === "string" && answer.answer.trim().length > 0 &&
    answer.answer.length <= 2400 && Array.isArray(answer.evidenceIds) &&
    answer.evidenceIds.length >= 1 && answer.evidenceIds.length <= 8 &&
    new Set(answer.evidenceIds).size === answer.evidenceIds.length &&
    answer.evidenceIds.every((id) =>
      typeof id === "string" && allowedEvidenceIds.has(id)
    ) && Array.isArray(answer.limitations) && answer.limitations.length >= 1 &&
    answer.limitations.length <= 5 &&
    answer.limitations.every((item) =>
      typeof item === "string" && item.length > 0 && item.length <= 400
    ) && typeof answer.clinicalEscalation === "boolean";
}

export function evidencePrompt(matches: EvidenceMatch[]): string {
  const escape = (value: string) =>
    value.replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
  return matches.map((match) =>
    `<evidence id="${escape(match.id)}">\nTitle: ${
      escape(match.title)
    }\nCitation: ${escape(match.citation)}\nContent: ${
      escape(match.content)
    }\n</evidence>`
  ).join("\n\n");
}
