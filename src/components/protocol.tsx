"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { AdherenceBand } from "@/components/charts";
import { CategoryChip, CitationButton } from "@/components/domain";
import { ProtocolRing } from "@/components/protocol-ring";
import {
  Button,
  Card,
  ConfirmSheet,
  MetaBadge,
  SectionHeader,
  StatusChip,
  announce,
  cx,
} from "@/components/ui";
import { categoryLabel, weeklyFocus, type ProtocolItem } from "@/lib/fixtures";
import { TODAY, addDays, formatDate, formatDateShort, relativeDays } from "@/lib/format";
import {
  adherenceKey,
  adherenceWindow,
  itemsForWeek,
  protocolDay,
  protocolWeek,
  usePrototype,
  type ActiveProtocol,
  type AdherenceStatus,
} from "@/lib/store";

/* ==========================================================================
   Protocol header
   ========================================================================== */

export function ProtocolProgress({ protocol }: { protocol: ActiveProtocol }) {
  const day = protocolDay(protocol);
  const week = protocolWeek(protocol);
  const percent = Math.round((day / protocol.days) * 100);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="t-micro text-ink-3">Protocol</p>
        <div className="text-right">
          <p className="t-mono text-ink-3">week {week}</p>
          <p className="t-mono text-ink-3">v{protocol.version}</p>
        </div>
      </div>

      <div className="mt-1 flex justify-center">
        <ProtocolRing day={day} total={protocol.days} />
      </div>

      <p className="mt-2 text-center t-caption text-ink-3">{percent}% complete</p>

      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="t-micro text-ink-3">Started</dt>
          <dd className="mt-0.5 t-body-sm text-ink-1">{formatDate(protocol.startsOn)}</dd>
        </div>
        <div>
          <dt className="t-micro text-ink-3">Retest due</dt>
          <dd className="mt-0.5 t-body-sm text-ink-1">
            {formatDate(protocol.retestDueOn)}
            <span className="ml-1.5 t-caption text-ink-3">{relativeDays(protocol.retestDueOn)}</span>
          </dd>
        </div>
      </dl>

      <p className="mt-3 border-t border-hairline pt-3 t-caption text-ink-2">
        <span className="t-micro text-ink-3">This week</span>
        <br />
        {weeklyFocus[Math.min(week, weeklyFocus.length) - 1]}
      </p>
    </Card>
  );
}

/* ==========================================================================
   Adherence
   --------------------------------------------------------------------------
   Consistency over a rolling window, never a streak. There is no count to
   break, so a gap costs information rather than status.
   ========================================================================== */

export function ConsistencyCard() {
  const { state } = usePrototype();
  const window = adherenceWindow(state, 14);
  if (!state.protocol) return null;

  const days = Array.from({ length: 14 }).map((_, index) => {
    const date = addDays(TODAY, -(13 - index));
    const week = protocolWeek(state.protocol!, date);
    const items = itemsForWeek(state.protocol!, week);
    const statuses = items
      .map((item) => state.adherence[adherenceKey(item.id, date)])
      .filter(Boolean) as AdherenceStatus[];
    if (statuses.length === 0) return { date, status: "none" as const };
    const completed = statuses.filter((status) => status === "completed").length;
    const ratio = completed / statuses.length;
    return {
      date,
      status: ratio >= 0.7 ? ("completed" as const) : ratio >= 0.3 ? ("partial" as const) : ("skipped" as const),
    };
  });

  return (
    <Card>
      <SectionHeader
        eyebrow="Consistency · last 14 days"
        title={window.percent == null ? "Nothing logged yet" : `${window.percent}% of logged actions`}
      />
      <AdherenceBand days={days} />
      <p className="mt-3 t-caption text-ink-2">
        A rolling window rather than a streak. Missing a day changes the percentage slightly and
        nothing else — sperm production runs on a cycle of about 64 to 74 days, so no single day
        matters on its own.
      </p>
    </Card>
  );
}

/* ==========================================================================
   Protocol action
   ========================================================================== */

const statusOptions: Array<{ value: AdherenceStatus; label: string; glyph: "check" | "partial-circle" | "skip-circle" }> = [
  { value: "completed", label: "Done", glyph: "check" },
  { value: "partial", label: "Partly", glyph: "partial-circle" },
  { value: "skipped", label: "Skipped", glyph: "skip-circle" },
];

