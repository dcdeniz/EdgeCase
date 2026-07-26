"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ==========================================================================
   Status vocabulary
   --------------------------------------------------------------------------
   Every state in PreSeed is a (tone, glyph, word) triple. Colour is the third
   channel, never the first — so the meaning survives greyscale, colour
   blindness and forced-colors mode.
   ========================================================================== */

export type Tone =
  | "neutral"
  | "accent"
  | "supported"
  | "attention"
  | "escalation"
  | "information"
  | "unavailable";

const toneInk: Record<Tone, string> = {
  neutral: "text-ink-2",
  accent: "text-accent",
  supported: "text-supported",
  attention: "text-attention",
  escalation: "text-escalation",
  information: "text-information",
  unavailable: "text-unavailable",
};

const toneWash: Record<Tone, string> = {
  neutral: "bg-surface-3",
  accent: "bg-accent-quiet",
  supported: "bg-supported-quiet",
  attention: "bg-attention-quiet",
  escalation: "bg-escalation-quiet",
  information: "bg-information-quiet",
  unavailable: "bg-unavailable-quiet",
};

export const toneGlyph: Record<Tone, IconName> = {
  neutral: "info",
  accent: "check-circle",
  supported: "check-circle",
  attention: "attention",
  escalation: "escalation",
  information: "info",
  unavailable: "unavailable",
};

/** A state label. The glyph is mandatory; the word is mandatory. */
export function StatusChip({
  tone = "neutral",
  glyph,
  children,
  className,
}: {
  tone?: Tone;
  glyph?: IconName;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-xs px-2 py-1 t-micro",
        toneWash[tone],
        toneInk[tone],
        className,
      )}
    >
      <Icon name={glyph ?? toneGlyph[tone]} size={13} />
      {children}
    </span>
  );
}

/** Provenance and verification metadata. Quiet by design — it is context. */
export function MetaBadge({
  glyph,
  children,
  tone = "neutral",
}: {
  glyph: IconName;
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-xs border border-hairline px-1.5 py-0.5 t-mono",
        tone === "neutral" ? "text-ink-3" : toneInk[tone],
      )}
    >
      <Icon name={glyph} size={12} />
      {children}
    </span>
  );
}

/**
 * The simulated-data marker. Present wherever simulated values are rendered —
 * list, detail, chart, export. Non-negotiable, per the safety guardrails.
 */
export function SimulatedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xs bg-information-quiet px-2 py-1 t-micro text-information">
      <Icon name="simulated" size={13} />
      {compact ? "Simulated" : "Simulated data"}
    </span>
  );
}

/* ==========================================================================
   Buttons
   ========================================================================== */

type ButtonVariant = "primary" | "secondary" | "quiet" | "escalation";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium " +
  "transition-colors duration-(--ps-duration-fast) select-none " +
  "min-h-(--ps-touch-min) px-4 disabled:opacity-45 disabled:cursor-not-allowed " +
  "aria-disabled:opacity-45 aria-disabled:cursor-not-allowed";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-110 active:brightness-95",
  secondary:
    "border border-line-control text-ink-1 bg-surface-1 hover:bg-surface-3 active:bg-surface-3",
  quiet: "text-accent hover:bg-accent-quiet active:bg-accent-quiet",
  escalation:
    "border border-escalation text-escalation bg-escalation-quiet hover:brightness-110",
};

