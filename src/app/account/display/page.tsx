"use client";

import { DisclaimerFooter, Screen } from "@/components/shell";
import { Card, ChoiceGroup, SectionHeader, StatusChip } from "@/components/ui";
import { usePrototype } from "@/lib/store";

/**
 * Accessibility preferences are real, not decorative. Each writes an attribute on
 * the document element and CSS owns every consequence, so there is one place to
 * reason about and nothing to keep in sync.
 */
export default function DisplayPage() {
  const { state, setSettings } = usePrototype();
  const { settings } = state;

  return (
    <Screen title="Display" eyebrow="Accessibility" back="/account">
      <Card>
        <p className="t-body-sm text-ink-2">
          PreSeed follows your device settings by default, including dark mode, reduced motion and
          increased contrast. These override them for this app only.
        </p>
      </Card>

      <div className="mt-5">
        <ChoiceGroup
          legend="Theme"
          hint="Dark is the default when your device has no preference set."
          name="theme"
          value={settings.theme}
          onChange={(value) => setSettings({ theme: value })}
          options={[
            { value: "system", label: "Follow my device" },
            { value: "dark", label: "Always dark" },
            { value: "light", label: "Always light" },
          ]}
        />

        <ChoiceGroup
          legend="Text size"
          hint="Everything scales together, including measured values and chart labels. Layouts reflow rather than clipping."
          name="textScale"
          value={settings.textScale}
          onChange={(value) => setSettings({ textScale: value })}
          options={[
            { value: "default", label: "Default" },
            { value: "large", label: "Large", note: "112%" },
            { value: "larger", label: "Larger", note: "125%" },
            { value: "largest", label: "Largest", note: "150%" },
          ]}
        />

        <ChoiceGroup
          legend="Motion"
          hint="Reduced motion removes travel and staggered reveals. State changes stay visible."
          name="motion"
          value={settings.motion}
          onChange={(value) => setSettings({ motion: value })}
          options={[
            { value: "system", label: "Follow my device" },
            { value: "reduced", label: "Reduce motion" },
          ]}
        />

        <ChoiceGroup
          legend="Contrast"
          hint="Strengthens hairlines, chart gridlines and muted labels. Body text already meets AA without it."
          name="contrast"
          value={settings.contrast}
          onChange={(value) => setSettings({ contrast: value })}
          options={[
            { value: "system", label: "Follow my device" },
            { value: "high", label: "Increase contrast" },
          ]}
        />
      </div>

      <section className="mt-4" aria-labelledby="preview">
        <SectionHeader id="preview" eyebrow="Preview" title="How these look together" level={3} />
        <Card>
          <p className="t-micro text-ink-3">Measured value</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="t-display-1 text-ink-1">27</span>
            <span className="t-body-sm text-ink-2">%</span>
          </p>
          <p className="mt-2 t-prose text-ink-1">
            The explanation register. Serif, generously spaced, capped at a comfortable measure so long
            passages stay readable at every text size.
          </p>
          <p className="mt-3 t-mono text-ink-3">progressive_motility_pct · who-6e · lab_report</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusChip tone="supported">Within reference context</StatusChip>
            <StatusChip tone="attention">Needs attention</StatusChip>
            <StatusChip tone="unavailable">Insufficient data</StatusChip>
          </div>
        </Card>
      </section>

      <Card className="mt-4">
        <p className="t-micro text-ink-3">Guaranteed regardless of these settings</p>
        <ul className="mt-2 space-y-2 t-body-sm text-ink-2">
          <li>Every state carries a word and a shape, so colour is never the only channel.</li>
          <li>Every touch target is at least 44 by 44 pixels.</li>
          <li>Every chart has a text summary and a table view.</li>
          <li>Body text meets 4.5:1 contrast, and control borders meet 3:1, in both themes.</li>
        </ul>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