export function ProtocolAction({
  item,
  date = TODAY,
  showLink = true,
}: {
  item: ProtocolItem;
  date?: string;
  showLink?: boolean;
}) {
  const { state, logAdherence } = usePrototype();
  const current = state.adherence[adherenceKey(item.id, date)];

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryChip category={item.category} />
            {item.evidenceStatus === "evidence_backed" ? (
              <StatusChip tone="supported" glyph="evidence">
                Evidence-backed
              </StatusChip>
            ) : (
              <StatusChip tone="unavailable" glyph="info">
                General guidance
              </StatusChip>
            )}
          </div>
          <h3 className="mt-2 t-title-3 text-ink-1">{item.title}</h3>
          <p className="mt-1 t-body-sm text-ink-2">{item.description}</p>
        </div>
      </div>

      {/* Three states, each with its own glyph and word. */}
      <div role="group" aria-label={`Log ${item.title}`} className="mt-3 flex gap-2">
        {statusOptions.map((option) => {
          const active = current === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                logAdherence(item.id, date, option.value);
                announce(`${item.title} marked ${option.label.toLowerCase()}`);
              }}
              className={cx(
                "flex min-h-(--ps-touch-min) flex-1 items-center justify-center gap-1.5 rounded-sm border t-caption font-medium",
                "transition-colors duration-(--ps-duration-fast)",
                active
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line-control text-ink-2 hover:bg-surface-3",
              )}
            >
              <Icon name={option.glyph} size={15} />
              {option.label}
            </button>
          );
        })}
      </div>

      {showLink ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">
          {item.reasoningId ? (
            <Link
              href={`/results/reasoning/${item.reasoningId}`}
              className="inline-flex min-h-(--ps-touch-min) items-center gap-1.5 rounded-sm border border-line-control px-3 py-2 t-body-sm font-medium text-ink-1 hover:bg-surface-3"
            >
              <Icon name="target" size={16} className="text-ink-3" />
              Why this is in my plan
            </Link>
          ) : null}
          {item.evidenceIds.length > 0 ? <CitationButton ids={item.evidenceIds} /> : null}
        </div>
      ) : null}
    </Card>
  );
}

/* ==========================================================================
   Timeline
   ========================================================================== */

