"use client";

import { useEffect, useState } from "react";
import { Screen } from "@/components/shell";
import { Button, Card, InlineStatus, RowLink, SectionHeader } from "@/components/ui";
import {
  beginGoogleHealthConnection,
  getGoogleHealthStatus,
  syncGoogleHealth,
} from "@/lib/google-health-client";

type Status = Awaited<ReturnType<typeof getGoogleHealthStatus>>;

export default function WearablesPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getGoogleHealthStatus().then(setStatus).catch((error: Error) => setMessage(error.message));
  }, []);

  const sync = async () => {
    setBusy(true);
    setMessage(undefined);
    try {
      const result = await syncGoogleHealth();
      setMessage(`Synced ${result.syncedDays} days from ${result.from} to ${result.through}.`);
      setStatus(await getGoogleHealthStatus());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Wearables" back="/account">
      <SectionHeader eyebrow="Connected data" title="Google Health" />
      <Card>
        <p className="t-body-sm text-ink-2">
          Import Fitbit and Pixel Watch sleep, steps, active minutes, and resting heart rate. These
          remain contextual signals and never determine a clinical result.
        </p>
        <div className="mt-4">
          <InlineStatus tone={status?.connected ? "supported" : "neutral"}>
            {status?.connected ? "Connected" : "Not connected"}
          </InlineStatus>
        </div>
        <div className="mt-4 grid gap-2">
          {status?.connected ? (
            <Button full glyph="pending" disabled={busy} onClick={sync}>
              {busy ? "Syncing…" : "Sync last 14 days"}
            </Button>
          ) : (
            <Button full glyph="external" onClick={() => void beginGoogleHealthConnection()}>
              Connect Google Health
            </Button>
          )}
        </div>
        {message ? <p className="mt-3 t-caption text-ink-2">{message}</p> : null}
      </Card>
      <section className="mt-6" aria-labelledby="fitbit-demo">
        <SectionHeader id="fitbit-demo" eyebrow="Prototype" title="Simulated Fitbit" level={2} />
        <Card inset>
          <RowLink
            href="/sleep"
            glyph="simulated"
            title="View simulated Fitbit data"
            detail="Deterministic sleep, stages, steps, activity, resting heart rate and HRV"
          />
        </Card>
      </section>
      <p className="mt-4 t-caption text-ink-3">
        Google asks for read-only activity, health-metric, and sleep access. PreSeed stores daily
        summaries against your account; missing days remain missing rather than being scored as zero.
      </p>
    </Screen>
  );
}
