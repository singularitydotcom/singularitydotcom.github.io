// Regenerate data/profiles.json and data/matches.json from profiles/*.json.
// Usage: node scripts/build-index.mjs [--check]   (--check fails if the committed index is stale or a profile is invalid)
import fs from "node:fs";
import path from "node:path";
import { ROOT, writeIndex } from "./lib.mjs";

const check = process.argv.includes("--check");
const before = ["data/profiles.json", "data/matches.json"].map((f) => (fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), "utf8") : ""));
const { problems, count } = writeIndex();
const after = ["data/profiles.json", "data/matches.json"].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8"));
if (problems.length) { console.error("Invalid profiles:\n" + problems.join("\n")); process.exit(1); }
console.log("Indexed " + count + " profile(s).");
if (check && (before[0] !== after[0] || before[1] !== after[1])) {
  console.error("data/*.json was stale. Run: node scripts/build-index.mjs");
  process.exit(1);
}
