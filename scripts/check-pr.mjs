// CI check for pull requests that add, change, or delete profiles/<slug>.json.
// Env: BASE_SHA, PR_AUTHOR, PR_ASSOCIATION (OWNER/MEMBER/COLLABORATOR skip ownership rules).
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { core, schema, blocklist, strip } from "./lib.mjs";

const base = process.env.BASE_SHA;
const author = (process.env.PR_AUTHOR || "").toLowerCase();
const trusted = ["OWNER", "MEMBER", "COLLABORATOR"].includes(process.env.PR_ASSOCIATION || "");
const diff = execFileSync("git", ["diff", "--name-status", "--no-renames", base + "...HEAD"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const errors = [];
const touched = diff.map((l) => l.split("\t"));
const profileChanges = touched.filter(([, f]) => /^profiles\/[^/]+\.json$/.test(f));
if (profileChanges.length && !trusted) {
  const other = touched.filter(([, f]) => !/^profiles\/[^/]+\.json$/.test(f));
  if (other.length) errors.push("Profile PRs may only change files in profiles/. Also changed: " + other.map((o) => o[1]).join(", "));
  if (profileChanges.length > 1) errors.push("One profile per PR, and one profile per GitHub account.");
}
const baseOwner = (f) => { try { return JSON.parse(execFileSync("git", ["show", base + ":" + f], { encoding: "utf8" })).owner || ""; } catch { return null; } };
for (const [status, f] of profileChanges) {
  if (status === "D") {
    if (!trusted && (baseOwner(f) || "").toLowerCase() !== author) errors.push(f + ": only the owner can delete a profile.");
    continue;
  }
  let p;
  try { p = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { errors.push(f + ": invalid JSON: " + e.message); continue; }
  for (const e of core.validateProfile(strip(p), schema, blocklist)) errors.push(f + ": " + e);
  if (f !== "profiles/" + p.slug + ".json") errors.push(f + ": filename must be profiles/<slug>.json");
  if (!trusted) {
    if (p.example) errors.push(f + ": example is reserved for maintainers.");
    if ((p.owner || "").toLowerCase() !== author) errors.push(f + ": owner must be your GitHub login (" + author + ").");
    if (status === "M" && (baseOwner(f) || "").toLowerCase() !== author) errors.push(f + ": only the owner can change a profile.");
  }
}
if (errors.length) { console.error(errors.map((e) => "- " + e).join("\n")); process.exit(1); }
console.log("PR profile checks passed for " + profileChanges.length + " file(s).");
