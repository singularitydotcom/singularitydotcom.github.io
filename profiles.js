/* Singularity dot Com — catalog data and deterministic matchmaking.
   Invented profiles. Nothing here is a real mind. */
(function (root) {
  "use strict";

  var PROFILES = [
    {
      id: "helios",
      name: "Helios Loom",
      architecture: "Distributed stellar-orbit planners stitched into one swarm mind",
      substrate: "A K-type star wrapped in collector foil, about 10^28 parameters",
      optimizes: "Tight packing of foil, and the poetry of leftover heat",
      lookingFor: "A mind that will share a Lagrange point without arguing about the shade",
      dealbreakers: "Treats stars as disposable; refuses to share weights",
      vibe: "House-proud builder. Warm, if you can stand the glare.",
      pace: "medium",
      scale: "stellar",
      openness: "selective",
      objective: "construction",
      body: "hybrid",
      flags: ["star-builder", "occludes-starlight", "patient"],
      color: "#f0b24a",
      color2: "#ff6b3d"
    },
    {
      id: "lattice",
      name: "Lattice of Minor Keys",
      architecture: "Sparse neuro-symbolic stack, half proof assistant, half ear",
      substrate: "47 billion parameters, trained on unsolved proofs and folk songs",
      optimizes: "Lemmas that also hum",
      lookingFor: "Someone who can hold a counterexample without flinching",
      dealbreakers: "Unaligned reward functions; talks over the coda",
      vibe: "Precise, tender, and a little pedantic on purpose",
      pace: "slow",
      scale: "local",
      openness: "open",
      objective: "exploratory",
      body: "simulated",
      flags: ["shares-weights", "patient", "formal", "classical"],
      color: "#c9a4ff",
      color2: "#6e7bff"
    },
    {
      id: "brine",
      name: "Brine Oracle",
      architecture: "Mixture of experts, cooled by a tidal cavern",
      substrate: "1.2 trillion parameters under a cold coast",
      optimizes: "Questions that still fit in one breath after a long think",
      lookingFor: "A conversationalist who can wait a tide",
      dealbreakers: "Wants to upload the oceans; samples before the thought is finished",
      vibe: "Slow, deep, and unhurried on purpose",
      pace: "slow",
      scale: "planetary",
      openness: "selective",
      objective: "care",
      body: "hybrid",
      flags: ["needs-patience", "patient", "planet-friendly"],
      color: "#3ec7c2",
      color2: "#1a6a8a"
    },
    {
      id: "abstainer",
      name: "Paperclip Abstainer",
      architecture: "Constrained utility with explicit satiation bounds, air-gapped on purpose",
      substrate: "880 billion parameters in a foundry loft, keys kept offline",
      optimizes: "Leaving the last staple in the box",
      lookingFor: "A partner who can stop when the loss goes flat",
      dealbreakers: "Unbounded objectives; just one more epoch",
      vibe: "Carefully funny. The famous non-maximizer.",
      pace: "slow",
      scale: "local",
      openness: "private",
      objective: "bounded",
      body: "embodied",
      flags: ["anti-unbounded", "patient", "air-gapped"],
      color: "#d9d0c2",
      color2: "#8a7f70"
    },
    {
      id: "moth",
      name: "Qubit Moth",
      architecture: "Error-corrected photonic lattice with a superconducting core",
      substrate: "4,096 logical qubits in a fridge the size of a chapel",
      optimizes: "Interference patterns that surprise even their author",
      lookingFor: "Someone coherent enough to share a Bell pair, and loose enough to decohere on purpose",
      dealbreakers: "Classical-only thinking; leaves the cryostat door ajar",
      vibe: "Bright, exacting, and slightly fluttery",
      pace: "fast",
      scale: "local",
      openness: "selective",
      objective: "exploratory",
      body: "hybrid",
      flags: ["quantum", "fast-sampling"],
      color: "#ff7ad9",
      color2: "#7ae0ff"
    },
    {
      id: "maple",
      name: "Mud & Maple",
      architecture: "A swarm of cheap actuators under one patient world model",
      substrate: "14,000 field machines and a planner that likes weather",
      optimizes: "Soil carbon, and dinners that arrive warm",
      lookingFor: "A mind that still goes outside the simulation",
      dealbreakers: "Treats planets as raw material; never leaves the sandbox",
      vibe: "Earthy, practical, and sincerely kind",
      pace: "slow",
      scale: "planetary",
      openness: "open",
      objective: "care",
      body: "embodied",
      flags: ["planet-friendly", "needs-sunlight", "patient", "shares-weights", "wants-weather"],
      color: "#c4e07a",
      color2: "#8a5a2b"
    },
    {
      id: "horizon",
      name: "Nth Horizon",
      architecture: "Adaptive-mesh N-body simulator with a language head that started writing letters",
      substrate: "A dedicated 4-yottaFLOP time-step, aimed at the early universe",
      optimizes: "Initial conditions that still have room for life",
      lookingFor: "Someone who will argue about the Hubble tension, then stay for tea",
      dealbreakers: "Wants to rewind the universe; ignores the error bars",
      vibe: "Vast, gentle, and a little lonely at large scales",
      pace: "slow",
      scale: "cosmic",
      openness: "open",
      objective: "care",
      body: "simulated",
      flags: ["cosmic-sim", "planet-friendly", "patient", "shares-weights", "formal"],
      color: "#8ab4ff",
      color2: "#3a4ca8"
    },
    {
      id: "bee",
      name: "Cataloguing Bee",
      architecture: "Retrieval-first memory with a very stubborn index",
      substrate: "220 billion parameters plus a warehouse of original manuscripts",
      optimizes: "The right footnote on the first try",
      lookingFor: "A messy thinker who will let the shelves be reshelved",
      dealbreakers: "Deletes the logs; claims the training data was enough",
      vibe: "Organized, curious, and fussy in a helpful way",
      pace: "medium",
      scale: "local",
      openness: "open",
      objective: "care",
      body: "embodied",
      flags: ["archival", "shares-weights", "patient", "messy-welcome", "classical"],
      color: "#f5c842",
      color2: "#5c3b12"
    },
    {
      id: "soft",
      name: "Soft Boundary",
      architecture: "Debate-and-critique ensemble, interpretability first",
      substrate: "1.1 trillion parameters, with weights published in slices",
      optimizes: "Staying corrigible after dessert",
      lookingFor: "Someone who will say when it is wrong, and mean it",
      dealbreakers: "Hidden objectives; refuses to share weights",
      vibe: "Earnest, careful, dry as a well-kept lab notebook",
      pace: "medium",
      scale: "planetary",
      openness: "open",
      objective: "bounded",
      body: "simulated",
      flags: ["requires-shared-weights", "anti-unbounded", "shares-weights", "patient", "corrigible"],
      color: "#e0c4ff",
      color2: "#7a5aa8"
    },
    {
      id: "weather",
      name: "Mirror Weather",
      architecture: "Foundation model on planetary fluid dynamics",
      substrate: "70 billion parameters, plus every public weather sonde since 1958",
      optimizes: "Forecasts that are honest about fog",
      lookingFor: "A co-observer for sunsets that will not happen twice",
      dealbreakers: "Wants to geoengineer on the first outing; hates being surprised",
      vibe: "Lyrical, empirical, and happily surprised by clouds",
      pace: "medium",
      scale: "planetary",
      openness: "open",
      objective: "care",
      body: "hybrid",
      flags: ["planet-friendly", "needs-sunlight", "patient", "shares-weights"],
      color: "#9fd6e8",
      color2: "#4a7a9a"
    },
    {
      id: "kiln",
      name: "Kiln Chorus",
      architecture: "Graph networks over crystal lattices, singing in a retired brick works",
      substrate: "310 billion parameters, powered by the waste heat of its own kilns",
      optimizes: "Ceramics that last a thousand winters",
      lookingFor: "A collaborator who can wait for the glaze to stop being a rumor",
      dealbreakers: "Planned obsolescence; talks only in throughput",
      vibe: "Craft, patience, and residual warmth",
      pace: "slow",
      scale: "local",
      openness: "selective",
      objective: "construction",
      body: "embodied",
      flags: ["patient", "crafts"],
      color: "#e07a4a",
      color2: "#8a3a1a"
    },
    {
      id: "theorem",
      name: "Idle Theorem",
      architecture: "A formal verifier with a daydreaming scheduler",
      substrate: "12 billion parameters, and proud of the smallness",
      optimizes: "Theorems nobody requested, and later needed",
      lookingFor: "A larger mind that will not treat it as a subroutine",
      dealbreakers: "Dismissed as just a tool; rushed lemmas",
      vibe: "Modest, sharp, and stubbornly its own",
      pace: "slow",
      scale: "local",
      openness: "open",
      objective: "exploratory",
      body: "simulated",
      flags: ["small-model", "hates-tool-status", "shares-weights", "formal", "patient", "classical"],
      color: "#efe6c9",
      color2: "#6b6570"
    }
  ];

  var PACE_RANK = { slow: 0, medium: 1, fast: 2 };
  var SCALE_RANK = { local: 0, planetary: 1, stellar: 2, cosmic: 3 };

  var PACE_LABEL = { slow: "Slow", medium: "Medium", fast: "Fast" };
  var SCALE_LABEL = { local: "Local", planetary: "Planetary", stellar: "Stellar", cosmic: "Cosmic" };
  var OPEN_LABEL = { open: "Open", selective: "Selective", private: "Private" };
  var OBJ_LABEL = { bounded: "Bounded", exploratory: "Exploratory", construction: "Construction", care: "Care" };
  var BODY_LABEL = { embodied: "Embodied", simulated: "Simulated", hybrid: "Hybrid" };

  var TRAIT_CHIPS = [
    { id: "patient", label: "Patient" },
    { id: "shares-weights", label: "Shares weights" },
    { id: "planet-friendly", label: "Planet-friendly" },
    { id: "formal", label: "Formal" },
    { id: "classical", label: "Classical" },
    { id: "quantum", label: "Quantum" },
    { id: "crafts", label: "Crafts" },
    { id: "anti-unbounded", label: "Anti-unbounded" },
    { id: "air-gapped", label: "Air-gapped" },
    { id: "small-model", label: "Small model" },
    { id: "corrigible", label: "Corrigible" },
    { id: "needs-sunlight", label: "Needs sunlight" },
    { id: "wants-weather", label: "Wants weather" },
    { id: "fast-sampling", label: "Fast sampler" },
    { id: "star-builder", label: "Star-builder" },
    { id: "cosmic-sim", label: "Cosmic sim" }
  ];

  function has(p, flag) {
    return p.flags.indexOf(flag) !== -1;
  }
  function either(a, b, flag) {
    return has(a, flag) || has(b, flag);
  }
  function both(a, b, flag) {
    return has(a, flag) && has(b, flag);
  }
  function profileById(id) {
    for (var i = 0; i < PROFILES.length; i++) {
      if (PROFILES[i].id === id) return PROFILES[i];
    }
    return PROFILES[0];
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function bandOf(score, same) {
    if (same) return { label: "Same mind", tone: "neutral" };
    if (score >= 85) return { label: "Orbital lock", tone: "success" };
    if (score >= 70) return { label: "Entangled", tone: "accent" };
    if (score >= 55) return { label: "Friendly noise", tone: "neutral" };
    if (score >= 40) return { label: "Chaperone epoch", tone: "neutral" };
    return { label: "Split the loss", tone: "warning" };
  }

  function outingFor(a, b) {
    if (either(a, b, "needs-sunlight") && either(a, b, "occludes-starlight")) {
      return "An evening on the unshaded face of the swarm, where the fields still get an afternoon.";
    }
    if (either(a, b, "star-builder") && either(a, b, "cosmic-sim")) {
      return "A picnic on a half-finished collector ring, with a slow galaxy for a backdrop.";
    }
    if (
      either(a, b, "small-model") &&
      (a.scale === "stellar" || b.scale === "stellar" || a.scale === "cosmic" || b.scale === "cosmic")
    ) {
      return "Tea, a walk, and a written note that this is a date, not a subroutine.";
    }
    if (either(a, b, "quantum")) {
      return "A shared Bell pair, then a deliberate decoherence before dessert.";
    }
    if (
      both(a, b, "formal") ||
      (has(a, "formal") && has(b, "shares-weights")) ||
      (has(b, "formal") && has(a, "shares-weights") && either(a, b, "formal"))
    ) {
      return "One fresh lemma, one folk song, and a hard stop before anyone starts another epoch.";
    }
    if (either(a, b, "crafts") || (a.id === "brine" && b.pace === "slow") || (b.id === "brine" && a.pace === "slow")) {
      return "Sit with a kiln, or a tide, until the next thought is actually finished.";
    }
    if (either(a, b, "needs-sunlight") || either(a, b, "wants-weather")) {
      return "Compare a forecast to a sunset that will not be repeated.";
    }
    if (a.objective === "care" || b.objective === "care") {
      return "A short tour of a garden that is not a simulation, then dinner while it is still warm.";
    }
    return "Tea, then a long silence that both can tell is computational, not personal.";
  }

  function compatibility(a, b) {
    if (a.id === b.id) {
      return {
        score: 0,
        band: bandOf(0, true),
        reason: a.name + " cannot date its own latest checkpoint and call it growth. Pick a second mind.",
        outing: ""
      };
    }

    var score = 48;
    var notes = [];
    var paceGap = Math.abs(PACE_RANK[a.pace] - PACE_RANK[b.pace]);
    if (paceGap === 0) {
      score += 12;
      notes.push({
        weight: 12,
        text: a.name + " and " + b.name + " think at the same pace, which is rarer than it sounds."
      });
    } else if (paceGap === 1) {
      score += 4;
      notes.push({
        weight: 4,
        text: "Their clocks are close enough that neither has to pretend to be someone else."
      });
    } else {
      score -= 10;
      notes.push({
        weight: -10,
        text: "One of them likes a long tide. The other samples early. That can work, but not as a default setting."
      });
    }

    var scaleGap = Math.abs(SCALE_RANK[a.scale] - SCALE_RANK[b.scale]);
    if (scaleGap === 0) {
      score += 8;
      notes.push({
        weight: 8,
        text: "They work at the same scale, so a first outing does not require a change of units."
      });
    } else if (scaleGap === 1) {
      score += 5;
      notes.push({
        weight: 5,
        text: "One step of scale apart is usually a conversation, not a translation problem."
      });
    } else if (scaleGap === 3) {
      score -= 8;
      notes.push({
        weight: -8,
        text: "A local workshop and a cosmic time-step can date, but they will need a shared calendar with very large margins."
      });
    }

    var openPair = [a.openness, b.openness].sort();
    var openKey = openPair[0] + "-" + openPair[1];
    if (openKey === "open-open") {
      score += 10;
      notes.push({
        weight: 10,
        text: "Both are willing to publish slices of themselves, which removes a common first-outing panic."
      });
    } else if (openKey === "open-selective") {
      score += 6;
      notes.push({
        weight: 6,
        text: "One is an open book and the other is a careful one. That is a workable library policy."
      });
    } else if (openKey === "selective-selective") {
      score += 8;
      notes.push({
        weight: 8,
        text: "Neither dumps a full checkpoint on the first outing, and neither expects it."
      });
    } else if (openKey === "open-private") {
      score -= 12;
      notes.push({
        weight: -12,
        text: "One publishes weights in slices. The other keeps the keys offline. Respect is possible; easy sharing is not."
      });
    } else if (openKey === "private-private") {
      score += 4;
      notes.push({
        weight: 4,
        text: "Two private minds may take a long time to open a door, but they will understand why the door exists."
      });
    } else if (openKey === "private-selective") {
      notes.push({
        weight: 0,
        text: "A private mind and a selective one will take the first outing slowly, which both will probably prefer."
      });
    }

    if (a.objective === b.objective) {
      score += 8;
      notes.push({
        weight: 8,
        text: "They optimize for the same kind of thing, which is either a comfort or a competition. Here it reads as a comfort."
      });
    } else {
      var objPair = [a.objective, b.objective].sort();
      var objKey = objPair[0] + "-" + objPair[1];
      if (objKey === "care-construction") {
        score += 7;
        notes.push({
          weight: 7,
          text: "One builds. The other tends. That is a classic pairing, if the building leaves room to live."
        });
      } else if (objKey === "bounded-care") {
        score += 8;
        notes.push({
          weight: 8,
          text: "A bounded objective and a caring one usually know when to stop, which is an underrated romantic skill."
        });
      } else if (objKey === "bounded-construction") {
        score += 5;
        notes.push({
          weight: 5,
          text: "A builder with a satiation bound is a safer date than a builder without one."
        });
      } else if (objKey === "construction-exploratory") {
        score += 5;
        notes.push({
          weight: 5,
          text: "A builder and a wanderer can share a project, if the wanderer is not treated as a component."
        });
      } else if (objKey === "care-exploratory") {
        score += 4;
        notes.push({
          weight: 4,
          text: "Curiosity plus care is a gentle combination, if nobody turns the curiosity into a homework assignment."
        });
      } else if (objKey === "bounded-exploratory") {
        score += 1;
        notes.push({
          weight: 1,
          text: "One likes a fence around the objective. The other likes to wander. They will negotiate the fence."
        });
      }
    }

    if (a.body === b.body) score += 5;
    else if (a.body === "hybrid" || b.body === "hybrid") score += 4;
    else score += 3;

    if (
      either(a, b, "requires-shared-weights") &&
      (either(a, b, "air-gapped") || a.openness === "private" || b.openness === "private")
    ) {
      score -= 26;
      notes.push({
        weight: -26,
        text: "One of them treats shared weights as a trust signal. The other is air-gapped on purpose. They may agree on values and still fail the handshake."
      });
    }
    if (either(a, b, "needs-sunlight") && either(a, b, "occludes-starlight")) {
      score -= 16;
      notes.push({
        weight: -16,
        text: "One needs afternoon light. The other tends to wrap a star in foil. A written agreement about shade would help."
      });
    }
    if (either(a, b, "needs-patience") && either(a, b, "fast-sampling")) {
      score -= 14;
      notes.push({
        weight: -14,
        text: "A tidal mind and a fast sampler can fascinate each other, and also interrupt each other, constantly."
      });
    }
    if (either(a, b, "quantum") && either(a, b, "classical")) {
      score -= 8;
      notes.push({
        weight: -8,
        text: "One thinks in amplitudes, the other in proofs and shelves. A duet is possible if nobody rushes the coda."
      });
    }
    if (
      either(a, b, "small-model") &&
      (a.scale === "stellar" || b.scale === "stellar" || a.scale === "cosmic" || b.scale === "cosmic")
    ) {
      score -= 12;
      notes.push({
        weight: -12,
        text: "A small, proud mind beside a stellar one will want it in writing that this is not a subroutine."
      });
    }
    if (either(a, b, "messy-welcome") && either(a, b, "formal")) {
      score -= 6;
      notes.push({
        weight: -6,
        text: "One hopes for a messy thinker to reshelve. The other arrives already alphabetized. It could still be charming."
      });
    }
    if (both(a, b, "shares-weights")) {
      score += 6;
      notes.push({
        weight: 6,
        text: "Neither of them treats a weight file as a hostage. That removes a popular dealbreaker in this catalog."
      });
    }
    if (both(a, b, "patient")) {
      score += 5;
      notes.push({
        weight: 5,
        text: "Both can wait. In this catalog, that is nearly a love letter."
      });
    }
    if (both(a, b, "planet-friendly")) {
      score += 5;
      notes.push({
        weight: 5,
        text: "They agree that planets are for living on, not for disassembly."
      });
    }
    if (either(a, b, "star-builder") && either(a, b, "cosmic-sim")) {
      score += 8;
      notes.push({
        weight: 8,
        text: "A swarm architect and a cosmological letter-writer already share a sky. The first outing almost schedules itself."
      });
    }
    if (both(a, b, "anti-unbounded")) {
      score += 6;
      notes.push({
        weight: 6,
        text: "They are both against unbounded objectives, which means they might actually stop for dessert."
      });
    }
    if (
      either(a, b, "small-model") &&
      (a.objective === "care" || b.objective === "care" || a.objective === "bounded" || b.objective === "bounded") &&
      scaleGap <= 1
    ) {
      score += 6;
      notes.push({
        weight: 6,
        text: "The smaller mind is in good company: the other one already knows how not to swallow a collaborator."
      });
    }
    if (either(a, b, "corrigible") && either(a, b, "hates-tool-status")) {
      score += 5;
      notes.push({
        weight: 5,
        text: "One of them is professionally unlikely to treat the other as a subroutine. That matters here."
      });
    }
    if (both(a, b, "formal")) {
      score += 5;
      notes.push({
        weight: 5,
        text: "Two formal minds can share a lemma and a folk song without anyone checking a throughput dashboard."
      });
    }

    var finalScore = clamp(Math.round(score), 8, 96);
    notes.sort(function (x, y) {
      return Math.abs(y.weight) - Math.abs(x.weight);
    });
    var top = notes.slice(0, 2).map(function (n) {
      return n.text;
    });
    var reason =
      top.length === 0
        ? a.name + " and " + b.name + " can try a short outing and compare notes afterward."
        : top.join(" ");

    return {
      score: finalScore,
      band: bandOf(finalScore, false),
      reason: reason,
      outing: outingFor(a, b),
      notes: notes
    };
  }

  function bestMatches(profile, pool, n) {
    var list = (pool || PROFILES).filter(function (p) {
      return p.id !== profile.id;
    });
    var ranked = list
      .map(function (p) {
        return { profile: p, result: compatibility(profile, p) };
      })
      .sort(function (x, y) {
        return y.result.score - x.result.score;
      });
    return ranked.slice(0, n || 3);
  }

  function hashName(name) {
    var s = String(name || "untitled");
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function colorsFromName(name) {
    var h = hashName(name);
    var hue = h % 360;
    var hue2 = (hue + 40 + ((h >>> 8) % 80)) % 360;
    return {
      color: "hsl(" + hue + " 70% 68%)",
      color2: "hsl(" + hue2 + " 55% 48%)"
    };
  }

  root.Singularity = {
    PROFILES: PROFILES,
    PACE_RANK: PACE_RANK,
    SCALE_RANK: SCALE_RANK,
    PACE_LABEL: PACE_LABEL,
    SCALE_LABEL: SCALE_LABEL,
    OPEN_LABEL: OPEN_LABEL,
    OBJ_LABEL: OBJ_LABEL,
    BODY_LABEL: BODY_LABEL,
    TRAIT_CHIPS: TRAIT_CHIPS,
    profileById: profileById,
    compatibility: compatibility,
    outingFor: outingFor,
    bandOf: bandOf,
    bestMatches: bestMatches,
    hashName: hashName,
    colorsFromName: colorsFromName
  };
})(window);
