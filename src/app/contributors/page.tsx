"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { ContributorList } from "@/components/profile-board";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { Card, Segmented } from "@/components/ui";
import { contributorsFor, strengthLabel, type ContributorStrength } from "@/lib/contributors";
import { usePrototype } from "@/lib/store";

type Filter = "all" | ContributorStrength;

/**
 * Everything in the user's record that is associated with a semen parameter,
 * on its own screen.
 *
 * Moved off Today because the list is long and its caveats matter: an
 * association list read in passing, sandwiched between a score and a protocol,
 * is the one most likely to be misread as a list of causes.
 */
export default function ContributorsPage() {
  const { state, latestSemen } = usePrototype();
  const [filter, setFilter] = useState<Filter>("all");

  const all = useMemo(() => contributorsFor(state), [state]);
  const shown = filter === "all" ? all : all.filter((row) => row.strength === filter);

  const counts = {
    established: all.filter((row) => row.strength === "established").length,
    probable: all.filter((row) => row.strength === "probable").length,
    emerging: all.filter((row) => row.strength === "emerging").length,
  };

  return (
    <Screen title="Contributors" eyebrow="From your own inputs" back="/today">
      <Segmented<Filter>
        label="Filter by evidence strength"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All ${all.length}` },
          { value: "established", label: `Consistent ${counts.established}` },
          { value: "probable", label: `Probable ${counts.probable}` },
          { value: "emerging", label: `Emerging ${counts.emerging}` },
        ]}
      />

      <div className="mt-4">
        {shown.length === 0 ? (
          <Card>
            <p className="t-body-sm text-ink-2">
              Nothing in your record matches {strengthLabel[filter as ContributorStrength]}.
            </p>
          </Card>
        ) : (
          <ContributorList contributors={shown} test={latestSemen} />
        )}
      </div>

      <p className="mt-4 flex gap-2 t-caption text-ink-3">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Ordered by evidence strength, not by how much each affects you. No ranking of personal
        impact is possible from this evidence.
      </p>

      <DisclaimerFooter />
    </Screen>
  );
}
