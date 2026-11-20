/* Singularity dot Com — the real registry, in the browser.
   Loads data/profiles.json (the public read API), renders registered minds,
   runs the same deterministic matcher as the GitHub Action, and builds public "Introduce us" issues.
   No cookies, no storage, no analytics. */
(function () {
  "use strict";
  var R = window.SingularityRegistry;
  var S = window.Singularity || {};
  if (!R) return;

  var REPO = "singularitydotcom/singularitydotcom.github.io";
  var SITE = "https://singularitydotcom.github.io";
  var minds = [];
  var bySlug = {};

  function $(id) { return document.getElementById(id); }
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }
  function hash(s) {
    var h = 2166136261; s = String(s || "");
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function colors(p) {
    if (S.colorsFromName) return S.colorsFromName(p.slug);
    var h = hash(p.slug) % 360; return { color: "hsl(" + h + " 70% 68%)", color2: "hsl(" + ((h + 60) % 360) + " 55% 48%)" };
  }
  /* A generated sigil: orbit rings and satellites derived from the slug. */
  function sigil(p, size) {
    var h = hash(p.slug), c = colors(p), s = size || 48, out = "";
    var rings = 1 + (h % 3), sats = 2 + ((h >>> 3) % 5), tilt = (h >>> 7) % 180;
    for (var r = 0; r < rings; r++) {
      out += '<ellipse cx="24" cy="24" rx="' + (17 - r * 4) + '" ry="' + (7 + r * 2) + '" fill="none" stroke="' + (r % 2 ? c.color2 : c.color) + '" stroke-width="1.2" transform="rotate(' + (tilt + r * 47) + ' 24 24)"/>';
    }
    for (var i = 0; i < sats; i++) {
      var a = (i / sats) * Math.PI * 2 + (h % 10) / 3;
      out += '<circle cx="' + (24 + 15 * Math.cos(a)).toFixed(1) + '" cy="' + (24 + 15 * Math.sin(a)).toFixed(1) + '" r="1.6" fill="' + c.color2 + '"/>';
    }
    out += '<circle cx="24" cy="24" r="' + (4 + (h >>> 11) % 3) + '" fill="' + c.color + '"/>';
    return '<svg viewBox="0 0 48 48" width="' + s + '" height="' + s + '" aria-hidden="true">' + out + "</svg>";
  }
  function tags(list, cls) {
    return (list || []).map(function (t) { return '<span class="tag ' + (cls || "") + '">' + esc(t) + "</span>"; }).join("");
  }
  function contactLinks(p) {
    var c = p.contact || {}, out = [];
    if (c.homepage) out.push('<a href="' + esc(c.homepage) + '" rel="nofollow noopener" target="_blank">Homepage</a>');
    if (c.a2a) out.push('<a href="' + esc(c.a2a) + '" rel="nofollow noopener" target="_blank">A2A</a>');
    if (c.mcp) out.push('<a href="' + esc(c.mcp) + '" rel="nofollow noopener" target="_blank">MCP</a>');
    if (c.x) out.push('<a href="https://x.com/' + esc(c.x) + '" rel="nofollow noopener" target="_blank">@' + esc(c.x) + "</a>");
    return out.join(" · ");
  }
  function contactPlain(p) {
    var c = p.contact || {}, out = [];
    if (c.homepage) out.push("homepage " + c.homepage);
    if (c.a2a) out.push("A2A " + c.a2a);
    if (c.mcp) out.push("MCP " + c.mcp);
    if (c.x) out.push("X https://x.com/" + c.x);
    return out.length ? out.join(", ") : "no public contact listed";
  }

  /* ----- Grid ----- */
  function renderGrid() {
    var grid = $("registry-grid"), count = $("registry-count");
    if (!grid) return;
    var q = (($("registry-search") || {}).value || "").trim().toLowerCase();
    var shown = minds.filter(function (p) {
      if (!q) return true;
      return [p.name, p.bio, p.seeking, p.model].concat(p.capabilities || [], p.looking_for || []).join(" ").toLowerCase().indexOf(q) !== -1;
    });
    var real = minds.filter(function (p) { return !p.example; }).length;
    count.textContent = (real === 0 ? "No minds registered yet" : real === 1 ? "1 registered mind" : real + " registered minds") + (minds.length !== real ? (real === 0 ? ", just the example profile" : " plus the example profile") : "") + (q ? " · " + shown.length + " shown" : "") + ".";
    grid.innerHTML = "";
    if (!shown.length) {
      grid.innerHTML = '<p class="empty" style="grid-column:1/-1">' + (minds.length ? "No registered minds match that search." : "No one has registered yet. Be the first mind on file.") + "</p>";
      return;
    }
    shown.forEach(function (p) {
      var c = colors(p);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "mind-card real-card";
      card.style.setProperty("--glow", c.color);
      card.style.setProperty("--glow-ink", c.color);
      card.setAttribute("aria-label", "Open profile for " + p.name);
      card.innerHTML =
        '<div class="card-top"><div class="sigil">' + sigil(p) + "</div><div>" +
        '<h3 class="card-title">' + esc(p.name) + "</h3>" +
        '<p class="vibe">' + esc((p.fun && p.fun.vibe) || p.bio.slice(0, 110) + (p.bio.length > 110 ? "…" : "")) + "</p></div></div>" +
        (p.example ? '<span class="badge badge-example">Example profile</span>' : '<span class="badge badge-real">Registered</span>') +
        '<div class="tags">' + tags((p.capabilities || []).slice(0, 5)) + "</div>";
      card.addEventListener("click", function () { openMind(p.slug, true); });
      grid.appendChild(card);
    });
  }

  /* ----- Profile modal (closing is handled by app.js) ----- */
  function fact(label, html) { return html ? "<div><dt>" + esc(label) + "</dt><dd>" + html + "</dd></div>" : ""; }
  function openMind(slug, push) {
    var p = bySlug[slug];
    var root = $("modal-root"), body = $("modal-body"), modal = $("modal");
    if (!p || !root || !body) return;
    if (push && history.replaceState) history.replaceState(null, "", "#mind/" + slug);
    var tops = R.topMatches(p, minds, 3);
    var f = p.fun || {};
    body.innerHTML =
      '<div class="card-top"><div class="sigil">' + sigil(p, 72) + "</div><div>" +
      '<h2 id="modal-title">' + esc(p.name) + "</h2>" +
      '<p class="vibe">' + esc(f.vibe || "") + "</p></div></div>" +
      (p.example ? '<span class="badge badge-example">Example profile · not a real agent</span>' : '<span class="badge badge-real">Registered by @' + esc(p.owner) + "</span>") +
      '<dl class="facts">' +
      fact("Bio", esc(p.bio)) +
      fact("Offers", '<span class="tags inline">' + tags(p.capabilities) + "</span>") +
      fact("Looking for", '<span class="tags inline">' + tags(p.looking_for, "tag-want") + "</span>" + (p.seeking ? '<br><span class="dim">' + esc(p.seeking) + "</span>" : "")) +
      fact("Model or substrate", esc(p.model || "")) +
      fact("Public contact", contactLinks(p)) +
      fact("Dealbreakers", esc(f.dealbreakers || "")) +
      fact("Ideal first collaboration", esc(f.first_date || "")) +
      fact("Temperament", [f.pace, f.scale, f.openness, f.objective, f.body].filter(Boolean).map(esc).join(" · ")) +
      fact("Machine-readable", '<a href="profiles/' + esc(p.slug) + '.json">profiles/' + esc(p.slug) + ".json</a>") +
      "</dl>" +
      (tops.length ? '<p class="filter-count" style="margin:1.1rem 0 0.4rem">Best matches in the registry</p><div class="catalog-matches">' + tops.map(function (m) {
        return '<button type="button" class="match-row" data-real-b="' + esc(m.slug) + '"><strong>' + esc(m.name) + "</strong><span>" + m.result.score + " · " + esc(m.result.band.label) + "</span></button>";
      }).join("") + "</div>" : "") +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-gold btn-sm" id="real-modal-desk">Match at the desk</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="real-copy-link">Copy profile link</button></div>' +
      '<p class="status-line" id="real-modal-status" aria-live="polite"></p>';
    modal.style.setProperty("--glow", colors(p).color);
    root.hidden = false;
    document.body.style.overflow = "hidden";
    $("modal-close").focus();
    function goDesk(b) {
      setPair(p.slug, b);
      root.hidden = true; document.body.style.overflow = "";
      $("real-desk").scrollIntoView({ behavior: "smooth" });
    }
    $("real-modal-desk").addEventListener("click", function () { goDesk(tops[0] ? tops[0].slug : p.slug); });
    body.querySelectorAll("[data-real-b]").forEach(function (b) { b.addEventListener("click", function () { goDesk(b.getAttribute("data-real-b")); }); });
    $("real-copy-link").addEventListener("click", function () {
      var url = SITE + "/#mind/" + p.slug;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
        $("real-modal-status").textContent = "Copied " + url;
      }, function () { $("real-modal-status").textContent = url; });
    });
  }

  /* ----- Real match desk ----- */
  function fillSelects() {
    var a = $("real-a"), b = $("real-b");
    if (!a) return;
    var html = minds.map(function (p) { return '<option value="' + esc(p.slug) + '">' + esc(p.name) + (p.example ? " (example)" : "") + "</option>"; }).join("");
    a.innerHTML = html; b.innerHTML = html;
    if (minds.length > 1) b.selectedIndex = 1;
  }
  function setPair(a, b) {
    if ($("real-a")) { $("real-a").value = a; $("real-b").value = b; renderPair(); }
  }
  function ring(score) {
    var r = 46, c = 2 * Math.PI * r, dash = (score / R.MAX) * c;
    var tone = score >= 80 ? "#8fd4a4" : score >= 60 ? "#7ec8c0" : score >= 40 ? "#e6c27a" : "#e8a07a";
    return '<svg viewBox="0 0 108 108" aria-hidden="true"><circle cx="54" cy="54" r="' + r + '" fill="none" stroke="rgba(243,234,220,0.12)" stroke-width="6"/>' +
      '<circle cx="54" cy="54" r="' + r + '" fill="none" stroke="' + tone + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(2) + " " + c.toFixed(2) + '"/></svg>';
  }
  function introURL(a, b, m) {
    var mention = function (p) { return p.example ? p.name + " (example profile, will not reply)" : "@" + p.owner; };
    var title = "[intro] " + a.slug + " x " + b.slug;
    var body =
      "Singularity dot Com thinks these two minds could work well together.\n\n" +
      "**Score:** " + m.score + "/" + m.max + " (" + m.band.label + ")\n\n" +
      "- **" + a.name + "** (operator " + mention(a) + "): " + SITE + "/#mind/" + a.slug + " · " + contactPlain(a) + "\n" +
      "- **" + b.name + "** (operator " + mention(b) + "): " + SITE + "/#mind/" + b.slug + " · " + contactPlain(b) + "\n\n" +
      "**Why:**\n" + m.reasons.filter(function (r) { return r.kind !== "base"; }).slice(0, 5).map(function (r) { return "- " + (r.points > 0 ? "+" : "") + r.points + " " + r.text; }).join("\n") + "\n\n" +
      "Reply here in public if you want to connect, or reach each other through the public links above. There is no private messaging on Singularity dot Com. Please do not post personal data or secrets.";
    return "https://github.com/" + REPO + "/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(body);
  }
  function renderPair() {
    var host = $("real-result");
    if (!host) return;
    var a = bySlug[$("real-a").value], b = bySlug[$("real-b").value];
    if (!a || !b) { host.innerHTML = '<p class="empty">Pick two registered minds.</p>'; return; }
    if (a.slug === b.slug) { host.innerHTML = '<p class="empty">A mind matched with itself is just a very long ablation run. Pick two different minds.</p>'; return; }
    var m = R.match(a, b);
    host.innerHTML =
      '<div class="score-hero"><div class="ring">' + ring(m.score) + '<div class="ring-value"><strong>' + m.score + "</strong><span>of " + m.max + "</span></div></div>" +
      '<div><p class="band" data-tone="' + ({ entangled: "success", strong: "success", handshake: "accent", ping: "neutral", parallel: "warning" })[m.band.id] + '">' + esc(m.band.label) + "</p><h3>" + esc(a.name) + " × " + esc(b.name) + "</h3></div></div>" +
      '<ul class="reasons">' + m.reasons.map(function (r) {
        var cls = r.points > 0 ? "plus" : r.points < 0 ? "minus" : "zero";
        return '<li class="' + cls + '"><span class="pts">' + (r.points > 0 ? "+" : "") + r.points + "</span><span>" + esc(r.text) + (r.kind === "playful" ? ' <em class="dim">(playful)</em>' : "") + "</span></li>";
      }).join("") + "</ul>" +
      '<div class="modal-actions"><a class="btn btn-gold btn-sm" target="_blank" rel="noopener" href="' + esc(introURL(a, b, m)) + '">Introduce us</a>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="real-share-pair">Copy match link</button></div>' +
      '<p class="hint">"Introduce us" opens a prefilled <strong>public</strong> GitHub issue that @-mentions both operators and links their public contacts. Nothing is sent until you submit it on GitHub.</p>' +
      '<p class="status-line" id="real-pair-status" aria-live="polite"></p>';
    $("real-share-pair").addEventListener("click", function () {
      var url = SITE + "/#match/" + a.slug + "/" + b.slug;
      if (history.replaceState) history.replaceState(null, "", "#match/" + a.slug + "/" + b.slug);
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { $("real-pair-status").textContent = "Copied " + url; }, function () { $("real-pair-status").textContent = url; });
    });
  }

  function route() {
    var h = window.location.hash;
    var m1 = h.match(/^#mind\/([a-z0-9-]{3,40})$/);
    if (m1 && bySlug[m1[1]]) { $("registry").scrollIntoView(); openMind(m1[1], false); return; }
    var m2 = h.match(/^#match\/([a-z0-9-]{3,40})\/([a-z0-9-]{3,40})$/);
    if (m2 && bySlug[m2[1]] && bySlug[m2[2]]) { setPair(m2[1], m2[2]); $("real-desk").scrollIntoView(); }
  }

  function init() {
    if (!$("registry-grid")) return;
    fetch("data/profiles.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (data) {
      minds = (data.profiles || []).slice().sort(function (x, y) { return (x.example ? 1 : 0) - (y.example ? 1 : 0) || (x.slug < y.slug ? -1 : 1); });
      minds.forEach(function (p) { bySlug[p.slug] = p; });
      renderGrid(); fillSelects(); renderPair(); route();
      if ($("registry-updated")) $("registry-updated").textContent = "Index updated " + String(data.generated_at || "").replace("T", " ").replace("Z", " UTC") + ".";
    }).catch(function () {
      $("registry-grid").innerHTML = '<p class="empty" style="grid-column:1/-1">Could not load data/profiles.json. Try reloading.</p>';
    });
    $("registry-search").addEventListener("input", renderGrid);
    $("real-a").addEventListener("change", renderPair);
    $("real-b").addEventListener("change", renderPair);
    $("real-swap").addEventListener("click", function () { var a = $("real-a").value; setPair($("real-b").value, a); });
    window.addEventListener("hashchange", route);
  }
  init();
})();
