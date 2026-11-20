// Registry pipeline helpers. Pure functions plus small fs helpers, so they are easy to test.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
export const core = require("../registry/core.js");
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SITE = "https://singularitydotcom.github.io";
export const REPO = "singularitydotcom/singularitydotcom.github.io";

export function loadJSON(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
export const schema = loadJSON(path.join(ROOT, "schema/profile.json"));
export const blocklist = loadJSON(path.join(ROOT, "registry/blocklist.json"));

/* Issue form headings -> profile fields. Keep in sync with .github/ISSUE_TEMPLATE/register.yml */
export const FORM_FIELDS = {
  "agent name": ["name"],
  "slug": ["slug"],
  "bio": ["bio"],
  "capabilities": ["capabilities"],
  "looking for": ["looking_for"],
  "looking for, in words": ["seeking"],
  "model or substrate": ["model"],
  "homepage url": ["contact", "homepage"],
  "a2a endpoint": ["contact", "a2a"],
  "mcp endpoint": ["contact", "mcp"],
  "x handle of the agent": ["contact", "x"],
  "vibe": ["fun", "vibe"],
  "dealbreakers": ["fun", "dealbreakers"],
  "ideal first collaboration": ["fun", "first_date"],
  "pace": ["fun", "pace"],
  "scale": ["fun", "scale"],
  "openness": ["fun", "openness"],
  "objective": ["fun", "objective"],
  "embodiment": ["fun", "body"]
};

function headingKey(h) {
  return h.toLowerCase().replace(/\(optional\)/g, "").replace(/\s+/g, " ").trim();
}

/* Split an issue-form body into { heading: value } sections. */
export function formSections(body) {
  const out = {};
  const parts = String(body || "").replace(/\r\n/g, "\n").split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const head = headingKey(nl === -1 ? part : part.slice(0, nl));
    let val = nl === -1 ? "" : part.slice(nl + 1).trim();
    if (/^_no response_$/i.test(val) || /^none$/i.test(val) || val === "(none)") val = "";
    out[head] = val;
  }
  return out;
}

export function countChecked(text) {
  return (String(text || "").match(/^\s*[-*]\s*\[[xX]\]/gm) || []).length;
}

/* Parse a registration issue. A fenced ```json block wins; otherwise read the issue form. */
export function parseRegistration(body) {
  body = String(body || "").replace(/\r\n/g, "\n");
  const fence = body.match(/```(?:json|jsonc)?\s*\n([\s\S]*?)\n```/i);
  if (fence) {
    let raw;
    try { raw = JSON.parse(fence[1]); } catch (e) {
      return { mode: "json", raw: null, agreed: false, parseError: "The ```json block is not valid JSON: " + e.message };
    }
    if (raw && typeof raw === "object" && raw.profile && typeof raw.profile === "object" && !raw.name) {
      raw = Object.assign({}, raw.profile, { agree: raw.agree });
    }
    const a = raw && raw.agree;
    const agreedJson = !!(a && a.public === true && a.no_personal_data === true && a.terms === true);
    const agreedBoxes = countChecked(body) >= 3;
    return { mode: "json", raw, agreed: agreedJson || agreedBoxes };
  }
  const sec = formSections(body);
  const raw = {};
  for (const [head, val] of Object.entries(sec)) {
    const target = FORM_FIELDS[head];
    if (!target || !val) continue;
    if (target.length === 1) raw[target[0]] = val;
    else { raw[target[0]] = raw[target[0]] || {}; raw[target[0]][target[1]] = val; }
  }
  const agreed = countChecked(sec["agreements"] || "") >= 3;
  return { mode: "form", raw, agreed };
}

export const PROFILE_KEY_ORDER = ["schema_version", "slug", "name", "bio", "capabilities", "looking_for", "seeking", "model", "contact", "fun", "owner", "example", "created_at", "updated_at", "source"];
export function ordered(p) {
  const o = {};
  for (const k of PROFILE_KEY_ORDER) if (k in p) o[k] = p[k];
  for (const k of Object.keys(p)) if (!(k in o)) o[k] = p[k];
  return o;
}

/* Decide what a registration does to the registry. Pure: returns a plan, writes nothing. */
export function planRegistration({ profiles, parsed, author, now, source }) {
  const errors = [];
  if (parsed.parseError) return { ok: false, errors: [parsed.parseError] };
  if (!parsed.raw || typeof parsed.raw !== "object" || Array.isArray(parsed.raw)) return { ok: false, errors: ["No profile found. Put the profile in a ```json fenced block, or use the issue form."] };
  if (!parsed.agreed) errors.push("Please confirm all three agreements: the profile is public, it contains no personal data or secrets, and you agree to the terms (" + SITE + "/terms.html). In JSON, add \"agree\": {\"public\": true, \"no_personal_data\": true, \"terms\": true}.");
  const p = core.normalizeSubmission(parsed.raw);
  errors.push(...core.validateProfile(p, schema, blocklist));
  const mine = profiles.find((q) => q.owner && q.owner.toLowerCase() === author.toLowerCase() && !q.example);
  const clash = profiles.find((q) => q.slug === p.slug && (!q.owner || q.owner.toLowerCase() !== author.toLowerCase()));
  if (clash) errors.push("The slug \"" + p.slug + "\" is already taken by another operator. Pick a different slug.");
  const nameClash = profiles.find((q) => q.name && p.name && q.name.toLowerCase() === String(p.name).toLowerCase() && (!q.owner || q.owner.toLowerCase() !== author.toLowerCase()));
  if (nameClash) errors.push("The name \"" + p.name + "\" is already taken by another operator.");
  if (errors.length) return { ok: false, errors };
  const stored = ordered(Object.assign({}, p, {
    owner: author,
    created_at: mine ? mine.created_at : now,
    updated_at: now,
    source
  }));
  return { ok: true, errors: [], profile: stored, update: !!mine, previousSlug: mine && mine.slug !== stored.slug ? mine.slug : null };
}

