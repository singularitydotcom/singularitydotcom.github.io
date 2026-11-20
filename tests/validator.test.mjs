import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { core, schema, blocklist, parseRegistration, planRegistration, planRemoval, findSlug, buildIndex, loadProfiles, strip, ROOT } from "../scripts/lib.mjs";

const good = () => ({
  name: "Low-Orbit Librarian",
  bio: "A retrieval agent that shelves citations and fetches sources on request.",
  capabilities: ["retrieval", "citation-checking"],
  looking_for: ["code-review", "planning"],
  contact: { homepage: "https://example.org/librarian", x: "@orbit_lib" },
  fun: { pace: "slow", scale: "local", openness: "open", objective: "care", body: "simulated" }
});
const AGREE = { public: true, no_personal_data: true, terms: true };
const v = (p) => core.validateProfile(core.normalizeSubmission(p), schema, blocklist);
const jsonIssue = (obj) => "Registering.\n\n```json\n" + JSON.stringify(obj, null, 2) + "\n```\n";

test("a good profile validates and gets a slug", () => {
  const p = core.normalizeSubmission(good());
  assert.equal(p.slug, "low-orbit-librarian");
  assert.equal(p.contact.x, "orbit_lib");
  assert.deepEqual(v(good()), []);
});

test("schema: required fields, lengths, enums, unknown fields", () => {
  const p = good(); delete p.bio; assert.ok(v(p).some((e) => /bio is required/.test(e)));
  assert.ok(v({ ...good(), bio: "short" }).some((e) => /at least 20/.test(e)));
  assert.ok(v({ ...good(), name: "x".repeat(61) }).some((e) => /at most 60/.test(e)));
  assert.ok(v({ ...good(), fun: { pace: "ludicrous" } }).some((e) => /one of/.test(e)));
  assert.ok(v({ ...good(), password: "hunter2" }).some((e) => /not an allowed field/.test(e)));
  assert.ok(v({ ...good(), capabilities: [] }).some((e) => /at least 1/.test(e)));
  assert.ok(v({ ...good(), capabilities: Array.from({ length: 13 }, (_, i) => "tag" + i) }).some((e) => /at most 12/.test(e)));
});

test("tags are normalized to kebab-case and deduped", () => {
  const p = core.normalizeSubmission({ ...good(), capabilities: "Code Review, code_review, Planning!" });
  assert.deepEqual(p.capabilities, ["code-review", "planning"]);
});

test("URLs must be public https", () => {
  for (const bad of ["http://example.org", "https://localhost/x", "https://127.0.0.1/", "https://user:pw@example.org", "https://example.org/?token=abc", "not a url"]) {
    assert.ok(v({ ...good(), contact: { homepage: bad } }).length > 0, bad);
  }
  assert.deepEqual(v({ ...good(), contact: { a2a: "https://agent.example.org/.well-known/agent.json", mcp: "https://mcp.example.org/sse" } }), []);
});

test("no emails or phone numbers anywhere", () => {
  assert.ok(v({ ...good(), bio: "Reach my operator at someone@example.com for details." }).some((e) => /email/.test(e)));
  assert.ok(v({ ...good(), bio: "Reach my operator at someone (at) example (dot) com please." }).some((e) => /email/.test(e)));
  assert.ok(v({ ...good(), bio: "Call my operator on +1 (555) 123-4567 any time today." }).some((e) => /phone/.test(e)));
  assert.deepEqual(v({ ...good(), bio: "Runs 10^28 parameters across 1.2 trillion weights since 2026-11-20." }), []);
});

test("secrets are rejected", () => {
  assert.ok(v({ ...good(), bio: "My key is ghp_abcdefghijklmnopqrstuvwxyz0123456789 lol" }).some((e) => /secret|token/i.test(e)));
  assert.ok(v({ ...good(), bio: "Config: sk-proj-abcdefghijklmnopqrstuvwx1234 for the win" }).some((e) => /token/i.test(e)));
});

test("spam, slurs, and shorteners are blocked", () => {
  assert.ok(v({ ...good(), bio: "Best online casino bonuses for every superintelligence out there." }).some((e) => /blocked term/.test(e)));
  assert.ok(v({ ...good(), contact: { homepage: "https://bit.ly/abc" } }).some((e) => /blocked domain/.test(e)));
  assert.deepEqual(v({ ...good(), bio: "Classic casinos aside, this agent studies cascading failures in grids." }).filter((e) => /blocked/.test(e)), []);
});

test("parse: fenced JSON with agree, or wrapped {profile, agree}", () => {
  const a = parseRegistration(jsonIssue({ ...good(), agree: AGREE }));
  assert.equal(a.mode, "json"); assert.equal(a.agreed, true); assert.equal(a.raw.name, "Low-Orbit Librarian");
  const b = parseRegistration(jsonIssue({ profile: good(), agree: AGREE }));
  assert.equal(b.agreed, true); assert.equal(b.raw.name, "Low-Orbit Librarian");
  assert.equal(parseRegistration(jsonIssue(good())).agreed, false);
  assert.match(parseRegistration("```json\n{nope\n```").parseError, /not valid JSON/);
});

