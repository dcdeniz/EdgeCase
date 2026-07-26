"use client";

import { useEffect, useState } from "react";
import { Card, MetaBadge, SectionHeader, StatusChip } from "@/components/ui";
import { markerCatalogue } from "@/lib/clinical";
import { getCurrentSemenProfile, type SemenProfileArtifact } from "@/lib/data-engine-client";

export function DataEngineProfile({ view }: { view: "profile" | "protocol" }) {
  const [artifact, setArtifact] = useState<SemenProfileArtifact | null>(null);

  useEffect(() => {
    void getCurrentSemenProfile().then(setArtifact).catch(() => undefined);
  }, []);

  if (!artifact) return null;

  if (view === "protocol") {
    if (artifact.synthesis.protocolSuggestions.length === 0) return null;
    return (
      <section className="mt-6" aria-labelledby="engine-suggestions">
        <SectionHeader
          id="engine-suggestions"
          eyebrow={`Profile v${artifact.version}`}
          title="Why this plan is emphasised"
        />
        <div className="space-y-3">
          {artifact.synthesis.protocolSuggestions.map((suggestion) => (
            <Card key={`${suggestion.category}-${suggestion.title}`}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone={suggestion.evidenceStatus === "evidence_backed" ? "supported" : "unavailable"}>
                  {suggestion.evidenceStatus === "evidence_backed" ? "Evidence-backed" : "General guidance"}
                </StatusChip>
                <MetaBadge glyph="info">{suggestion.category.replaceAll("_", " ")}</MetaBadge>
              </div>
              <h3 className="mt-2 t-title-3 text-ink-1">{suggestion.title}</h3>
              <p className="mt-1.5 t-body-sm text-ink-2">{suggestion.rationale}</p>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="engine-context">
      <SectionHeader
        id="engine-context"
        eyebrow={`Structured profile v${artifact.version}`}
        title="What these results change"
      />
      <Card tone="information">
        <p className="t-body-sm text-ink-1">{artifact.synthesis.summary}</p>
        <p className="mt-2 t-caption text-ink-3">
          Compiled from {artifact.measurements.length} measured or derived values and {artifact.evidenceIds.length} approved evidence passages.
        </p>
      </Card>
      <div className="mt-3 space-y-3">
        {artifact.synthesis.parameterContexts.map((context) => (
          <Card key={context.markerCode}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="t-title-3 text-ink-1">
                {markerCatalogue[context.markerCode]?.label ?? context.markerCode}
              </h3>
              <StatusChip tone={context.clinicalEscalation ? "attention" : "supported"}>
                {context.clinicalEscalation ? "Clinical review" : "Evidence-linked"}
              </StatusChip>
            </div>
            <p className="mt-2 t-body-sm text-ink-2">{context.emphasis}</p>
            {context.improvementOpportunities.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 t-body-sm text-ink-2">
                {context.improvementOpportunities.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