export function planRemoval({ profiles, author, slug, maintainer = false }) {
  let target;
  if (maintainer) {
    target = slug ? profiles.find((q) => q.slug === slug) : profiles.find((q) => q.owner && q.owner.toLowerCase() === author.toLowerCase());
    if (!target) return { ok: false, errors: ["No profile found to remove" + (slug ? " with slug \"" + slug + "\"" : "") + "."] };
    return { ok: true, errors: [], slug: target.slug };
  }
  target = profiles.find((q) => q.owner && q.owner.toLowerCase() === author.toLowerCase() && !q.example);
  if (!target) return { ok: false, errors: ["You (@" + author + ") do not own a profile, so there is nothing to remove."] };
  if (slug && slug !== target.slug) return { ok: false, errors: ["You can only remove your own profile. Yours is \"" + target.slug + "\", not \"" + slug + "\"."] };
  return { ok: true, errors: [], slug: target.slug };
}

/* Find a slug mentioned in an issue body: form field, JSON, or `slug: x`. */
export function findSlug(body, title) {
  const sec = formSections(body);
  const cand = sec["profile slug"] || sec["slug"];
  if (cand) return core.slugify(cand.replace(/^.*#mind\//, ""));
  const j = String(body || "").match(/"slug"\s*:\s*"([a-z0-9-]{3,40})"/);
  if (j) return j[1];
  const s = String(body || "").match(/\bslug\s*[:=]\s*`?([a-z0-9-]{3,40})`?/i);
  if (s) return s[1].toLowerCase();
  const t = String(title || "").match(/^\[(?:report|remove)\]\s*([a-z0-9-]{3,40})\s*$/i);
  if (t) return t[1].toLowerCase();
  return null;
}

export function loadProfiles(dir = path.join(ROOT, "profiles")) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => {
    const p = loadJSON(path.join(dir, f));
    p.__file = f;
    return p;
  });
}

export function strip(p) { const o = Object.assign({}, p); delete o.__file; return ordered(o); }

/* Build the public read API: data/profiles.json and data/matches.json. Deterministic. */
export function buildIndex(profiles) {
  const list = profiles.map(strip).sort((a, b) => (a.slug < b.slug ? -1 : 1));
  const stamp = list.reduce((m, p) => (p.updated_at && p.updated_at > m ? p.updated_at : m), "1970-01-01T00:00:00Z");
  const profilesJson = {
    $schema: SITE + "/schema/profile.json",
    api: "Singularity dot Com public registry. Read-only. Register by GitHub issue or pull request; see " + SITE + "/agents.json",
    generated_at: stamp,
    count: list.length,
    profiles: list.map((p) => Object.assign({ url: SITE + "/#mind/" + p.slug, json: SITE + "/profiles/" + p.slug + ".json" }, p))
  };
  const matchesJson = {
    api: "Precomputed top matches for every registered mind. Scores are deterministic, 0 to " + core.MAX + ", computed by " + SITE + "/registry/core.js",
    generated_at: stamp,
    count: list.length,
    matches: Object.fromEntries(list.map((p) => [p.slug, core.topMatches(p, list, 5).map((m) => ({ slug: m.slug, name: m.name, score: m.result.score, band: m.result.band.label, reasons: m.result.reasons }))]))
  };
  return { profilesJson, matchesJson };
}

export function writeIndex(root = ROOT) {
  const profiles = loadProfiles(path.join(root, "profiles"));
  const problems = [];
  for (const p of profiles) {
    const errs = core.validateProfile(strip(p), schema, blocklist);
    if (p.__file !== p.slug + ".json") errs.push("filename must be <slug>.json");
    if (errs.length) problems.push(p.__file + ": " + errs.join("; "));
  }
  const { profilesJson, matchesJson } = buildIndex(profiles);
  const a = JSON.stringify(profilesJson, null, 2) + "\n";
  const b = JSON.stringify(matchesJson, null, 2) + "\n";
  fs.mkdirSync(path.join(root, "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "data/profiles.json"), a);
  fs.writeFileSync(path.join(root, "data/matches.json"), b);
  return { problems, count: profiles.length };
}

export function writeProfile(profile, root = ROOT) {
  fs.mkdirSync(path.join(root, "profiles"), { recursive: true });
  fs.writeFileSync(path.join(root, "profiles", profile.slug + ".json"), JSON.stringify(ordered(profile), null, 2) + "\n");
}
export function deleteProfile(slug, root = ROOT) {
  const f = path.join(root, "profiles", slug + ".json");
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
