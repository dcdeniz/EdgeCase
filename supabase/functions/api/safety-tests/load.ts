import { createHarness } from "./harness.ts";

const percentile = (sorted: number[], value: number) =>
  sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * value) - 1)];

async function runBatch(count: number, concurrency: number) {
  const harness = createHarness("safe", 5);
  const latencies: number[] = [];
  let errors = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < count) {
      cursor++;
      const start = performance.now();
      try {
        const response = await harness.request(
          "Explain the approved evidence without diagnosis.",
        );
        if (!response.ok) errors++;
        await response.body?.cancel();
      } catch {
        errors++;
      } finally {
        latencies.push(performance.now() - start);
      }
    }
  }
  try {
    const started = performance.now();
    await Promise.all(Array.from({ length: concurrency }, worker));
    const durationMs = performance.now() - started;
    latencies.sort((a, b) => a - b);
    return {
      requests: count,
      concurrency,
      durationMs: Number(durationMs.toFixed(2)),
      requestsPerSecond: Number((count / (durationMs / 1000)).toFixed(2)),
      errors,
      errorRate: errors / count,
      latencyMs: {
        min: Number(latencies[0].toFixed(2)),
        p50: Number(percentile(latencies, 0.5).toFixed(2)),
        p95: Number(percentile(latencies, 0.95).toFixed(2)),
        p99: Number(percentile(latencies, 0.99).toFixed(2)),
        max: Number(latencies.at(-1)!.toFixed(2)),
      },
      providerCalls: {
        embeddings: harness.metrics.embeddingCalls,
        responses: harness.metrics.responseCalls,
        peakConcurrent: harness.metrics.peakProviderCalls,
      },
    };
  } finally {
    harness.restore();
  }
}

const sequential = await runBatch(25, 1);
const concurrent = await runBatch(50, 5);
console.log(
  JSON.stringify(
    {
      environment: "in-process deterministic stubs; no live endpoint",
      sequential,
      concurrent,
    },
    null,
    2,
  ),
);
