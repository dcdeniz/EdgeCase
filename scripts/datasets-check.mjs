import { readFile } from "node:fs/promises";

const path = new URL("../data/uci-fertility/fertility_Diagnosis.txt", import.meta.url);
const raw = await readFile(path, "utf8");
const rows = raw.trim().split(/\r?\n/).map((line, index) => {
  const values = line.split(",");
  if (values.length !== 10) {
    throw new Error(`UCI Fertility row ${index + 1} has ${values.length} columns; expected 10.`);
  }
  const features = values.slice(0, 9).map(Number);
  if (features.some((value) => !Number.isFinite(value))) {
    throw new Error(`UCI Fertility row ${index + 1} contains a non-numeric feature.`);
  }
  const diagnosis = values[9];
  if (diagnosis !== "N" && diagnosis !== "O") {
    throw new Error(`UCI Fertility row ${index + 1} has an invalid diagnosis.`);
  }
  return { features, diagnosis };
});

if (rows.length !== 100) {
  throw new Error(`UCI Fertility contains ${rows.length} rows; expected 100.`);
}

const normal = rows.filter(({ diagnosis }) => diagnosis === "N").length;
const altered = rows.length - normal;
if (normal === 0 || altered === 0) {
  throw new Error("UCI Fertility must contain both target classes.");
}

console.log(`Dataset contracts are valid. UCI Fertility: ${rows.length} rows (${normal} N, ${altered} O).`);
