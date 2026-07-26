import type { ClinicalTest, MarkerCode } from "@/lib/clinical";
import { edgeApiUrl, getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Envelope<T> = { data: T };

export type SemenProfileArtifact = {
  id: string;
  version: number;
  measurements: Array<{
    code: MarkerCode;
    value: number;
    unit: string;
    referenceContext: "below_reference" | "within_reference" | "above_reference" | "no_reference";
    derived: boolean;
  }>;
  synthesis: {
    summary: string;
    parameterContexts: Array<{
      markerCode: MarkerCode;
      emphasis: string;
      mechanisms: string[];
      improvementOpportunities: string[];
      evidenceIds: string[];
      clinicalEscalation: boolean;
    }>;
    protocolSuggestions: Array<{
      category: string;
      title: string;
      rationale: string;
      evidenceStatus: "evidence_backed" | "general_guidance";
      evidenceIds: string[];
    }>;
    collectionCautions: string[];
    missingInputs: string[];
    clinicalEscalations: string[];
    limitations: string[];
  };
  evidenceIds: string[];
  createdAt: string;
};

const canonicalUnits: Partial<Record<MarkerCode, string>> = {
  concentration_million_ml: "million/mL",
  total_count_million: "million",
  total_motile_count_million: "million",
  progressive_motile_count_million: "million",
  seminal_leukocytes_million_ml: "million/mL",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = edgeApiUrl(path);
  if (!url) throw new Error("The data engine is not configured in this environment.");
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  const accessToken = session?.data.session?.access_token;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "The data engine could not complete this request.");
  }
  return (payload as Envelope<T>).data;
}

function normalizeArtifact(raw: Record<string, unknown>): SemenProfileArtifact {
  return {
    id: String(raw.id),
    version: Number(raw.version),
    measurements: raw.measurements as SemenProfileArtifact["measurements"],
    synthesis: raw.synthesis as SemenProfileArtifact["synthesis"],
    evidenceIds: (raw.evidenceIds ?? raw.evidence_ids) as string[],
    createdAt: String(raw.createdAt ?? raw.created_at),
  };
}

export async function persistClinicalTest(test: ClinicalTest) {
  const created = await request<{ id: string }>("clinical-tests", {
    method: "POST",
    body: JSON.stringify({
      testType: test.testType,
      source: test.source,
      collectedAt: test.collectedAt,
      labName: test.labName,
      abstinenceHours: test.abstinenceHours,
      collectionComplete: test.collectionComplete,
      recentFever: test.recentFever,
      notes: test.notes,
    }),
  });
  await request(`clinical-tests/${created.id}/markers`, {
    method: "PUT",
    body: JSON.stringify({
      markers: test.markers.map((marker) => ({
        ...marker,
        unit: canonicalUnits[marker.code] ?? marker.unit,
      })),
    }),
  });
}

export async function compileSemenProfile() {
  return normalizeArtifact(await request<Record<string, unknown>>(
    "data-engine/semen-profile/compile",
    { method: "POST" },
  ));
}

export async function getCurrentSemenProfile() {
  return normalizeArtifact(await request<Record<string, unknown>>(
    "data-engine/semen-profile/current",
  ));
}
