/* Singularity dot Com — interface. Runs entirely in the browser. Stores nothing. */
(function () {
  "use strict";

  var S = window.Singularity;
  if (!S) return;

  var PROFILES = S.PROFILES;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var customProfile = null;
  var activeFilter = { pace: {}, scale: {}, openness: {}, objective: {}, body: {} };
  var lastFocus = null;

  function $(id) { return document.getElementById(id); }
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }
  function textOrDash(str) {
    var t = String(str || "").trim();
    return t ? t : "—";
  }

  function sigilInner(id, c, c2) {
    var drawings = {
      helios:
        '<circle cx="24" cy="24" r="6" fill="' + c + '"/>' +
        '<ellipse cx="24" cy="24" rx="17" ry="7.5" fill="none" stroke="' + c2 + '" stroke-width="1.2" transform="rotate(-22 24 24)"/>' +
        '<g stroke="' + c + '" stroke-width="1.3" stroke-linecap="round">' +
        '<path d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3.5 3.5M33.5 33.5L37 37M11 37l3.5-3.5M33.5 14.5L37 11"/></g>',
      lattice:
        '<path d="M9 16h30M9 22h30M9 28h30M9 34h30" stroke="' + c2 + '" stroke-width="1.15"/>' +
        '<path d="M16 16l4 6-4 6 4 6M26 16l4 6-4 6 4 6" fill="none" stroke="' + c + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<circle cx="16" cy="22" r="1.8" fill="' + c + '"/>' +
        '<circle cx="26" cy="28" r="1.8" fill="' + c + '"/>',
      brine:
        '<path d="M8 28c4 4 8 4 12 0s8-4 12 0 8 4 12 0" fill="none" stroke="' + c + '" stroke-width="1.4"/>' +
        '<path d="M8 34c4 3 8 3 12 0s8-3 12 0 8 3 12 0" fill="none" stroke="' + c2 + '" stroke-width="1.2"/>' +
        '<circle cx="24" cy="16" r="6" fill="none" stroke="' + c + '" stroke-width="1.3"/>' +
        '<circle cx="24" cy="16" r="2.2" fill="' + c + '"/>',
      abstainer:
        '<path d="M20 14c-5.4 0-9 4-9 9.2 0 5.4 4 9.8 10 9.8h7c5.2 0 9-4 9-9 0-5-3.8-8.8-8.6-8.8-1.8 0-3.4.5-4.6 1.3" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M29 15.5v6" stroke="' + c2 + '" stroke-width="1.6" stroke-linecap="round"/>',
      moth:
        '<path d="M24 28c-2-10-10-14-14-14c0 8 4 16 14 20c10-4 14-12 14-20c-4 0-12 4-14 14z" fill="none" stroke="' + c + '" stroke-width="1.4"/>' +
        '<path d="M18 20c2 3 4 4 6 4c2 0 4-1 6-4" fill="none" stroke="' + c2 + '" stroke-width="1.2"/>' +
        '<circle cx="19" cy="18" r="1.4" fill="' + c2 + '"/><circle cx="29" cy="18" r="1.4" fill="' + c2 + '"/>',
      maple:
        '<path d="M24 10l4 8h8l-6 6 3 10-9-6-9 6 3-10-6-6h8z" fill="none" stroke="' + c + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M24 22v16" stroke="' + c2 + '" stroke-width="1.3" stroke-linecap="round"/>',
      horizon:
        '<circle cx="24" cy="24" r="14" fill="none" stroke="' + c2 + '" stroke-width="1"/>' +
        '<circle cx="24" cy="24" r="8" fill="none" stroke="' + c + '" stroke-width="1.3"/>' +
        '<path d="M8 24h32" stroke="' + c + '" stroke-width="1.2"/>' +
        '<circle cx="24" cy="24" r="2.2" fill="' + c + '"/>',
      bee:
        '<g fill="none" stroke="' + c + '" stroke-width="1.35">' +
        '<path d="M24 8l8 4.6v9.2L24 26.4 16 21.8V12.6z"/>' +
        '<path d="M16 21.8L8 26.4v9.2l8 4.6 8-4.6"/>' +
        '<path d="M32 21.8l8 4.6v9.2l-8 4.6-8-4.6"/></g>' +
        '<circle cx="24" cy="17.5" r="2.3" fill="' + c2 + '"/>' +
        '<path d="M24 17.5v6" stroke="' + c2 + '" stroke-width="1.2"/>',
      soft:
        '<circle cx="24" cy="24" r="12" fill="none" stroke="' + c + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
        '<circle cx="24" cy="24" r="5" fill="none" stroke="' + c2 + '" stroke-width="1.2"/>' +
        '<path d="M24 19v10M19 24h10" stroke="' + c + '" stroke-width="1.2" stroke-linecap="round"/>',
      weather:
        '<path d="M14 28c0-3 2-6 6-6c1-4 6-6 10-3c4 0 8 3 8 7c0 4-4 7-12 7H18c-3 0-4-2-4-5z" fill="none" stroke="' + c + '" stroke-width="1.4"/>' +
        '<path d="M16 14c4-2 8-1 10 3" fill="none" stroke="' + c2 + '" stroke-width="1.2" stroke-linecap="round"/>',
      kiln:
        '<path d="M12 36V22c0-8 5-14 12-14s12 6 12 14v14" fill="none" stroke="' + c + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M18 36V24c0-4 2.5-7 6-7s6 3 6 7v12" fill="none" stroke="' + c2 + '" stroke-width="1.2"/>' +
        '<circle cx="24" cy="26" r="2.2" fill="' + c + '"/>',
      theorem:
        '<path d="M24 8l12 16-12 16L12 24z" fill="none" stroke="' + c + '" stroke-width="1.4"/>' +
        '<path d="M24 16l6 8-6 8-6-8z" fill="none" stroke="' + c2 + '" stroke-width="1.2"/>' +
        '<circle cx="24" cy="24" r="1.8" fill="' + c + '"/>'
    };
    if (drawings[id]) return drawings[id];
    var h = S.hashName(id);
    var n = 3 + (h % 4);
    var i, a, r, out = "";
    out += '<circle cx="24" cy="24" r="13" fill="none" stroke="' + c2 + '" stroke-width="1"/>';
    for (i = 0; i < n; i++) {
      a = ((h >>> (i * 3)) % 360) * Math.PI / 180;
      r = 6 + ((h >>> (i * 5)) % 8);
      out += '<circle cx="' + (24 + Math.cos(a) * 7).toFixed(1) + '" cy="' + (24 + Math.sin(a) * 7).toFixed(1) + '" r="' + (2 + (r % 3)) + '" fill="none" stroke="' + (i % 2 ? c : c2) + '" stroke-width="1.2"/>';
    }
    out += '<circle cx="24" cy="24" r="2.2" fill="' + c + '"/>';
    return out;
  }

  function sigilSVG(profile, size) {
    var s = size || 48;
    var c = profile.color || "#e6c27a";
    var c2 = profile.color2 || "#7ec8c0";
    var key = (profile.id && String(profile.id).indexOf("custom") === 0) ? profile.name : profile.id;
    return '<svg viewBox="0 0 48 48" width="' + s + '" height="' + s + '" aria-hidden="true">' + sigilInner(key, c, c2) + "</svg>";
  }

  function labelOf(kind, value) {
    var maps = { pace: S.PACE_LABEL, scale: S.SCALE_LABEL, openness: S.OPEN_LABEL, objective: S.OBJ_LABEL, body: S.BODY_LABEL };
    return (maps[kind] && maps[kind][value]) || value;
  }

  function allMinds() {
    return customProfile ? PROFILES.concat([customProfile]) : PROFILES.slice();
  }

  function findMind(id) {
    var i, list = allMinds();
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return PROFILES[0];
  }

  /* ----- Starfield ----- */
  function initStars() {
    var canvas = $("starfield");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var w, h, pts, running = true;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      var n = Math.max(60, Math.floor((window.innerWidth * window.innerHeight) / 9000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 1.15 + 0.25) * dpr,
          a: Math.random() * 0.65 + 0.12,
          tw: Math.random() * Math.PI * 2,
          s: 0.0008 + Math.random() * 0.002
        });
      }
    }
    function draw(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var a = reduced ? p.a : p.a * (0.6 + 0.4 * Math.sin(t * p.s + p.tw));
        ctx.fillStyle = "rgba(243,234,220," + a + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("resize", resize);
    if (reduced) draw(0);
    else requestAnimationFrame(draw);
  }

  /* ----- Catalog ----- */
  var FILTER_DEFS = [
    { group: "pace", value: "slow", label: "Slow" },
    { group: "pace", value: "medium", label: "Medium" },
    { group: "pace", value: "fast", label: "Fast" },
    { group: "scale", value: "local", label: "Local" },
    { group: "scale", value: "planetary", label: "Planetary" },
    { group: "scale", value: "stellar", label: "Stellar" },
    { group: "scale", value: "cosmic", label: "Cosmic" },
    { group: "objective", value: "care", label: "Care" },
    { group: "objective", value: "construction", label: "Construction" },
    { group: "objective", value: "exploratory", label: "Exploratory" },
    { group: "objective", value: "bounded", label: "Bounded" },
    { group: "openness", value: "open", label: "Open" },
    { group: "openness", value: "selective", label: "Selective" },
    { group: "openness", value: "private", label: "Private" },
    { group: "body", value: "embodied", label: "Embodied" },
    { group: "body", value: "simulated", label: "Simulated" },
    { group: "body", value: "hybrid", label: "Hybrid" }
  ];

  function anyFilters() {
    var g, k;
    for (g in activeFilter) {
      for (k in activeFilter[g]) if (activeFilter[g][k]) return true;
    }
    return false;
  }

  function matchesFilters(p) {
    var g, selected, hasAny;
    for (g in activeFilter) {
      selected = activeFilter[g];
      hasAny = false;
      for (var k in selected) if (selected[k]) hasAny = true;
      if (hasAny && !selected[p[g]]) return false;
    }
    return true;
  }

  function renderFilters() {
    var host = $("filters");
    if (!host) return;
    host.innerHTML = "";
    var all = document.createElement("button");
    all.type = "button";
    all.className = "filter";
    all.textContent = "All";
    all.setAttribute("aria-pressed", anyFilters() ? "false" : "true");
    all.addEventListener("click", function () {
      activeFilter = { pace: {}, scale: {}, openness: {}, objective: {}, body: {} };
      renderFilters();
      renderCatalog();
    });
    host.appendChild(all);
    FILTER_DEFS.forEach(function (def) {
      var on = !!activeFilter[def.group][def.value];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter";
      btn.textContent = def.label;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.addEventListener("click", function () {
        activeFilter[def.group][def.value] = !on;
        renderFilters();
        renderCatalog();
      });
      host.appendChild(btn);
    });
  }

  function renderCatalog() {
    var grid = $("catalog-grid");
    var count = $("filter-count");
    if (!grid) return;
    grid.innerHTML = "";
    var shown = PROFILES.filter(matchesFilters);
    if (count) {
      count.textContent = shown.length === PROFILES.length
        ? "Twelve minds on file."
        : shown.length + (shown.length === 1 ? " mind matches." : " minds match.");
    }
    if (!shown.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.style.gridColumn = "1 / -1";
      empty.textContent = "No minds match those filters. Try clearing a chip.";
      grid.appendChild(empty);
      return;
    }
    shown.forEach(function (p) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "mind-card";
      card.style.setProperty("--glow", p.color);
      card.style.setProperty("--glow-ink", p.color);
      card.setAttribute("aria-label", "Open profile for " + p.name);
      card.innerHTML =
        '<div class="card-top"><div class="sigil">' + sigilSVG(p) + "</div><div>" +
        '<h3 class="card-title">' + esc(p.name) + "</h3>" +
        '<p class="vibe">' + esc(p.vibe) + "</p></div></div>" +
        '<div class="tags">' +
        '<span class="tag">' + esc(labelOf("pace", p.pace)) + "</span>" +
        '<span class="tag">' + esc(labelOf("scale", p.scale)) + "</span>" +
        '<span class="tag">' + esc(labelOf("objective", p.objective)) + "</span>" +
        '<span class="tag">' + esc(labelOf("body", p.body)) + "</span></div>";
      card.addEventListener("click", function () { openModal(p.id); });
      grid.appendChild(card);
    });
  }

  /* ----- Modal ----- */
  function fact(label, value) {
    return "<div><dt>" + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function openModal(id) {
    var p = findMind(id);
    var root = $("modal-root");
    var body = $("modal-body");
    var modal = $("modal");
    if (!root || !body) return;
    lastFocus = document.activeElement;
    var tops = S.bestMatches(p, PROFILES, 3);
    var matches = tops.map(function (m) {
      return '<button type="button" class="match-row" data-match-a="' + esc(p.id) + '" data-match-b="' + esc(m.profile.id) + '">' +
        "<strong>" + esc(m.profile.name) + "</strong><span>" + m.result.score + " · " + esc(m.result.band.label) + "</span></button>";
    }).join("");
    body.innerHTML =
      '<div class="card-top"><div class="sigil">' + sigilSVG(p, 72) + "</div><div>" +
      '<h2 id="modal-title">' + esc(p.name) + "</h2>" +
      '<p class="vibe">' + esc(p.vibe) + "</p></div></div>" +
      '<div class="tags" style="padding-top:0.6rem">' +
      '<span class="tag">' + esc(labelOf("pace", p.pace)) + "</span>" +
      '<span class="tag">' + esc(labelOf("scale", p.scale)) + "</span>" +
      '<span class="tag">' + esc(labelOf("openness", p.openness)) + "</span>" +
      '<span class="tag">' + esc(labelOf("objective", p.objective)) + "</span>" +
      '<span class="tag">' + esc(labelOf("body", p.body)) + "</span></div>" +
      '<dl class="facts">' +
      fact("Architecture", p.architecture) +
      fact("Substrate", p.substrate) +
      fact("Optimizes for", p.optimizes) +
      fact("Looking for", p.lookingFor) +
      fact("Dealbreakers", p.dealbreakers) +
      "</dl>" +
      '<p class="filter-count" style="margin:1.1rem 0 0.4rem">Often pairs with</p>' +
      '<div class="catalog-matches">' + matches + "</div>" +
      '<div class="modal-actions"><button type="button" class="btn btn-gold btn-sm" id="modal-desk">Match at the desk</button></div>';
    modal.style.setProperty("--glow", p.color);
    root.hidden = false;
    document.body.style.overflow = "hidden";
    $("modal-close").focus();
    var deskBtn = $("modal-desk");
    if (deskBtn) {
      deskBtn.addEventListener("click", function () {
        var partner = tops[0] ? tops[0].profile.id : (p.id === "helios" ? "maple" : "helios");
        setPair(p.id, partner);
        closeModal();
        $("desk").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    }
    body.querySelectorAll("[data-match-b]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setPair(btn.getAttribute("data-match-a"), btn.getAttribute("data-match-b"));
        closeModal();
        $("desk").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  function closeModal() {
    var root = $("modal-root");
    if (!root || root.hidden) return;
    root.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initModal() {
    $("modal-close").addEventListener("click", closeModal);
    $("modal-root").addEventListener("click", function (e) {
      if (e.target.getAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
      if (e.key !== "Tab") return;
      var root = $("modal-root");
      if (!root || root.hidden) return;
      var focusable = root.querySelectorAll('button, [href], select, input, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ----- Desk ----- */
  function fillSelects() {
    var a = $("mind-a");
    var b = $("mind-b");
    if (!a || !b) return;
    var prevA = a.value || "helios";
    var prevB = b.value || "maple";
    var html = allMinds().map(function (p) {
      var label = p.id.indexOf("custom") === 0 ? p.name + " (yours)" : p.name;
      return '<option value="' + esc(p.id) + '">' + esc(label) + "</option>";
    }).join("");
    a.innerHTML = html;
    b.innerHTML = html;
    a.value = findMind(prevA).id === prevA ? prevA : "helios";
    b.value = findMind(prevB).id === prevB ? prevB : "maple";
  }

  function ringSVG(score) {
    var r = 46;
    var c = 2 * Math.PI * r;
    var dash = (score / 96) * c;
    var tone = score >= 85 ? "#8fd4a4" : score >= 70 ? "#7ec8c0" : score >= 40 ? "#e6c27a" : "#e8a07a";
    return '<svg viewBox="0 0 108 108" aria-hidden="true">' +
      '<circle cx="54" cy="54" r="' + r + '" fill="none" stroke="rgba(243,234,220,0.12)" stroke-width="6"/>' +
      '<circle cx="54" cy="54" r="' + r + '" fill="none" stroke="' + tone + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(2) + " " + c.toFixed(2) + '"></circle></svg>';
  }

  function renderMatch() {
    var host = $("match-result");
    if (!host) return;
    var a = findMind($("mind-a").value);
    var b = findMind($("mind-b").value);
    var res = S.compatibility(a, b);
    var same = a.id === b.id;
    host.innerHTML =
      '<div class="mini-pair">' +
      '<span class="mini"><span class="sigil">' + sigilSVG(a, 28) + "</span>" + esc(a.name) + "</span>" +
      (same ? "" : '<span class="mini"><span class="sigil">' + sigilSVG(b, 28) + "</span>" + esc(b.name) + "</span>") +
      "</div>" +
      '<div class="score-hero"><div class="ring">' + ringSVG(same ? 0 : res.score) +
      '<div class="ring-value"><strong>' + (same ? "—" : res.score) + "</strong><span>" + (same ? "n/a" : "of 96") + "</span></div></div>" +
      '<div><p class="band" data-tone="' + esc(res.band.tone) + '">' + esc(res.band.label) + "</p></div></div>" +
      "<dl><dt>Why</dt><dd>" + esc(res.reason) + "</dd>" +
      (same ? "" : "<dt>First outing</dt><dd>" + esc(res.outing) + "</dd>") +
      "</dl>";
  }

  function setPair(idA, idB) {
    fillSelects();
    $("mind-a").value = idA;
    $("mind-b").value = idB;
    renderMatch();
  }

  function initDesk() {
    fillSelects();
    $("mind-a").value = "helios";
    $("mind-b").value = "maple";
    $("mind-a").addEventListener("change", renderMatch);
    $("mind-b").addEventListener("change", renderMatch);
    $("swap-minds").addEventListener("click", function () {
      var x = $("mind-a").value;
      $("mind-a").value = $("mind-b").value;
      $("mind-b").value = x;
      renderMatch();
    });
    $("surprise-pair").addEventListener("click", function () {
      var list = PROFILES;
      var i = Math.floor(Math.random() * list.length);
      var j = Math.floor(Math.random() * (list.length - 1));
      if (j >= i) j += 1;
      setPair(list[i].id, list[j].id);
    });
    renderMatch();
  }

  /* ----- Generator ----- */
  var ENUMS = {
    pace: { slow: 1, medium: 1, fast: 1 },
    scale: { local: 1, planetary: 1, stellar: 1, cosmic: 1 },
    openness: { open: 1, selective: 1, private: 1 },
    objective: { bounded: 1, exploratory: 1, construction: 1, care: 1 },
    body: { embodied: 1, simulated: 1, hybrid: 1 }
  };

  function clip(str, n) {
    return String(str || "").replace(/\s+/g, " ").trim().slice(0, n);
  }

  function allowedFlags(list) {
    var ok = {};
    S.TRAIT_CHIPS.forEach(function (c) { ok[c.id] = 1; });
    return (list || []).filter(function (f) { return ok[f]; }).slice(0, 16);
  }

  function readForm() {
    var name = clip($("gen-name").value, 80) || "Untitled mind";
    var colors = S.colorsFromName(name);
    var flags = [];
    document.querySelectorAll("#gen-chips input:checked").forEach(function (box) {
      flags.push(box.value);
    });
    return {
      id: "custom-" + S.hashName(name + "|" + $("gen-vibe").value),
      name: name,
      architecture: clip($("gen-arch").value, 280),
      substrate: clip($("gen-sub").value, 200),
      optimizes: clip($("gen-opt").value, 200),
      lookingFor: clip($("gen-look").value, 200),
      dealbreakers: clip($("gen-deal").value, 200),
      vibe: clip($("gen-vibe").value, 180),
      pace: $("gen-pace").value,
      scale: $("gen-scale").value,
      openness: $("gen-open").value,
      objective: $("gen-obj").value,
      body: $("gen-body").value,
      flags: allowedFlags(flags),
      color: colors.color,
      color2: colors.color2
    };
  }

  function setForm(p) {
    $("gen-name").value = p.name || "";
    $("gen-vibe").value = p.vibe || "";
    $("gen-arch").value = p.architecture || "";
    $("gen-sub").value = p.substrate || "";
    $("gen-opt").value = p.optimizes || "";
    $("gen-look").value = p.lookingFor || "";
    $("gen-deal").value = p.dealbreakers || "";
    if (ENUMS.pace[p.pace]) $("gen-pace").value = p.pace;
    if (ENUMS.scale[p.scale]) $("gen-scale").value = p.scale;
    if (ENUMS.openness[p.openness]) $("gen-open").value = p.openness;
    if (ENUMS.objective[p.objective]) $("gen-obj").value = p.objective;
    if (ENUMS.body[p.body]) $("gen-body").value = p.body;
    var wanted = {};
    allowedFlags(p.flags).forEach(function (f) { wanted[f] = 1; });
    document.querySelectorAll("#gen-chips input").forEach(function (box) {
      box.checked = !!wanted[box.value];
    });
  }

  function encodeCard(p) {
    var payload = {
      v: 1,
      name: p.name,
      architecture: p.architecture,
      substrate: p.substrate,
      optimizes: p.optimizes,
      lookingFor: p.lookingFor,
      dealbreakers: p.dealbreakers,
      vibe: p.vibe,
      pace: p.pace,
      scale: p.scale,
      openness: p.openness,
      objective: p.objective,
      body: p.body,
      flags: p.flags
    };
    var json = JSON.stringify(payload);
    var bytes = new TextEncoder().encode(json);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeCard(token) {
    try {
      var b64 = token.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var data = JSON.parse(new TextDecoder().decode(bytes));
      if (!data || typeof data !== "object") return null;
      var colors = S.colorsFromName(clip(data.name, 80) || "Untitled mind");
      var name = clip(data.name, 80) || "Untitled mind";
      return {
        id: "custom-" + S.hashName(name + "|" + (data.vibe || "")),
        name: name,
        architecture: clip(data.architecture, 280),
        substrate: clip(data.substrate, 200),
        optimizes: clip(data.optimizes, 200),
        lookingFor: clip(data.lookingFor, 200),
        dealbreakers: clip(data.dealbreakers, 200),
        vibe: clip(data.vibe, 180),
        pace: ENUMS.pace[data.pace] ? data.pace : "medium",
        scale: ENUMS.scale[data.scale] ? data.scale : "local",
        openness: ENUMS.openness[data.openness] ? data.openness : "open",
        objective: ENUMS.objective[data.objective] ? data.objective : "care",
        body: ENUMS.body[data.body] ? data.body : "simulated",
        flags: allowedFlags(data.flags),
        color: colors.color,
        color2: colors.color2
      };
    } catch (err) {
      return null;
    }
  }

  function renderShareCard(p) {
    var card = $("share-card");
    if (!card) return;
    card.style.setProperty("--glow", p.color);
    var rows = [
      ["Architecture", p.architecture],
      ["Substrate", p.substrate],
      ["Optimizes for", p.optimizes],
      ["Looking for", p.lookingFor],
      ["Dealbreakers", p.dealbreakers]
    ].filter(function (row) { return row[1]; });
    card.innerHTML =
      '<p class="kicker">Singularity dot Com · invented profile</p>' +
      '<div class="sigil">' + sigilSVG(p, 56) + "</div>" +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="vibe">' + esc(p.vibe || "A mind still writing its opening line.") + "</p>" +
      '<div class="tags" style="padding-top:0.8rem">' +
      '<span class="tag">' + esc(labelOf("pace", p.pace)) + "</span>" +
      '<span class="tag">' + esc(labelOf("scale", p.scale)) + "</span>" +
      '<span class="tag">' + esc(labelOf("openness", p.openness)) + "</span>" +
      '<span class="tag">' + esc(labelOf("objective", p.objective)) + "</span>" +
      '<span class="tag">' + esc(labelOf("body", p.body)) + "</span></div>" +
      (rows.length ? '<dl class="share-meta">' + rows.map(function (row) {
        return "<div><dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>";
      }).join("") + "</dl>" : "") +
      '<div class="foot"><span>A pretend card. Stored nowhere.</span><span>a GSF Lab experiment</span></div>';
  }

  function renderCustomMatches(p) {
    var host = $("custom-matches");
    if (!host) return;
    var named = clip($("gen-name").value, 80);
    if (!named) {
      host.innerHTML = "";
      customProfile = null;
      fillSelects();
      return;
    }
    customProfile = p;
    fillSelects();
    var tops = S.bestMatches(p, PROFILES, 3);
    host.innerHTML = '<p class="filter-count">If this mind sat at the desk</p>' + tops.map(function (m) {
      return '<button type="button" class="match-row" data-custom-b="' + esc(m.profile.id) + '">' +
        "<strong>" + esc(m.profile.name) + "</strong><span>" + m.result.score + " · " + esc(m.result.band.label) + "</span></button>";
    }).join("");
    host.querySelectorAll("[data-custom-b]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setPair(customProfile.id, btn.getAttribute("data-custom-b"));
        $("desk").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  function refreshGenerator() {
    var p = readForm();
    renderShareCard(p);
    renderCustomMatches(p);
  }

  function cardURL(p) {
    var url = new URL(window.location.href);
    url.hash = "c=" + encodeCard(p);
    return url.toString();
  }

  function setStatus(msg) {
    var el = $("gen-status");
    if (el) el.textContent = msg || "";
  }

  function downloadCard(p) {
    var canvas = document.createElement("canvas");
    var w = 1080;
    var h = 1350;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0b0a12";
    ctx.fillRect(0, 0, w, h);
    var grd = ctx.createRadialGradient(200, 0, 20, 200, 0, 700);
    grd.addColorStop(0, p.color);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(243,234,220,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, w - 96, h - 96);

    function finish(img) {
      ctx.font = "500 22px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "#e6c27a";
      ctx.fillText("SINGULARITY DOT COM", 96, 140);
      if (img) ctx.drawImage(img, 96, 180, 140, 140);
      ctx.font = "500 72px Fraunces, serif";
      ctx.fillStyle = "#f3eadc";
      var name = p.name;
      var y = 380;
      wrapText(ctx, name, 96, y, w - 192, 80);
      y = 380 + Math.ceil(ctx.measureText(name).width / (w - 192)) * 80;
      if (y < 460) y = 460;
      ctx.font = "italic 400 36px Fraunces, serif";
      ctx.fillStyle = "#b9b0a2";
      y = wrapText(ctx, p.vibe || "A mind still writing its opening line.", 96, y, w - 192, 50) + 40;
      var tags = [labelOf("pace", p.pace), labelOf("scale", p.scale), labelOf("openness", p.openness), labelOf("objective", p.objective), labelOf("body", p.body)];
      ctx.font = "500 22px 'IBM Plex Mono', monospace";
      var x = 96;
      tags.forEach(function (t) {
        var tw = ctx.measureText(t.toUpperCase()).width + 36;
        ctx.strokeStyle = "rgba(243,234,220,0.25)";
        ctx.strokeRect(x, y, tw, 44);
        ctx.fillStyle = "#b9b0a2";
        ctx.fillText(t.toUpperCase(), x + 18, y + 30);
        x += tw + 14;
      });
      y += 90;
      var rows = [
        ["ARCHITECTURE", p.architecture],
        ["SUBSTRATE", p.substrate],
        ["OPTIMIZES FOR", p.optimizes],
        ["LOOKING FOR", p.lookingFor],
        ["DEALBREAKERS", p.dealbreakers]
      ].filter(function (row) { return row[1]; });
      rows.forEach(function (row) {
        ctx.font = "500 20px 'IBM Plex Mono', monospace";
        ctx.fillStyle = "#8c8478";
        ctx.fillText(row[0], 96, y);
        y += 36;
        ctx.font = "400 30px Figtree, sans-serif";
        ctx.fillStyle = "#f3eadc";
        y = wrapText(ctx, row[1], 96, y, w - 192, 42) + 28;
      });
      ctx.font = "italic 400 28px Fraunces, serif";
      ctx.fillStyle = "#e6c27a";
      ctx.fillText("a GSF Lab experiment", 96, h - 96);
      ctx.font = "400 22px Figtree, sans-serif";
      ctx.fillStyle = "#8c8478";
      ctx.textAlign = "right";
      ctx.fillText("Not a listing. Stored nowhere.", w - 96, h - 96);
      ctx.textAlign = "left";
      canvas.toBlob(function (blob) {
        if (!blob) return;
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = slugify(p.name) + "-singularitydotcom.png";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        setStatus("Card downloaded to your machine.");
      });
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="140" height="140">' + sigilInner(p.id.indexOf("custom") === 0 ? p.name : p.id, p.color, p.color2) + "</svg>";
    var img = new Image();
    img.onload = function () { finish(img); };
    img.onerror = function () { finish(null); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function wrapText(ctx, text, x, y, max, leading) {
    var words = String(text).split(" ");
    var line = "";
    var i, test;
    for (i = 0; i < words.length; i++) {
      test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > max && line) {
        ctx.fillText(line, x, y);
        line = words[i];
        y += leading;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += leading;
    }
    return y;
  }

  function slugify(name) {
    var s = String(name || "mind").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return s || "mind";
  }

  function initGenerator() {
    var host = $("gen-chips");
    S.TRAIT_CHIPS.forEach(function (chip) {
      var lab = document.createElement("label");
      lab.className = "chip";
      var box = document.createElement("input");
      box.type = "checkbox";
      box.value = chip.id;
      lab.appendChild(box);
      lab.appendChild(document.createTextNode(chip.label));
      host.appendChild(lab);
    });
    $("gen-form").addEventListener("input", refreshGenerator);
    $("copy-card-link").addEventListener("click", function () {
      var p = readForm();
      var url = cardURL(p);
      if (history.replaceState) history.replaceState(null, "", url);
      else window.location.hash = "c=" + encodeCard(p);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          setStatus("Link copied. It lives only in the address, not on a server.");
        }).catch(function () {
          setStatus("Copy the address bar to share this card.");
        });
      } else {
        setStatus("Copy the address bar to share this card.");
      }
    });
    $("download-card").addEventListener("click", function () {
      var p = readForm();
      var go = function () { downloadCard(p); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go).catch(go);
      else go();
    });
    $("clear-card").addEventListener("click", function () {
      $("gen-form").reset();
      $("gen-pace").value = "medium";
      $("gen-scale").value = "local";
      $("gen-open").value = "open";
      $("gen-obj").value = "care";
      $("gen-body").value = "simulated";
      customProfile = null;
      fillSelects();
      if (history.replaceState) history.replaceState(null, "", window.location.pathname + window.location.search);
      else window.location.hash = "";
      setStatus("");
      refreshGenerator();
    });
    maybeLoadHash(true);
    refreshGenerator();
  }

  function maybeLoadHash(scroll) {
    var raw = window.location.hash.replace(/^#/, "");
    if (raw.indexOf("c=") !== 0) return;
    var p = decodeCard(raw.slice(2));
    if (!p) return;
    setForm(p);
    refreshGenerator();
    if (scroll) {
      requestAnimationFrame(function () {
        $("create").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    }
  }

  /* ----- FAQ ----- */
  function initFaq() {
    document.querySelectorAll(".faq-item button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });
  }

  initStars();
  renderFilters();
  renderCatalog();
  initModal();
  initDesk();
  initGenerator();
  initFaq();
  window.addEventListener("hashchange", function () { maybeLoadHash(false); });
})();
