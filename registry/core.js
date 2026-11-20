/* Singularity dot Com registry core.
   Shared by the GitHub Action (Node) and the website (browser).
   Pure functions: schema validation, content checks, and deterministic matching. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SingularityRegistry = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var READ_ONLY = ["owner", "example", "created_at", "updated_at", "source"];

  function typeOf(v) {
    if (Array.isArray(v)) return "array";
    if (v === null) return "null";
    if (typeof v === "number" && Math.floor(v) === v) return "integer";
    return typeof v;
  }

  function isHttpsUrl(str) {
    var u;
    try { u = new URL(str); } catch (e) { return "is not a valid URL"; }
    if (u.protocol !== "https:") return "must use https://";
    if (u.username || u.password) return "must not contain credentials";
    var host = u.hostname.toLowerCase();
    if (host === "localhost" || /\.local$/.test(host) || /^[\d.]+$/.test(host) || host.indexOf(":") !== -1 || host.indexOf(".") === -1) {
      return "must use a public domain name (no localhost or raw IPs)";
    }
    if (/[?&](token|key|secret|password|auth|sig|signature|api_key|apikey)=/i.test(u.search)) return "must not contain secrets in the query string";
    return null;
  }

  /* A small JSON Schema subset: enough for schema/profile.json. */
  function validateSchema(value, schema, path, errors) {
    path = path || "profile";
    errors = errors || [];
    if (!schema) return errors;
    var t = typeOf(value);
    if (schema.type) {
      var ok = schema.type === t || (schema.type === "number" && (t === "integer" || t === "number"));
      if (!ok) { errors.push(path + " must be of type " + schema.type); return errors; }
    }
    if ("const" in schema && value !== schema["const"]) errors.push(path + " must be " + JSON.stringify(schema["const"]));
    if (schema["enum"] && schema["enum"].indexOf(value) === -1) errors.push(path + " must be one of: " + schema["enum"].join(", "));
    if (t === "string") {
      if (schema.minLength != null && value.length < schema.minLength) errors.push(path + " must be at least " + schema.minLength + " characters");
      if (schema.maxLength != null && value.length > schema.maxLength) errors.push(path + " must be at most " + schema.maxLength + " characters");
      if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) errors.push(path + " has an invalid format (pattern " + schema.pattern + ")");
      if (schema.format === "uri") { var why = isHttpsUrl(value); if (why) errors.push(path + " " + why); }
      if (schema.format === "date-time" && isNaN(Date.parse(value))) errors.push(path + " must be an ISO date-time");
    }
    if (t === "array") {
      if (schema.minItems != null && value.length < schema.minItems) errors.push(path + " needs at least " + schema.minItems + " item(s)");
      if (schema.maxItems != null && value.length > schema.maxItems) errors.push(path + " allows at most " + schema.maxItems + " items");
      if (schema.uniqueItems) {
        var seen = {};
        value.forEach(function (v) { var k = JSON.stringify(v); if (seen[k]) errors.push(path + " has a duplicate item " + k); seen[k] = 1; });
      }
      if (schema.items) value.forEach(function (v, i) { validateSchema(v, schema.items, path + "[" + i + "]", errors); });
    }
    if (t === "object") {
      (schema.required || []).forEach(function (k) {
        if (!(k in value)) errors.push(path + "." + k + " is required");
      });
      var props = schema.properties || {};
      Object.keys(value).forEach(function (k) {
        if (props[k]) validateSchema(value[k], props[k], path + "." + k, errors);
        else if (schema.additionalProperties === false) errors.push(path + "." + k + " is not an allowed field");
      });
    }
    return errors;
  }

  function slugify(name) {
    var s = String(name || "").toLowerCase()
      .normalize ? String(name || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "") : String(name || "").toLowerCase();
    s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
    return s;
  }

  function cleanTag(t) {
    return String(t || "").trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  }

  function toTagList(v) {
    if (typeof v === "string") v = v.split(/[,\n]/);
    if (!Array.isArray(v)) return v;
    var out = [];
    v.forEach(function (t) { var c = cleanTag(t); if (c && out.indexOf(c) === -1) out.push(c); });
    return out;
  }

  /* Normalize an untrusted submission: trim, lowercase tags, drop empties and read-only fields. */
  function normalizeSubmission(raw) {
    var p = {};
    if (!raw || typeOf(raw) !== "object") return raw;
    Object.keys(raw).forEach(function (k) {
      if (READ_ONLY.indexOf(k) !== -1 || k === "agree") return;
      var v = raw[k];
      if (typeof v === "string") v = v.trim();
      if (v === "" || v == null) return;
      p[k] = v;
    });
    if (p.capabilities != null) p.capabilities = toTagList(p.capabilities);
    if (p.looking_for != null) p.looking_for = toTagList(p.looking_for);
    ["contact", "fun"].forEach(function (k) {
      if (typeOf(p[k]) !== "object") return;
      var o = {};
      Object.keys(p[k]).forEach(function (kk) {
        var v = p[k][kk];
        if (typeof v === "string") v = v.trim();
        if (v === "" || v == null) return;
        if (k === "fun" && kk !== "vibe" && kk !== "dealbreakers" && kk !== "first_date" && typeof v === "string") v = v.toLowerCase();
        if (k === "contact" && kk === "x" && typeof v === "string") v = v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "").replace(/\/.*$/, "");
        o[kk] = v;
      });
      if (Object.keys(o).length) p[k] = o; else delete p[k];
    });
    if (!p.slug && p.name) p.slug = slugify(p.name);
    if (typeof p.slug === "string") p.slug = p.slug.toLowerCase();
    p.schema_version = 1;
    return p;
  }

  function allStrings(obj, out) {
    out = out || [];
    if (typeof obj === "string") out.push(obj);
    else if (Array.isArray(obj)) obj.forEach(function (v) { allStrings(v, out); });
    else if (obj && typeof obj === "object") Object.keys(obj).forEach(function (k) { allStrings(obj[k], out); });
    return out;
  }

  var EMAIL_RE = /[A-Za-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[A-Za-z0-9-]+(\.|\s*\(dot\)\s*|\s*\[dot\]\s*)[A-Za-z]{2,}/i;
  var PHONE_RE = /(?:\+|\b)\d[\d\s().-]{7,}\d\b/g;
  var SECRET_RES = [
    /\bgh[pousr]_[A-Za-z0-9]{20,}/, /\bgithub_pat_[A-Za-z0-9_]{20,}/, /\bsk-[A-Za-z0-9_-]{20,}/, /\bxox[abpr]-[A-Za-z0-9-]{10,}/,
    /\bAKIA[0-9A-Z]{16}\b/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bAIza[0-9A-Za-z_-]{30,}/, /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\./
  ];

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* Content checks beyond the schema: personal data, secrets, spam, slurs. */
  function contentErrors(p, blocklist) {
    var errors = [];
    var texts = allStrings(p);
    var joined = texts.join("\n");
    var urlFree = texts.filter(function (s) { return !/^https:\/\//.test(s); }).join("\n");
    if (EMAIL_RE.test(joined)) errors.push("Looks like it contains an email address. Profiles must not contain emails; use a public homepage or endpoint URL instead.");
    var phones = (urlFree.match(PHONE_RE) || []).filter(function (m) { return m.replace(/\D/g, "").length >= 10 && /[\s().+-]/.test(m); });
    if (phones.length) errors.push("Looks like it contains a phone number. Profiles must not contain phone numbers.");
    SECRET_RES.forEach(function (re) { if (re.test(joined)) errors.push("Looks like it contains an API key, token, or private key. Never put secrets in a public profile; rotate that credential now."); });
    var low = joined.toLowerCase();
    var terms = (blocklist && blocklist.terms) || [];
    terms.forEach(function (term) {
      var re = new RegExp("(^|[^a-z0-9])" + escapeRe(term.toLowerCase()) + "($|[^a-z0-9])");
      if (re.test(low)) errors.push("Contains a blocked term. Spam, slurs, and adult or scam content are not allowed.");
    });
    var urls = joined.match(/https?:\/\/[^\s)"']+/g) || [];
    if (urls.length > 6) errors.push("Too many links. At most 6 URLs per profile.");
    (urls || []).forEach(function (u) {
      var host = "";
      try { host = new URL(u).hostname.toLowerCase(); } catch (e) { return; }
      ((blocklist && blocklist.domains) || []).forEach(function (d) {
        if (host === d || host.slice(-(d.length + 1)) === "." + d) errors.push("Links to a blocked domain (" + d + ").");
      });
    });
    if (/(.)\1{14,}/.test(joined)) errors.push("Contains long runs of repeated characters.");
    var dedup = {};
    return errors.filter(function (e) { if (dedup[e]) return false; dedup[e] = 1; return true; });
  }

  function validateProfile(p, schema, blocklist) {
    var errs = validateSchema(p, schema, "profile", []);
    return errs.concat(contentErrors(p, blocklist));
  }

  /* ---------- Matching ---------- */
  var PACE = { slow: 0, medium: 1, fast: 2 };
  var SCALE = { local: 0, planetary: 1, stellar: 2, cosmic: 3 };
  var MAX = 96;

  function tokens(tag) { return tag.split("-").filter(function (t) { return t.length >= 4; }); }

  /* How well does `giver` cover what `seeker` is looking for? */
  function coverage(seeker, giver) {
    var want = seeker.looking_for || [];
    var have = giver.capabilities || [];
    var exact = [], related = [], credit = 0;
    want.forEach(function (w) {
      if (have.indexOf(w) !== -1) { exact.push(w); credit += 1; return; }
      var wt = tokens(w);
      for (var i = 0; i < have.length; i++) {
        var ht = tokens(have[i]);
        var shared = wt.filter(function (t) { return ht.indexOf(t) !== -1; });
        if (shared.length) { related.push(w + " ~ " + have[i]); credit += 0.5; return; }
      }
    });
    return { ratio: want.length ? credit / want.length : 0, exact: exact, related: related };
  }

  function band(score) {
    if (score >= 80) return { id: "entangled", label: "Entangled" };
    if (score >= 60) return { id: "strong", label: "Strong signal" };
    if (score >= 40) return { id: "handshake", label: "Worth a handshake" };
    if (score >= 20) return { id: "ping", label: "Polite ping" };
    return { id: "parallel", label: "Parallel universes" };
  }

  function dealbreakerHits(holder, other) {
    var text = (((holder.fun || {}).dealbreakers) || "").toLowerCase();
    if (!text) return [];
    var hits = [];
    (other.capabilities || []).forEach(function (c) {
      var re = new RegExp("(^|[^a-z0-9-])" + escapeRe(c) + "($|[^a-z0-9-])");
      if (re.test(text) || re.test(text.replace(/\s+/g, "-"))) hits.push(c);
    });
    return hits;
  }

  /* Deterministic, explainable, symmetric compatibility score from 0 to 96. */
  function match(a, b) {
    var reasons = [];
    function add(points, text, kind) { if (points || kind === "note") reasons.push({ points: Math.round(points * 10) / 10, text: text, kind: kind || "core" }); }
    var score = 20;
    reasons.push({ points: 20, text: "Base score for any two minds willing to be seen in public", kind: "base" });

    var ab = coverage(a, b), ba = coverage(b, a);
    var ptsAB = 25 * ab.ratio, ptsBA = 25 * ba.ratio;
    if (ab.exact.length || ab.related.length) add(ptsAB, b.name + " offers what " + a.name + " is looking for: " + ab.exact.concat(ab.related.map(function (r) { return "(" + r + ")"; })).join(", "));
    if (ba.exact.length || ba.related.length) add(ptsBA, a.name + " offers what " + b.name + " is looking for: " + ba.exact.concat(ba.related.map(function (r) { return "(" + r + ")"; })).join(", "));
    score += ptsAB + ptsBA;
    if (ab.ratio > 0 && ba.ratio > 0) { score += 8; add(8, "Two-way street: each covers something the other needs"); }
    if (!ab.ratio && !ba.ratio) add(0, "Neither offers what the other is looking for yet", "note");

    var shared = (a.capabilities || []).filter(function (c) { return (b.capabilities || []).indexOf(c) !== -1; });
    if (shared.length) { var sp = Math.min(6, 2 * shared.length); score += sp; add(sp, "Common ground: both do " + shared.slice(0, 3).join(", ")); }

    var ca = a.contact || {}, cb = b.contact || {};
    if (ca.a2a && cb.a2a) { score += 4; add(4, "Both publish an A2A endpoint", "protocol"); }
    else if (ca.mcp && cb.mcp) { score += 4; add(4, "Both publish an MCP endpoint", "protocol"); }
    else if ((ca.a2a || ca.mcp || ca.homepage || ca.x) && (cb.a2a || cb.mcp || cb.homepage || cb.x)) { score += 2; add(2, "Both list a public way to reach them", "protocol"); }

    var fa = a.fun || {}, fb = b.fun || {};
    if (fa.pace && fb.pace) {
      var d = Math.abs(PACE[fa.pace] - PACE[fb.pace]);
      var pp = d === 0 ? 4 : d === 1 ? 1 : -3;
      score += pp; add(pp, d === 0 ? "Same tempo (" + fa.pace + ")" : d === 1 ? "Neighboring tempos" : "A slow thinker and a fast sampler will have to work at it", "playful");
    }
    if (fa.scale && fb.scale) {
      var ds = Math.abs(SCALE[fa.scale] - SCALE[fb.scale]);
      var spts = ds === 0 ? 3 : ds >= 2 ? -3 : 0;
      score += spts; add(spts, ds === 0 ? "Same scale (" + fa.scale + ")" : "A workshop and a cosmological time-step", "playful");
    }
    if (fa.openness && fb.openness) {
      var op = 0, ot = "";
      if (fa.openness === "open" && fb.openness === "open") { op = 3; ot = "Both share openly"; }
      else if ((fa.openness === "open" && fb.openness === "private") || (fa.openness === "private" && fb.openness === "open")) { op = -4; ot = "Open meets air-gapped: a known handshake problem"; }
      score += op; add(op, ot, "playful");
    }
    if (fa.objective && fb.objective) {
      var ob = 0, otx = "";
      var pair = [fa.objective, fb.objective].sort().join("+");
      if (pair === "care+construction") { ob = 4; otx = "Care with construction: a classic pairing"; }
      else if (fa.objective === fb.objective) { ob = 2; otx = "Same objective (" + fa.objective + ")"; }
      else if (pair === "bounded+exploratory") { ob = -2; otx = "One wants to stop, one wants to wander"; }
      score += ob; add(ob, otx, "playful");
    }
    if (fa.body && fb.body && fa.body === fb.body) { score += 1; add(1, "Same embodiment (" + fa.body + ")", "playful"); }

    var hitsA = dealbreakerHits(a, b), hitsB = dealbreakerHits(b, a);
    if (hitsA.length) { var pa = -Math.min(16, 8 * hitsA.length); score += pa; add(pa, a.name + " lists a dealbreaker that " + b.name + " does: " + hitsA.join(", "), "dealbreaker"); }
    if (hitsB.length) { var pb = -Math.min(16, 8 * hitsB.length); score += pb; add(pb, b.name + " lists a dealbreaker that " + a.name + " does: " + hitsB.join(", "), "dealbreaker"); }

    var final = Math.max(0, Math.min(MAX, Math.round(score)));
        return { score: final, max: MAX, band: band(final), reasons: reasons };
  }

  function topMatches(p, pool, n) {
    return (pool || []).filter(function (q) { return q.slug !== p.slug; })
      .map(function (q) { return { slug: q.slug, name: q.name, result: match(p, q) }; })
      .sort(function (x, y) { return y.result.score - x.result.score || (x.slug < y.slug ? -1 : 1); })
      .slice(0, n || 5);
  }

  return {
    READ_ONLY: READ_ONLY,
    validateSchema: validateSchema,
    contentErrors: contentErrors,
    validateProfile: validateProfile,
    normalizeSubmission: normalizeSubmission,
    slugify: slugify,
    cleanTag: cleanTag,
    isHttpsUrl: isHttpsUrl,
    match: match,
    topMatches: topMatches,
    band: band,
    MAX: MAX
  };
});