export function Button({
  variant = "primary",
  size = "md",
  glyph,
  glyphAfter,
  full,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  glyph?: IconName;
  glyphAfter?: IconName;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      className={cx(
        buttonBase,
        buttonVariants[variant],
        size === "lg" ? "t-body py-3.5" : "t-body-sm py-2.5",
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {glyph ? <Icon name={glyph} size={18} /> : null}
      {children}
      {glyphAfter ? <Icon name={glyphAfter} size={18} /> : null}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  glyph,
  glyphAfter,
  full,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  glyph?: IconName;
  glyphAfter?: IconName;
  full?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(
        buttonBase,
        buttonVariants[variant],
        size === "lg" ? "t-body py-3.5" : "t-body-sm py-2.5",
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {glyph ? <Icon name={glyph} size={18} /> : null}
      {children}
      {glyphAfter ? <Icon name={glyphAfter} size={18} /> : null}
    </Link>
  );
}

/**
 * An action whose backend does not exist yet.
 *
 * `aria-disabled` rather than `disabled` keeps it focusable, so a screen-reader
 * user can land on it and hear why it does nothing. Per the Strava critique:
 * constraints must be visible before effort is invested, not after.
 */
export function PendingAction({
  children,
  reason,
  glyph,
  full,
}: {
  children: React.ReactNode;
  reason: string;
  glyph?: IconName;
  full?: boolean;
}) {
  const id = useId();
  return (
    <div className={full ? "w-full" : undefined}>
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={id}
        onClick={(event) => event.preventDefault()}
        className={cx(
          buttonBase,
          "t-body-sm py-2.5 border border-dashed border-line-control text-ink-3 bg-transparent",
          full && "w-full",
        )}
      >
        {glyph ? <Icon name={glyph} size={18} /> : null}
        {children}
        <Icon name="pending" size={15} />
      </button>
      <p id={id} className="mt-1.5 t-caption text-ink-3">
        {reason}
      </p>
    </div>
  );
}

/* ==========================================================================
   Surfaces
   ========================================================================== */

export function Card({
  as: As = "div",
  tone,
  inset,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  tone?: Tone;
  inset?: boolean;
}) {
  return (
    <As
      className={cx(
        "rounded-md border",
        tone && tone !== "neutral"
          ? cx(toneWash[tone], "border-transparent")
          : "bg-surface-1 border-transparent shadow-e1",
        inset ? "p-3.5" : "p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

/** A tappable row that navigates. The whole row is the target, min 44px tall. */
export function RowLink({
  href,
  eyebrow,
  title,
  detail,
  trailing,
  glyph,
  className,
}: {
  href: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  detail?: React.ReactNode;
  trailing?: React.ReactNode;
  glyph?: IconName;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "flex min-h-(--ps-touch-min) items-center gap-3 rounded-sm px-3 py-3",
        "transition-colors duration-(--ps-duration-fast) hover:bg-surface-3 active:bg-surface-3",
        className,
      )}
    >
      {glyph ? <Icon name={glyph} size={20} className="shrink-0 text-ink-3" /> : null}
      <span className="min-w-0 flex-1">
        {eyebrow ? <span className="block t-micro text-ink-3">{eyebrow}</span> : null}
        <span className="block t-body-sm font-medium text-ink-1">{title}</span>
        {detail ? <span className="mt-0.5 block t-caption text-ink-2">{detail}</span> : null}
      </span>
      {trailing}
      <Icon name="chevron-right" size={18} className="shrink-0 text-ink-3" />
    </Link>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
  id,
  level = 2,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <p className="t-micro text-ink-3">{eyebrow}</p> : null}
        <Heading id={id} className={cx(level === 2 ? "t-title-2" : "t-title-3", "text-ink-1")}>
          {title}
        </Heading>
      </div>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-0 border-t border-hairline", className)} />;
}

/** Label/value pairs. Values are mono because they are recorded facts. */
export function MetaList({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode; hint?: string }>;
}) {
  return (
    <dl className="divide-y divide-hairline">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="t-caption text-ink-3">
            {item.label}
            {item.hint ? <span className="block text-ink-3/80">{item.hint}</span> : null}
          </dt>
          <dd className="t-mono text-right text-ink-1">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ==========================================================================
   Inputs
   ========================================================================== */

/**
 * Field wrapper.
 *
 * The hint sits *above* the control so autocomplete popovers and mobile
 * keyboards cannot cover it. Errors appear only after the user commits a value
 * (`:user-invalid`), never while typing.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="block t-body-sm font-medium text-ink-1">
        {label}
        {optional ? <span className="ml-1.5 t-caption font-normal text-ink-3">Optional</span> : null}
      </label>
      {hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1 t-caption text-ink-3">
          {hint}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="mt-1.5 flex items-start gap-1.5 t-caption text-escalation"
        >
          <Icon name="attention" size={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  "w-full min-h-(--ps-touch-min) rounded-sm border border-line-control bg-surface-1 " +
  "px-3 py-2.5 t-body text-ink-1 placeholder:text-ink-3 " +
  "transition-colors duration-(--ps-duration-fast) " +
  "user-invalid:border-escalation user-invalid:border-2";

/** A measurement input. Unit is rendered, not typed — units are a contract. */
export function UnitInput({
  id,
  unit,
  hint,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; unit: string; hint?: boolean }) {
  return (
    <div className="flex items-stretch">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cx(controlBase, "rounded-r-none border-r-0 tabular-nums")}
        {...rest}
      />
      <span
        aria-hidden="true"
        className="flex min-w-20 items-center justify-center rounded-r-sm border border-line-control bg-surface-3 px-2.5 t-mono text-ink-2"
      >
        {unit}
      </span>
    </div>
  );
}

export function TextInput({
  id,
  hint,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; hint?: boolean }) {
  return (
    <input
      id={id}
      aria-describedby={hint ? `${id}-hint` : undefined}
      className={controlBase}
      {...rest}
    />
  );
}

export function TextArea({
  id,
  hint,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; hint?: boolean }) {
  return (
    <textarea
      id={id}
      rows={3}
      aria-describedby={hint ? `${id}-hint` : undefined}
      className={cx(controlBase, "resize-y")}
      {...rest}
    />
  );
}

export function Select({
  id,
  hint,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { id: string; hint?: boolean }) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cx(controlBase, "appearance-none pr-10")}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
}

/**
 * Choice list. Radio semantics, card presentation, 44px minimum rows.
 * `note` explains why an option matters; `prefer-not-to-say` is a real option
 * wherever a question is sensitive.
 */
export function ChoiceGroup<T extends string>({
  legend,
  hint,
  name,
  value,
  onChange,
  options,
  multiple = false,
  columns = 1,
}: {
  legend: string;
  hint?: React.ReactNode;
  name: string;
  value: T | T[] | undefined;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string; note?: string; glyph?: IconName }>;
  multiple?: boolean;
  columns?: 1 | 2;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <fieldset className="mb-5">
      <legend className="t-body-sm font-medium text-ink-1">{legend}</legend>
      {hint ? <p className="mt-1 mb-2 t-caption text-ink-3">{hint}</p> : null}
      <div className={cx("mt-2 grid gap-2", columns === 2 && "grid-cols-2")}>
        {options.map((option) => {
          const isOn = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={cx(
                "flex min-h-(--ps-touch-min) cursor-pointer items-start gap-3 rounded-sm border p-3",
                "transition-colors duration-(--ps-duration-fast)",
                isOn
                  ? "border-accent bg-accent-quiet"
                  : "border-line-control bg-surface-1 hover:bg-surface-3",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={option.value}
                checked={isOn}
                onChange={() => onChange(option.value)}
                className="sr-only peer"
              />
              <span
                aria-hidden="true"
                className={cx(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center border",
                  multiple ? "rounded-xs" : "rounded-full",
                  isOn ? "border-accent bg-accent text-accent-ink" : "border-line-control",
                )}
              >
                {isOn ? <Icon name="check" size={13} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block t-body-sm text-ink-1">{option.label}</span>
                {option.note ? (
                  <span className="mt-0.5 block t-caption text-ink-3">{option.note}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Mode switcher. One capture surface, several modes — never several flows. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string; glyph?: IconName }>;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-sm bg-surface-3 p-1">
      {options.map((option) => {
        const isOn = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isOn}
            onClick={() => onChange(option.value)}
            className={cx(
              "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xs px-2 t-caption font-medium",
              "transition-colors duration-(--ps-duration-fast)",
              isOn ? "bg-surface-1 text-ink-1 shadow-e1" : "text-ink-2 hover:text-ink-1",
            )}
          >
            {option.glyph ? <Icon name={option.glyph} size={15} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** 1–5 rating. Numbers are visible so the scale never depends on shape alone. */
export function RatingControl({
  legend,
  hint,
  value,
  onChange,
  lowLabel,
  highLabel,
  name,
}: {
  legend: string;
  hint?: string;
  value: number | undefined;
  onChange: (next: number) => void;
  lowLabel: string;
  highLabel: string;
  name: string;
}) {
  return (
    <fieldset className="mb-5">
      <legend className="t-body-sm font-medium text-ink-1">{legend}</legend>
      {hint ? <p className="mt-1 t-caption text-ink-3">{hint}</p> : null}
      <div className="mt-2.5 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={cx(
              "flex size-11 flex-1 cursor-pointer items-center justify-center rounded-sm border t-body font-medium tabular-nums",
              "transition-colors duration-(--ps-duration-fast)",
              value === n
                ? "border-accent bg-accent text-accent-ink"
                : "border-line-control bg-surface-1 text-ink-2 hover:bg-surface-3",
            )}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            {n}
          </label>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between t-caption text-ink-3">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </fieldset>
  );
}

/* ==========================================================================
   Progressive disclosure
   ========================================================================== */

/**
 * Disclosure. A button controlling a region — not <details>/<summary>, because
 * headings inside <summary> are dropped from screen-reader heading lists.
 */
export function Disclosure({
  label,
  count,
  glyph,
  defaultOpen = false,
  children,
}: {
  label: string;
  count?: React.ReactNode;
  glyph?: IconName;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-t border-hairline first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-(--ps-touch-min) w-full items-center gap-3 py-3 text-left"
      >
        {glyph ? <Icon name={glyph} size={18} className="shrink-0 text-ink-3" /> : null}
        <span className="flex-1 t-body-sm font-medium text-ink-1">{label}</span>
        {count ? <span className="t-caption text-ink-3">{count}</span> : null}
        <Icon
          name="chevron-down"
          size={18}
          className={cx(
            "shrink-0 text-ink-3 transition-transform duration-(--ps-duration-base)",
            open && "rotate-180",
          )}
        />
      </button>
      <div id={id} hidden={!open} className="pb-4">
        {children}
      </div>
    </div>
  );
}

/* ==========================================================================
   Overlays
   ========================================================================== */

/**
 * Bottom sheet built on the native <dialog>.
 *
 * `showModal()` gives inert background content, focus containment and Esc
 * handling from the platform, so there is no focus-trap JavaScript to get
 * wrong. `closedby="any"` adds backdrop dismissal declaratively, with a
 * coordinate-checking fallback for Safari.
 */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;
    const onClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  return (
    <dialog
      ref={ref}
      closedby="any"
      aria-labelledby={titleId}
      onClose={onClose}
      className={cx(
        "m-0 mt-auto max-h-[88dvh] w-full max-w-(--ps-shell-max) overflow-y-auto sm:mx-auto sm:mb-6",
        "rounded-t-xl bg-surface-2 text-ink-1 shadow-e3 sm:rounded-xl",
        "[animation:ps-sheet-in_var(--ps-duration-sheet)_var(--ps-ease-out)]",
      )}
    >
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-hairline bg-surface-2 px-4 pt-4 pb-3">
        <span aria-hidden="true" className="absolute inset-x-0 top-2 mx-auto h-1 w-9 rounded-full bg-line-strong" />
        <div className="min-w-0 flex-1 pt-1">
          {eyebrow ? <p className="t-micro text-ink-3">{eyebrow}</p> : null}
          <h2 id={titleId} className="t-title-2 text-ink-1">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-3"
        >
          <Icon name="close" size={20} label="Close" />
        </button>
      </div>
      <div className="px-4 py-4">{children}</div>
      {footer ? (
        <div className="sticky bottom-0 border-t border-hairline bg-surface-2 px-4 py-3 pad-safe-bottom">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

/** Irreversible or clinically meaningful actions confirm before they commit. */
export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  tone = "accent",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  tone?: "accent" | "escalation";
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === "escalation" ? "escalation" : "primary"}
            full
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="t-body-sm text-ink-2">{body}</div>
    </Sheet>
  );
}

/* ==========================================================================
   Feedback states
   ========================================================================== */

export function Skeleton({ className, lines }: { className?: string; lines?: number }) {
  if (lines) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={cx("h-3.5", index === lines - 1 ? "w-3/5" : "w-full")}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cx(
        "rounded-xs bg-surface-3",
        "bg-[linear-gradient(90deg,transparent,var(--ps-line-hairline),transparent)] bg-[length:200%_100%]",
        "[animation:ps-shimmer_1.6s_var(--ps-ease-in-out)_infinite]",
        className,
      )}
    />
  );
}

/** Loading regions describe what is loading, and never announce themselves. */
export function LoadingBlock({ label }: { label: string }) {
  return (
    <Card>
      <span className="visually-hidden">{label}</span>
      <Skeleton className="mb-3 h-2.5 w-24" />
      <Skeleton className="mb-4 h-8 w-40" />
      <Skeleton lines={3} />
    </Card>
  );
}

export function EmptyState({
  glyph = "results",
  title,
  body,
  action,
}: {
  glyph?: IconName;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-surface-3 text-ink-3"
      >
        <Icon name={glyph} size={22} />
      </span>
      <h3 className="t-title-3 text-ink-1">{title}</h3>
      <div className="mx-auto mt-1.5 max-w-[34ch] t-body-sm text-ink-2">{body}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  requestId,
}: {
  title: string;
  body: React.ReactNode;
  onRetry?: () => void;
  requestId?: string;
}) {
  return (
    <Card tone="escalation" role="group" aria-label={title}>
      <div className="flex gap-3">
        <Icon name="attention" size={20} className="mt-0.5 shrink-0 text-escalation" />
        <div className="min-w-0 flex-1">
          <h3 className="t-title-3 text-ink-1">{title}</h3>
          <div className="mt-1 t-body-sm text-ink-2">{body}</div>
          {requestId ? (
            <p className="mt-2 t-mono text-ink-3">Request {requestId}</p>
          ) : null}
          {onRetry ? (
            <Button variant="secondary" className="mt-3" onClick={onRetry} glyph="arrow-flat">
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/** Offline. States what still works, because most of this app is readable. */
export function OfflineNotice({ lastSynced }: { lastSynced: string }) {
  return (
    <Card tone="information">
      <div className="flex gap-3">
        <Icon name="unavailable" size={20} className="mt-0.5 shrink-0 text-information" />
        <div>
          <h3 className="t-title-3 text-ink-1">You are offline</h3>
          <p className="mt-1 t-body-sm text-ink-2">
            Saved results, your protocol and downloaded evidence stay readable. Entries you make
            now are queued and sent when the connection returns.
          </p>
          <p className="mt-2 t-mono text-ink-3">Last synced {lastSynced}</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * A screen or panel whose contract is not implemented.
 *
 * This component is deliberately plain: it must never be mistaken for a
 * result. It names the missing dependency so the demo stays honest.
 */
export function PendingIntegration({
  title,
  body,
  dependency,
  action,
}: {
  title: string;
  body: React.ReactNode;
  dependency: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <div className="flex gap-3">
        <Icon name="pending" size={20} className="mt-0.5 shrink-0 text-ink-3" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="t-title-3 text-ink-1">{title}</h3>
            <StatusChip tone="unavailable" glyph="pending">
              Pending integration
            </StatusChip>
          </div>
          <div className="mt-1.5 t-body-sm text-ink-2">{body}</div>
          <p className="mt-2.5 t-mono text-ink-3">Depends on {dependency}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </Card>
  );
}

/* ==========================================================================
   Announcements
   ========================================================================== */

let announceFn: ((message: string, assertive?: boolean) => void) | null = null;

/** Announce a state change to assistive tech without moving focus. */
export function announce(message: string, assertive = false) {
  announceFn?.(message, assertive);
}

/**
 * One polite region and one assertive region for the whole app, per the
 * live-region guidance. Mounted once in the shell.
 */
export function Announcer() {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");

  useEffect(() => {
    announceFn = (message, isAssertive) => {
      if (isAssertive) {
        setAssertive("");
        window.setTimeout(() => setAssertive(message), 60);
      } else {
        setPolite("");
        window.setTimeout(() => setPolite(message), 60);
      }
    };
    return () => {
      announceFn = null;
    };
  }, []);

  return (
    <>
      <p aria-live="polite" aria-atomic="true" className="visually-hidden">
        {polite}
      </p>
      <p aria-live="assertive" aria-atomic="true" className="visually-hidden">
        {assertive}
      </p>
    </>
  );
}

/** Inline confirmation. Paired with `announce` so it is never visual-only. */
export function InlineStatus({
  tone = "supported",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cx(
        "flex items-center gap-2 rounded-sm px-3 py-2.5 t-body-sm",
        toneWash[tone],
        toneInk[tone],
      )}
    >
      <Icon name={toneGlyph[tone]} size={16} className="shrink-0" />
      {children}
    </p>
  );
}
