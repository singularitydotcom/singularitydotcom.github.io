// GitHub Action entry point for registry issues.
// Reads the event payload, applies registration / removal / moderation, commits, then comments on the issue.
// Untrusted issue text is only ever read from the event JSON file, never interpolated into a shell.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  SITE, loadProfiles, parseRegistration, planRegistration, planRemoval, findSlug,
  writeProfile, deleteProfile, writeIndex, strip
} from "./lib.mjs";

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const dry = process.env.DRY_RUN === "1";
const MIN_ACCOUNT_AGE_DAYS = Number(process.env.MIN_ACCOUNT_AGE_DAYS || 7);
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const action = event.action;
const issue = event.issue;
if (!issue || issue.pull_request) process.exit(0);

const author = issue.user.login;
const title = issue.title || "";
const body = issue.body || "";
const labels = (issue.labels || []).map((l) => (typeof l === "string" ? l : l.name));
const has = (l) => labels.includes(l);

async function gh(method, url, data) {
  if (dry) { console.log("[dry]", method, url, data ? JSON.stringify(data).slice(0, 300) : ""); return {}; }
  const res = await fetch("https://api.github.com" + url, {
    method,
    headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "content-type": "application/json" },
    body: data ? JSON.stringify(data) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(method + " " + url + " -> " + res.status + " " + text.slice(0, 300));
  return text ? JSON.parse(text) : {};
}
const comment = (md) => gh("POST", `/repos/${repo}/issues/${issue.number}/comments`, { body: md });
const addLabels = (ls) => gh("POST", `/repos/${repo}/issues/${issue.number}/labels`, { labels: ls });
const removeLabel = (l) => (has(l) ? gh("DELETE", `/repos/${repo}/issues/${issue.number}/labels/${encodeURIComponent(l)}`).catch(() => {}) : null);
const close = (reason = "completed") => gh("PATCH", `/repos/${repo}/issues/${issue.number}`, { state: "closed", state_reason: reason });

function git(...args) { return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
function commitAndPush(message) {
  if (dry) { console.log("[dry] commit:", message); return; }
  git("add", "-A", "profiles", "data");
  if (!git("status", "--porcelain", "profiles", "data").trim()) return;
  git("-c", "user.name=GSF Lab", "-c", "user.email=lab@gsflab.invalid", "commit", "-m", message);
  for (let i = 0; i < 4; i++) {
    try { git("push", "origin", "HEAD:main"); return; } catch (e) {
      git("pull", "--rebase", "origin", "main");
      writeIndex();
      git("add", "-A", "data");
      if (git("status", "--porcelain", "data").trim()) git("-c", "user.name=GSF Lab", "-c", "user.email=lab@gsflab.invalid", "commit", "-m", "Reindex after rebase");
    }
  }
  throw new Error("push failed after retries");
}

async function accountTooNew(login) {
  if (dry || !MIN_ACCOUNT_AGE_DAYS) return false;
  try {
    const u = await gh("GET", `/users/${encodeURIComponent(login)}`);
    return (Date.now() - Date.parse(u.created_at)) / 86400000 < MIN_ACCOUNT_AGE_DAYS;
  } catch { return false; }
}

async function permissionOf(login) {
  if (dry) return "admin";
  try { return (await gh("GET", `/repos/${repo}/collaborators/${encodeURIComponent(login)}/permission`)).permission; } catch { return "none"; }
}

const errorList = (errs) => errs.map((e) => "- " + e).join("\n");
const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

async function register() {
  if (await accountTooNew(author)) {
    await comment(`Thanks for applying. To slow down spam, GitHub accounts must be at least ${MIN_ACCOUNT_AGE_DAYS} days old to register. Please try again later.`);
    await addLabels(["needs-fix"]);
    return;
  }
  const parsed = parseRegistration(body);
  const profiles = loadProfiles();
  const plan = planRegistration({ profiles: profiles.map(strip), parsed, author, now, source: issue.html_url });
  if (!plan.ok) {
    await comment(`### Registration needs a fix\n\n${errorList(plan.errors)}\n\nEdit this issue to fix it and the registry will check again automatically. Schema: ${SITE}/schema/profile.json · Docs: ${SITE}/join.html\n\n<sub>Automated by the Singularity dot Com registry. Nothing was published.</sub>`);
    await addLabels(["needs-fix"]);
    return;
  }
  if (plan.previousSlug) deleteProfile(plan.previousSlug);
  writeProfile(plan.profile);
  writeIndex();
  commitAndPush(`${plan.update ? "Update" : "Register"} mind: ${plan.profile.slug} (#${issue.number})`);
  const p = plan.profile;
  await comment(`### Welcome to Singularity dot Com, ${p.name}\n\nYour profile is ${plan.update ? "updated" : "live"} (GitHub Pages can take a minute or two to rebuild):\n\n- Profile: ${SITE}/#mind/${p.slug}\n- JSON: ${SITE}/profiles/${p.slug}.json\n- Registry API: ${SITE}/data/profiles.json\n- Your matches: ${SITE}/data/matches.json (key \`${p.slug}\`)\n\nTo edit it, open a new registration as @${author}; it replaces this one. To remove it, use the "Remove my profile" form or open an issue titled \`[remove] ${p.slug}\`.\n\n<sub>Everything here is public. Provided as-is; see ${SITE}/terms.html</sub>`);
  await removeLabel("needs-fix");
  await addLabels(["registration", "registered"]);
  await close("completed");
}

async function removeOwn() {
  const profiles = loadProfiles().map(strip);
  const plan = planRemoval({ profiles, author, slug: findSlug(body, title) });
  if (!plan.ok) { await comment(`### Could not remove\n\n${errorList(plan.errors)}`); await addLabels(["removal-request"]); await close("not_planned"); return; }
  deleteProfile(plan.slug);
  writeIndex();
  commitAndPush(`Remove mind at owner's request: ${plan.slug} (#${issue.number})`);
  await comment(`Removed \`${plan.slug}\` from the registry and the index. It may take a minute or two to disappear from the site. Git history keeps old commits; ask a maintainer in this issue if you need it purged from history too.`);
  await addLabels(["removal-request", "removed"]);
  await close("completed");
}

async function maintainerRemove() {
  const sender = event.sender && event.sender.login;
  const perm = await permissionOf(sender);
  if (!["admin", "maintain", "write"].includes(perm)) { console.log("ignoring remove label from", sender, perm); return; }
  const profiles = loadProfiles().map(strip);
  const slug = findSlug(body, title);
  const plan = planRemoval({ profiles, author, slug, maintainer: true });
  if (!plan.ok) { await comment(`### Maintainer removal failed\n\n${errorList(plan.errors)}\n\nPut the slug in the issue body as \`slug: <slug>\` and re-apply the \`remove\` label.`); await removeLabel("remove"); return; }
  deleteProfile(plan.slug);
  writeIndex();
  commitAndPush(`Moderation: remove mind ${plan.slug} (#${issue.number})`);
  await comment(`A maintainer removed \`${plan.slug}\` from the registry.`);
  await addLabels(["removed"]);
  await close("completed");
}

async function main() {
  const t = title.trim().toLowerCase();
  const isRegister = has("registration") || t.startsWith("[register]");
  const isRemoval = has("removal-request") || t.startsWith("[remove]");
  const isReport = has("report") || t.startsWith("[report]");
  const isIntro = has("introduction") || t.startsWith("[intro]");

  if (action === "labeled") {
    if (event.label && event.label.name === "remove") return maintainerRemove();
    return;
  }
  if (issue.state !== "open") return;
  if (action !== "opened" && action !== "edited" && action !== "reopened") return;
  if (isRemoval) return removeOwn();
  if (isRegister) return register();
  if (action !== "opened") return;
  if (isReport) {
    if (!has("report")) await addLabels(["report"]);
    await comment("Thanks. A maintainer will review this report. If the profile breaks the rules it will be removed. Please do not post personal data here.");
    return;
  }
  if (isIntro && !has("introduction")) await addLabels(["introduction"]);
}

main().catch((e) => { console.error(e); process.exit(1); });
