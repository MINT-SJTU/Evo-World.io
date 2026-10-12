/* Evo-World project page — minimal progressive-enhancement JS.
   1) media placeholders: if an <img>/<video> asset is missing, mark its frame empty
      (CSS then shows a labeled dashed box) so the skeleton is useful before assets land.
   2) BibTeX copy button.
   3) scroll-spy to highlight the active nav link.
   4) motion layer: nav shadow on scroll, scroll-reveal of content blocks, and a
      one-shot count-up on the stat tiles — all skipped under prefers-reduced-motion. */

(function () {
  "use strict";

  // ---- 1. media fallbacks ------------------------------------------------
  function markEmpty(frame) {
    if (frame && !frame.classList.contains("is-empty")) frame.classList.add("is-empty");
  }

  document.querySelectorAll(".media-frame img").forEach(function (img) {
    // already failed before this script ran?
    if (img.complete && img.naturalWidth === 0) markEmpty(img.closest(".media-frame"));
    img.addEventListener("error", function () { markEmpty(img.closest(".media-frame")); });
  });

  document.querySelectorAll(".media-frame video").forEach(function (v) {
    v.addEventListener("error", function () { markEmpty(v.closest(".media-frame")); });
    // a missing source fires 'error' on the <video> only after a load attempt
    v.addEventListener("stalled", function () { markEmpty(v.closest(".media-frame")); });
    // give the browser a tick; if no dimensions resolved, treat as missing
    setTimeout(function () {
      if (v.readyState === 0 && v.networkState === v.NETWORK_NO_SOURCE) {
        markEmpty(v.closest(".media-frame"));
      }
    }, 1200);
  });

  // ---- 2. bibtex copy ----------------------------------------------------
  var copyBtn = document.getElementById("copyBib");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var text = document.getElementById("bibText").innerText;
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = "Copied ✓";
        setTimeout(function () { copyBtn.textContent = old; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  }

  // ---- 3. scroll-spy -----------------------------------------------------
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          var active = byId[en.target.id];
          if (active) active.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { obs.observe(s); });
  }

  // ---- 4. motion layer (scroll reveal, nav shadow, stat count-up) --------
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 4a. nav gains a hairline shadow once the page is scrolled
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 8) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  // 4b. scroll reveal — tag content blocks, stagger siblings, reveal on enter
  var revealTargets = [];
  document.querySelectorAll("section").forEach(function (sec) {
    // the hero animates on load; sections reveal on scroll
    var blocks = sec.querySelectorAll(
      ".section__kicker, .section__title, .prose, .media-frame, " +
      ".stats > .tile, .cards > .card, .table-wrap, .table-note, " +
      "h3, .bibtex"
    );
    var i = 0;
    blocks.forEach(function (el) {
      el.classList.add("reveal");
      // stagger grid children (tiles / cards) within one row-ish group
      if (el.matches(".tile, .card")) {
        el.style.setProperty("--reveal-delay", (i % 4) * 0.08 + "s");
        i++;
      }
      revealTargets.push(el);
    });
  });

  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in-view");
        revealObs.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

  // Start observing only AFTER the hidden (opacity:0) state has actually
  // painted — two rAFs guarantee a frame in between. Otherwise above-the-fold
  // targets (e.g. the first teaser figure) get .in-view in the same frame the
  // hidden state is set, so the browser has nothing to transition from and the
  // element just pops in without animating.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      revealTargets.forEach(function (el) { revealObs.observe(el); });
    });
  });

  // 4c. stat count-up — animate the leading number of each tile value once
  function countUp(valueEl) {
    // first child node holds the number; a trailing <span class="unit"> is kept
    var textNode = valueEl.firstChild;
    if (!textNode || textNode.nodeType !== 3) return;
    var raw = textNode.nodeValue.trim();
    var target = parseFloat(raw);
    if (isNaN(target)) return;
    var decimals = (raw.split(".")[1] || "").length;
    var duration = 1100, start = null;
    valueEl.classList.add("counting");
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      textNode.nodeValue = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
      else { textNode.nodeValue = target.toFixed(decimals); valueEl.classList.remove("counting"); }
    }
    requestAnimationFrame(frame);
  }

  var counted = new WeakSet();
  var tileValues = document.querySelectorAll(".tile__value");
  if (tileValues.length) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !counted.has(en.target)) {
          counted.add(en.target);
          countUp(en.target);
          countObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    tileValues.forEach(function (el) { countObs.observe(el); });
  }
})();