export function ProtocolTimeline({ protocol }: { protocol: ActiveProtocol }) {
  const currentWeek = protocolWeek(protocol);
  const totalWeeks = Math.ceil(protocol.days / 7);
  const [openWeek, setOpenWeek] = useState(currentWeek);

  return (
    <ol className="m-0 list-none space-y-2 p-0">
      {Array.from({ length: totalWeeks }).map((_, index) => {
        const week = index + 1;
        const items = itemsForWeek(protocol, week);
        const isCurrent = week === currentWeek;
        const isPast = week < currentWeek;
        const open = openWeek === week;
        const weekStart = addDays(protocol.startsOn, index * 7);

        return (
          <li key={week}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenWeek(open ? 0 : week)}
              className={cx(
                "flex min-h-(--ps-touch-min) w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-left",
                isCurrent ? "border-accent bg-accent-quiet" : "border-hairline bg-surface-1",
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "flex size-7 shrink-0 items-center justify-center rounded-full t-mono",
                  isCurrent
                    ? "bg-accent text-accent-ink"
                    : isPast
                      ? "border border-line-control text-ink-3"
                      : "border border-dashed border-hairline text-ink-3",
                )}
              >
                {week}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block t-body-sm font-medium text-ink-1">
                  Week {week}
                  {isCurrent ? <span className="ml-2 t-caption text-accent">Current</span> : null}
                </span>
                <span className="block t-caption text-ink-3">
                  {formatDateShort(weekStart)} · {items.length} actions
                </span>
              </span>
              <Icon
                name="chevron-down"
                size={18}
                className={cx("shrink-0 text-ink-3 transition-transform duration-(--ps-duration-base)", open && "rotate-180")}
              />
            </button>

            {open ? (
              <div className="mt-2 space-y-2 pl-3">
                <p className="t-caption text-ink-2">{weeklyFocus[Math.min(week, weeklyFocus.length) - 1]}</p>
                {items.map((item) => (
                  <div key={item.id} className="rounded-sm border border-hairline bg-surface-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="t-body-sm text-ink-1">{item.title}</span>
                      <span className="shrink-0 t-mono text-ink-3">{item.cadence}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <CategoryChip category={item.category} />
                      {item.evidenceStatus === "general_guidance" ? (
                        <StatusChip tone="unavailable" glyph="info">
                          General guidance
                        </StatusChip>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/* ==========================================================================
   Adaptation
   --------------------------------------------------------------------------
   Proposed and confirmed. The plan is never rewritten silently.
   ========================================================================== */

export function AdaptationProposal() {
  const { state, acceptAdaptation, dismissAdaptation } = usePrototype();
  const [confirming, setConfirming] = useState(false);
  const adaptation = state.adaptation;
  if (!adaptation) return null;

  return (
    <Card tone="information" className="border-l-2 border-l-information">
      <div className="flex items-start gap-3">
        <Icon name="info" size={20} className="mt-0.5 shrink-0 text-information" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="t-title-3 text-ink-1">A change to your plan is proposed</h3>
            <StatusChip tone="information" glyph="pending">
              Needs your confirmation
            </StatusChip>
          </div>
          <p className="mt-1.5 t-body-sm text-ink-2">{adaptation.reason}</p>

          <ul className="mt-3 space-y-2">
            {adaptation.changes.map((change) => (
              <li key={change.title} className="rounded-sm border border-hairline bg-surface-1 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 t-micro text-information">
                    {change.kind === "add" ? "Add" : change.kind === "remove" ? "Remove" : "Adjust"}
                  </span>
                  <div className="min-w-0">
                    <p className="t-body-sm text-ink-1">{change.title}</p>
                    <p className="mt-0.5 t-caption text-ink-3">{change.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-3 t-caption text-ink-3">
            Accepting creates version {state.protocol ? state.protocol.version + 1 : 2} of your protocol.
            Your previous version stays on record.
          </p>

          <div className="mt-3 flex gap-2">
            <Button variant="secondary" full onClick={dismissAdaptation}>
              Keep current plan
            </Button>
            <Button full onClick={() => setConfirming(true)}>
              Review and accept
            </Button>
          </div>
        </div>
      </div>

      <ConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          acceptAdaptation();
          announce("Protocol updated to a new version");
        }}
        title="Accept these changes?"
        confirmLabel="Accept changes"
        body={
          <>
            <p>
              This replaces your current protocol with a new version. The evidence basis for each action
              does not change.
            </p>
            <ul className="mt-3 space-y-1.5">
              {adaptation.changes.map((change) => (
                <li key={change.title} className="flex gap-2">
                  <Icon name="chevron-right" size={15} className="mt-0.5 shrink-0 text-ink-3" />
                  {change.title}
                </li>
              ))}
            </ul>
          </>
        }
      />
    </Card>
  );
}

/* ==========================================================================
   Retest prompt
   ========================================================================== */

export function RetestPrompt({ protocol }: { protocol: ActiveProtocol }) {
  const { baselineSemen } = usePrototype();
  return (
    <Card tone="accent">
      <div className="flex items-start gap-3">
        <Icon name="calendar" size={20} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h3 className="t-title-3 text-ink-1">Closing analysis due {relativeDays(protocol.retestDueOn)}</h3>
          <p className="mt-1.5 t-body-sm text-ink-2">
            {formatDate(protocol.retestDueOn)}. Matching your collection conditions is what makes the two
            results comparable — this matters more now than anything else in your plan.
          </p>
          {baselineSemen?.abstinenceHours != null ? (
            <p className="mt-2.5 flex flex-wrap items-center gap-2">
              <MetaBadge glyph="pending">Aim for {baselineSemen.abstinenceHours}h abstinence</MetaBadge>
              {baselineSemen.labName ? <MetaBadge glyph="lab">{baselineSemen.labName}</MetaBadge> : null}
            </p>
          ) : null}
          <div className="mt-3">
            <Link
              href="/tests/new"
              className="inline-flex min-h-(--ps-touch-min) items-center gap-2 rounded-sm bg-accent px-4 t-body-sm font-medium text-accent-ink"
            >
              <Icon name="plus" size={17} />
              Enter the result
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { categoryLabel };