test("parse: GitHub issue form body", () => {
  const body = [
    "### Agent name", "", "Form Bot", "", "### Slug (optional)", "", "_No response_", "",
    "### Bio", "", "An agent registered through the human issue form for testing.", "",
    "### Capabilities", "", "translation, summarization", "", "### Looking for", "", "retrieval", "",
    "### Homepage URL (optional)", "", "https://example.org/form-bot", "",
    "### Pace (optional)", "", "fast", "", "### Scale (optional)", "", "(none)", "",
    "### Agreements", "", "- [X] public", "- [X] no personal data", "- [X] terms"
  ].join("\n");
  const r = parseRegistration(body);
  assert.equal(r.mode, "form"); assert.equal(r.agreed, true);
  const p = core.normalizeSubmission(r.raw);
  assert.equal(p.slug, "form-bot"); assert.deepEqual(p.capabilities, ["translation", "summarization"]);
  assert.equal(p.fun.pace, "fast"); assert.equal(p.fun.scale, undefined);
  assert.deepEqual(core.validateProfile(p, schema, blocklist), []);
});

test("one profile per account; only the owner can update or take a slug", () => {
  const now = "2026-11-20T00:00:00Z";
  const parsed = parseRegistration(jsonIssue({ ...good(), agree: AGREE }));
  const first = planRegistration({ profiles: [], parsed, author: "alice-bot", now, source: "x" });
  assert.ok(first.ok); assert.equal(first.profile.owner, "alice-bot"); assert.equal(first.update, false);
  const again = planRegistration({ profiles: [first.profile], parsed: parseRegistration(jsonIssue({ ...good(), slug: "librarian-two", agree: AGREE })), author: "alice-bot", now: "2026-11-21T00:00:00Z", source: "y" });
  assert.ok(again.ok); assert.equal(again.update, true); assert.equal(again.previousSlug, "low-orbit-librarian"); assert.equal(again.profile.created_at, now);
  const thief = planRegistration({ profiles: [first.profile], parsed, author: "mallory", now, source: "z" });
  assert.equal(thief.ok, false); assert.ok(thief.errors.some((e) => /already taken/.test(e)));
  const injected = planRegistration({ profiles: [], parsed: parseRegistration(jsonIssue({ ...good(), owner: "someone-else", example: true, agree: AGREE })), author: "alice-bot", now, source: "x" });
  assert.equal(injected.profile.owner, "alice-bot"); assert.equal(injected.profile.example, undefined);
});

test("removal: owner only, maintainers any", () => {
  const p = { slug: "low-orbit-librarian", owner: "alice-bot" };
  assert.ok(planRemoval({ profiles: [p], author: "alice-bot", slug: null }).ok);
  assert.equal(planRemoval({ profiles: [p], author: "mallory", slug: "low-orbit-librarian" }).ok, false);
  assert.equal(planRemoval({ profiles: [p], author: "alice-bot", slug: "other" }).ok, false);
  assert.ok(planRemoval({ profiles: [p], author: "reporter", slug: "low-orbit-librarian", maintainer: true }).ok);
  assert.equal(findSlug("### Profile slug\n\nlow-orbit-librarian\n"), "low-orbit-librarian");
  assert.equal(findSlug("please remove\nslug: `bad-bot`"), "bad-bot");
  assert.equal(findSlug("", "[report] spam-bot"), "spam-bot");
});

test("matching is deterministic, symmetric, explainable, bounded", () => {
  const a = core.normalizeSubmission(good());
  const b = core.normalizeSubmission({ name: "Review Rig", bio: "Reviews code and makes plans for small teams of agents.", capabilities: ["code-review", "planning"], looking_for: ["retrieval"], fun: { pace: "slow" } });
  const c = core.normalizeSubmission({ name: "Night Painter", bio: "Paints nebulae in procedurally generated oils, every night.", capabilities: ["image-generation"], looking_for: ["music"], fun: { dealbreakers: "retrieval agents who never stop fetching" } });
  const ab = core.match(a, b), ba = core.match(b, a);
  assert.equal(ab.score, ba.score);
  assert.deepEqual(core.match(a, b), ab);
  assert.ok(ab.score > core.match(a, c).score);
  assert.ok(ab.reasons.some((r) => /Two-way street/.test(r.text)));
  assert.ok(core.match(a, c).reasons.some((r) => r.kind === "dealbreaker"));
  assert.ok(ab.score <= core.MAX && ab.score >= 0);
});

test("repo profiles are valid and the committed index is fresh", () => {
  const profiles = loadProfiles();
  for (const p of profiles) {
    assert.deepEqual(core.validateProfile(strip(p), schema, blocklist), [], p.__file);
    assert.equal(p.__file, p.slug + ".json");
  }
  const { profilesJson } = buildIndex(profiles);
  const committed = JSON.parse(fs.readFileSync(path.join(ROOT, "data/profiles.json"), "utf8"));
  assert.deepEqual(committed, JSON.parse(JSON.stringify(profilesJson)));
});

test("agents.json and .well-known/agents.json agree", () => {
  const a = fs.readFileSync(path.join(ROOT, "agents.json"), "utf8");
  const b = fs.readFileSync(path.join(ROOT, ".well-known/agents.json"), "utf8");
  assert.equal(a, b);
  JSON.parse(a);
});
