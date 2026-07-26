"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { EvidenceCard } from "@/components/domain";
import { Card, Disclosure, SectionHeader, Segmented, StatusChip } from "@/components/ui";
import { evidence, reviewStatusLabel, type ReviewStatus } from "@/lib/fixtures";

type Filter = "all" | "usable" | "pending" | "candidate";

const filterToStatus: Record<Exclude<Filter, "all">, ReviewStatus> = {
  usable: "internal_review",
  pending: "clinical_review_pending",
  candidate: "research_candidate",
};

export default function EvidencePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? evidence : evidence.filter((claim) => claim.reviewStatus === filterToStatus[filter]);

  const counts = {
    usable: evidence.filter((claim) => claim.reviewStatus === "internal_review").length,
    pending: evidence.filter((claim) => claim.reviewStatus === "clinical_review_pending").length,
    candidate: evidence.filter((claim) => claim.reviewStatus === "research_candidate").length,
  };

  return (
    <Screen title="Evidence" eyebrow={`${evidence.length} claims`}>
      {/* Library-level honesty, so no individual card has to carry it alone. */}
      <Card tone="attention">
        <div className="flex gap-3">
          <Icon name="attention" size={20} className="mt-0.5 shrink-0 text-attention" />
          <div>
            <h2 className="t-title-3 text-ink-1">Evidence review status</h2>
            <p className="mt-1.5 t-body-sm text-ink-2">
              No claim here has completed the clinical review required before a research finding becomes a
              user-facing medical recommendation. Cards marked internal review are the only ones PreSeed
              will attach to a recommendation, and even those carry their limitations on the card.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <Segmented
          label="Filter by review status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "usable", label: `Usable ${counts.usable}` },
            { value: "pending", label: `Pending ${counts.pending}` },
            { value: "candidate", label: `Candidate ${counts.candidate}` },
          ]}
        />
      </div>

      {filter === "candidate" || filter === "all" ? (
        <p className="mt-4">
          <StatusChip tone="escalation" glyph="attention">
            Candidates cannot appear in recommendations
          </StatusChip>
        </p>
      ) : null}

      <section className="mt-5" aria-labelledby="claims">
        <SectionHeader
          id="claims"
          eyebrow={filter === "all" ? "Everything" : reviewStatusLabel[filterToStatus[filter]]}
          title={`${shown.length} ${shown.length === 1 ? "claim" : "claims"}`}
        />
        <div className="space-y-3">
          {shown.map((claim) => (
            <EvidenceCard key={claim.id} claim={claim} href={`/evidence/${claim.id}`} compact />
          ))}
        </div>
      </section>

      <Card className="mt-6">
        <Disclosure label="What the three statuses mean" glyph="info" defaultOpen>
          <dl className="space-y-3">
            <div>
              <dt className="t-body-sm font-medium text-ink-1">Reviewed</dt>
              <dd className="mt-0.5 t-body-sm text-ink-2">
                The source has been retrieved and read, the endpoint and study design recorded, and the
                limitations written down. Clinical review is still outstanding. These may back a
                recommendation.
              </dd>
            </div>
            <div>
              <dt className="t-body-sm font-medium text-ink-1">Clinical review pending</dt>
              <dd className="mt-0.5 t-body-sm text-ink-2">
                Real and cited, but the evidence is early or the interpretation needs a clinician before it
                shapes advice. Visible for reading; not used to justify an action.
              </dd>
            </div>
            <div>
              <dt className="t-body-sm font-medium text-ink-1">Research candidate</dt>
              <dd className="mt-0.5 t-body-sm text-ink-2">
                A figure someone supplied that has not been traced to a paper. Deliberately styled to look
                unfinished, and excluded from recommendations by construction rather than by policy.
              </dd>
            </div>
          </dl>
        </Disclosure>
        <Disclosure label="Why endpoints are named on every card" glyph="target">
          <p className="t-prose text-ink-1">
            Research described as being about male fertility might have measured hormones, concentration,
            motility, morphology, DNA fragmentation, time to pregnancy or live birth. An exposure can
            affect one of those without any proven effect on the others, so a claim without its endpoint is
            not a usable claim.
          </p>
        </Disclosure>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
