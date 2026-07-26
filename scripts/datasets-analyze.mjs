import { readFile, writeFile } from "node:fs/promises";

const source = new URL("../data/uci-fertility/fertility_Diagnosis.txt", import.meta.url);
const rows = (await readFile(source, "utf8")).trim().split(/\r?\n/).map((line) => {
  const values = line.split(",");
  return { features: values.slice(0, 9).map(Number), target: values[9] };
});
const names = ["season", "age_normalized", "childhood_diseases", "accident", "surgery", "high_fevers", "alcohol", "smoking", "sitting_normalized"];
const distinctRows = new Set(rows.map((row) => `${row.features.join(",")},${row.target}`)).size;
const targetCounts = Object.fromEntries(["N", "O"].map((target) => [target, rows.filter((row) => row.target === target).length]));

const featureRows = names.map((name, index) => {
  const values = rows.map((row) => row.features[index]);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const altered = rows.filter((row) => row.target === "O").map((row) => row.features[index]);
  const normal = rows.filter((row) => row.target === "N").map((row) => row.features[index]);
  const classMean = (items) => items.reduce((sum, value) => sum + value, 0) / items.length;
  return { name, min: Math.min(...values), max: Math.max(...values), mean, normalMean: classMean(normal), alteredMean: classMean(altered) };
});

const report = `# UCI Fertility data profile

## Shape and target

- Rows: ${rows.length}
- Unique rows: ${distinctRows}
- Exact duplicate rows: ${rows.length - distinctRows}
- Normal target: ${targetCounts.N} (${(targetCounts.N / rows.length * 100).toFixed(1)}%)
- Altered target: ${targetCounts.O} (${(targetCounts.O / rows.length * 100).toFixed(1)}%)
- Majority-class accuracy baseline: ${(Math.max(targetCounts.N, targetCounts.O) / rows.length * 100).toFixed(1)}%

## Feature profile

| Feature | Min | Max | Overall mean | Normal mean | Altered mean |
|---|---:|---:|---:|---:|---:|
${featureRows.map((row) => `| ${row.name} | ${row.min} | ${row.max} | ${row.mean.toFixed(3)} | ${row.normalMean.toFixed(3)} | ${row.alteredMean.toFixed(3)} |`).join("\n")}

## Data-science interpretation

- The 88:12 target imbalance makes raw accuracy misleading; any future tutorial evaluation must use stratification and report balanced accuracy, recall, precision and calibration.
- One hundred observations are inadequate for a clinically generalizable model or stable subgroup estimates.
- Features are pre-normalized and use ordinal encodings whose distances are not necessarily clinically meaningful.
- The target is normal/altered seminal quality, not azoospermia, endocrine disease, conception or live birth.
- This dataset is retained as an ingestion and evaluation fixture only; no predictive model is fitted here.
`;

await writeFile(new URL("../data/uci-fertility/profile.md", import.meta.url), report);
console.log(`Profiled ${rows.length} UCI Fertility rows with ${rows.length - distinctRows} exact duplicates.`);
