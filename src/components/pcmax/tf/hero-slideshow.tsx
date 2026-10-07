"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useLanguage } from "@/components/pcmax/language-context";
import { useLatestAppRelease } from "@/hooks/use-app-release";
import { asset } from "@/lib/gh-pages";

/*
 * HeroSlideshow — Task 43-B "Exact Clone"
 *
 * A faithful React port of tweakfa.com's homepage hero carousel (the `hs`
 * deck), PC MAX edition. Structure, class names, ids and the motion engine
 * are byte-faithful to the uploaded mirror
 * (upload/tweakfa-site-extracted/.../tweakfa.com/index.html — the inline
 * script block containing DWELL=7300), with three deliberate PC MAX
 * adaptations (see the worklog for the full fidelity ledger):
 *
 *  - No live-app iframe: the mirror layers a demo iframe over slide 0; PC MAX
 *    ships four static artwork slides (no .hs-ds/.hs-app/.hs-fallback
 *    scaffolding — the plain <img> fills the frame).
 *  - Word reveal rides the site's fx-on gate (globals.css `html.fx-on .wi`,
 *    per-word inline `--wd`) instead of the mirror's imperative
 *    transform-release, so the split works for SSR + no-JS + reduced-motion
 *    with zero CLS. Caption swaps keep the mirror's `.out` → 240ms →
 *    rewrite → `.pre` double-rAF release choreography.
 *  - Content from the dictionary (t.hero.*, t.tw.slides) with the LIVE app
 *    release interpolated into the kicker, exactly like hero.tsx.
 *
 * The engine (one mount effect, all state in closures — nothing here fights
 * React: every class/attribute it mutates is rendered as a CONSTANT in JSX
 * so re-renders never rewrite it):
 *  - auto-rotation: rAF loop, DWELL 7300ms, pill progress --p, gated on
 *    !userDrove && inView(IO 100px) && !hover && !focusIn && !doc.hidden &&
 *    !mobile && !reduced; body carries .hs-auto-off when auto is dead.
 *  - go(i,{user,fromScroll,live}): modulo wrap, deck data-d circular
 *    distances (dOf), wrap-reset flash for sign-flipping slides, pill
 *    measurement (--px/--py/--pw/--ph), accent vars (--acr/--acg/--acb),
 *    caption swap (out → rewrite → pre-release), mobile programmatic
 *    scrollBy with snap suspended for 640ms.
 *  - intro: after 140ms the stage fans out (hs-intro → hs-fan → clean at
 *    2.2s) while nav / caption / deck glow go pre-in → enter.
 *  - mobile (≤899px): the stage is a scroll-snap flex scroller (CSS) — a
 *    rAF-throttled scroll scanner picks the slide nearest to center and a
 *    90ms settle re-animates the caption.
 */

/* ── Static media ── 1306×900 artwork slides (public/tf/…). Alts stay
 * honest: these are illustrative interface previews, not live data. */
const SLIDE_MEDIA = [
  { src: "/tf/slide-app.webp", alt: "PC MAX desktop app dashboard — illustrative interface preview" },
  { src: "/tf/slide-multiframe.webp", alt: "PC MAX frame-generation workflow screen — illustrative interface preview" },
  { src: "/tf/slide-profiles.webp", alt: "PC MAX per-game optimization profiles screen — illustrative interface preview" },
  { src: "/tf/slide-bench.webp", alt: "PC MAX before-and-after benchmark comparison — illustrative chart preview" },
] as const;

/* Per-slide accents (mirror SL[i].ac, remapped to the PC MAX palette):
 * crimson / success / gold / cyan. Written as --acr/--acg/--acb on the
 * stage column — registered @property values, so the .7s transition in
 * tf-home.css cross-fades every accent-driven surface (deck glow, frame
 * ring, pill, caption dot). Slide 0's accent ships as the SSR inline style
 * below so first paint is already crimson (@property initial values are
 * the mirror's violet trio). */
const SLIDE_ACCENT: ReadonlyArray<readonly [number, number, number]> = [
  [229, 9, 20],
  [31, 191, 156],
  [254, 187, 41],
  [111, 208, 255],
];
const INITIAL_ACCENT_STYLE = { "--acr": "229", "--acg": "9", "--acb": "20" } as CSSProperties;

const DWELL = 7300;

/* Ambient layer — the mirror's exact two orbs (sizes/positions inline) and
 * its exact eight rising sparks with their CSS vars. --sc tints ride the
 * tf-home tokens: --gc-violet-rgb is crimson in this port, gold/cyan kept. */
const GLOW_V_STYLE = { width: "340px", height: "340px", top: "18%", insetInlineStart: "30%" } as CSSProperties;
const GLOW_G_STYLE = { width: "260px", height: "260px", bottom: "14%", insetInlineStart: "6%" } as CSSProperties;

const SPARKS = [
  { x: "8%", y: "86%", s: "4px", dx: "26px", dy: "-300px", t: "23.11s", p: "3.13s", d: "-2.1s", sc: "var(--gc-violet-rgb)", so: ".70" },
  { x: "22%", y: "92%", s: "3px", dx: "-34px", dy: "-430px", t: "23.69s", p: "4.27s", d: "-7.4s", sc: "var(--gc-cyan-rgb)", so: ".55" },
  { x: "37%", y: "80%", s: "5px", dx: "18px", dy: "-360px", t: "24.31s", p: "3.71s", d: "-13.9s", sc: "var(--gc-violet-rgb)", so: ".60" },
  { x: "51%", y: "95%", s: "3px", dx: "-22px", dy: "-490px", t: "24.93s", p: "5.09s", d: "-5.2s", sc: "var(--gc-gold-rgb)", so: ".50" },
  { x: "66%", y: "84%", s: "4px", dx: "30px", dy: "-390px", t: "25.57s", p: "4.61s", d: "-18.6s", sc: "var(--gc-violet-rgb)", so: ".65" },
  { x: "78%", y: "90%", s: "3px", dx: "-16px", dy: "-450px", t: "26.23s", p: "3.37s", d: "-9.8s", sc: "var(--gc-cyan-rgb)", so: ".50" },
  { x: "89%", y: "82%", s: "5px", dx: "24px", dy: "-340px", t: "26.91s", p: "5.53s", d: "-3.3s", sc: "var(--gc-gold-rgb)", so: ".45" },
  { x: "60%", y: "76%", s: "3px", dx: "-28px", dy: "-270px", t: "27.63s", p: "4.03s", d: "-15.1s", sc: "var(--gc-violet-rgb)", so: ".60" },
] as const;

const SPARK_STYLES = SPARKS.map((s) =>
  ({
    "--x": s.x,
    "--y": s.y,
    "--s": s.s,
    "--dx": s.dx,
    "--dy": s.dy,
    "--t": s.t,
    "--p": s.p,
    "--d": s.d,
    "--sc": s.sc,
    "--so": s.so,
  }) as CSSProperties
);

/* Screen-reader literals (mirror: "TweakFa products and sections",
 * "Previous/Next slide", "Choose a slide") — per-locale, matching the
 * document language rather than the mirror's EN-only strings. */
const A11Y = {
  en: {
    stage: "PC MAX products and sections",
    prev: "Previous slide",
    next: "Next slide",
    tabs: "Choose a slide",
  },
  fa: {
    stage: "محصولات و بخش‌های PC MAX",
    prev: "اسلاید قبلی",
    next: "اسلاید بعدی",
    tabs: "انتخاب اسلاید",
  },
} as const;

/* ── wordsOf — ported from the mirror's site.js ──
 *
 * Bidi-aware word splitter: Persian (or any RTL) text is split per word,
 * while consecutive latin/digit tokens inside it merge into ONE
 * direction:ltr isolate span (`.wi.ltr`) so phrases like "AI Optical Flow"
 * keep their reading order inside an RTL line. The mirror applies the
 * merge unconditionally, which collapses a pure-English sentence into a
 * single reveal unit; per the Task 43-B contract ("for EN it degrades
 * naturally to per-word spans", 80ms steps) the merge only runs when the
 * string itself is RTL — pure-LTR strings get per-word spans. */
const FA_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const AN_RE = /[A-Za-z0-9]/;
const LAT_RE = /[A-Za-z]/;

type WordPart = { t: string; ltr: boolean; run: boolean };

function wordsOf(str: string): WordPart[] {
  const raw = (str || "").trim().split(/\s+/);
  const out: WordPart[] = [];
  const rtl = FA_RE.test(str || "");
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i];
    if (!t) continue;
    if (!rtl) {
      /* Pure-LTR string: per-word masks, staggered one by one. */
      out.push({ t, ltr: LAT_RE.test(t), run: false });
      continue;
    }
    if (AN_RE.test(t) && !FA_RE.test(t)) {
      const run = out.length ? out[out.length - 1] : null;
      if (run && run.run) {
        run.t += " " + t;
        run.ltr = run.ltr || LAT_RE.test(t);
      } else {
        out.push({ t, ltr: LAT_RE.test(t), run: true });
      }
    } else {
      out.push({ t, ltr: false, run: false });
    }
  }
  return out;
}

/* SSR-safe layout effect (useLayoutEffect warns during the server pass). */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* Caption state: i = slide whose copy is shown, gen = swap generation
 * (bumped on every rewrite so the word masks remount and their reveal
 * animations restart, exactly like the mirror's innerHTML rewrite),
 * animate = whether the rewrite plays the staggered word rise. gen 0 is
 * the server-rendered caption — plain text, like the mirror's static HTML. */
type CapState = { i: number; gen: number; animate: boolean };

export function HeroSlideshow() {
  const { t, locale } = useLanguage();
  const { release } = useLatestAppRelease();
  const slides = t.tw.slides;
  const a11y = A11Y[locale];

  const colRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const pillBarRef = useRef<HTMLElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const [cap, setCap] = useState<CapState>({ i: 0, gen: 0, animate: false });

  /* Headline: title1 + title2 as ONE line, word-reveal per word (80ms
   * steps), 😎💜 appended as a final masked "word" at words*80ms — the
   * mirror's wordIn choreography, riding the fx-on gate. The plain string
   * rides the h1's aria-label; the masks are aria-hidden. */
  const h1Text = `${t.hero.title1} ${t.hero.title2}`.trim();
  const h1Parts = wordsOf(h1Text);
  /* Lead: splitLead semantics — whitespace split, 180 + i*48ms stagger,
   * 👇🏻🔥 as the trailing masked part. */
  const leadWords = t.hero.sub.trim().split(/\s+/).filter(Boolean);

  const activeSlide = slides[cap.i] ?? slides[0];

  /* ── The engine ── one mount effect, mirror-faithful. Every DOM class /
   * attribute / CSS var it owns is rendered as a constant in JSX above, so
   * React re-renders (locale switch, live release, caption state) never
   * clobber the imperative state machine. */
  useEffect(() => {
    const stage = stageRef.current;
    const colEl = colRef.current;
    const navEl = navRef.current;
    const tabsEl = tabsRef.current;
    const pill = pillRef.current;
    const pillBar = pillBarRef.current;
    const capEl = capRef.current;
    const glowEl = glowRef.current;
    const prevBtn = prevRef.current;
    const nextBtn = nextRef.current;
    if (!stage || !colEl || !navEl || !tabsEl || !pill || !pillBar || !capEl || !prevBtn || !nextBtn) return;

    const slideEls = Array.from(stage.querySelectorAll<HTMLElement>(".hs-slide"));
    const tabEls = Array.from(tabsEl.querySelectorAll<HTMLButtonElement>(".hs-tab"));
    const N = slideEls.length;
    if (!N || !tabEls.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mqMobile = window.matchMedia("(max-width: 899px)");

    let active = 0;
    const autoOn = !reduced;
    let userDrove = false;
    let inView = true;
    let hover = false;
    let focusIn = false;
    let dragging = false;
    let capLive = false;
    let prog = false;
    let swiped = false;
    let px0 = 0;
    let autoRaf = 0;
    let autoAcc = 0;
    let autoLast = 0;
    let introT = 0;
    let introBootT = 0;
    let capT = 0;
    let scT = 0;
    let scRaf = 0;
    let progT = 0;
    let resizeT = 0;
    let safetyT = 0;

    const cleanups: Array<() => void> = [];
    const listen = (
      target: EventTarget,
      type: string,
      fn: (e: Event) => void,
      opts?: boolean | AddEventListenerOptions
    ) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };

    const setAccent = (i: number) => {
      const ac = SLIDE_ACCENT[i] ?? SLIDE_ACCENT[0];
      colEl.style.setProperty("--acr", String(ac[0]));
      colEl.style.setProperty("--acg", String(ac[1]));
      colEl.style.setProperty("--acb", String(ac[2]));
    };

    /* The mirror's fit() only wrote the iframe deck scale (--k on .hs-ds —
     * no iframe here) plus --stage-h for the deck glow; keep the trivial
     * part. */
    const fitStageH = () => {
      colEl.style.setProperty("--stage-h", stage.offsetHeight + "px");
    };

    const movePill = () => {
      const tab = tabEls[active];
      if (!tab) return;
      pill.style.setProperty("--px", tab.offsetLeft + "px");
      pill.style.setProperty("--py", tab.offsetTop + "px");
      pill.style.setProperty("--pw", tab.offsetWidth + "px");
      pill.style.setProperty("--ph", tab.offsetHeight + "px");
      pill.classList.add("on");
      if (mqMobile.matches) {
        const tr = tab.getBoundingClientRect();
        const sr = tabsEl.getBoundingClientRect();
        if (tr.left < sr.left || tr.right > sr.right) {
          tabsEl.scrollBy({
            left: (tr.left + tr.right) / 2 - (sr.left + sr.right) / 2,
            behavior: reduced ? "auto" : "smooth",
          });
        }
      }
    };

    const arrange = () => {
      const half = Math.floor(N / 2);
      slideEls.forEach((s, i) => {
        const next = ((i - active + half) % N + N) % N - half;
        const previous = Number(s.getAttribute("data-d"));
        /* Slides whose circular distance flips sign take the long way
         * around — flash them invisible for one frame (hs-wrap-reset,
         * EN-only rule in tf-home.css) instead of flying across the deck. */
        const wraps = N === 4 && !mqMobile.matches && previous * next < 0;
        if (wraps) s.classList.add("hs-wrap-reset");
        s.setAttribute("data-d", String(next));
        if (wraps) {
          void s.offsetWidth;
          requestAnimationFrame(() => s.classList.remove("hs-wrap-reset"));
        }
      });
      tabEls.forEach((tab, i) => tab.setAttribute("aria-selected", i === active ? "true" : "false"));
      movePill();
    };

    /* writeCap — React edition: the caption is state, the content derived
     * from the CURRENT dictionary at render time. Bumping gen remounts the
     * word masks (fresh nodes = fresh reveal animations) and re-runs the
     * .pre release effect below. */
    const writeCap = (i: number, animate: boolean) => {
      setAccent(i);
      setCap((c) => ({ i, gen: c.gen + 1, animate }));
    };

    const swapCap = (i: number, live: boolean) => {
      setAccent(i);
      if (reduced) {
        writeCap(i, false);
        return;
      }
      window.clearTimeout(capT);
      capLive = live;
      if (live) {
        /* Mid-scroll rewrite: instant, no fade, re-animated at settle. */
        writeCap(i, false);
        capEl.classList.remove("out");
        return;
      }
      capEl.classList.add("out");
      capT = window.setTimeout(() => {
        writeCap(i, true);
        capEl.classList.remove("out");
      }, 240);
    };

    const autoAllowed = () =>
      autoOn && !userDrove && inView && !hover && !focusIn && !dragging && !document.hidden && !mqMobile.matches;

    const autoStep = (time: number) => {
      autoRaf = 0;
      if (autoAllowed()) {
        autoAcc += Math.min(time - autoLast, 60);
        const p = Math.min(1, autoAcc / DWELL);
        pillBar.style.setProperty("--p", p.toFixed(4));
        if (p >= 1) {
          autoAcc = 0;
          go(active + 1);
          return;
        }
      }
      autoLast = time;
      autoRaf = requestAnimationFrame(autoStep);
    };

    const go = (rawI: number, opts: { user?: boolean; live?: boolean; fromScroll?: boolean; force?: boolean } = {}) => {
      const i = ((rawI % N) + N) % N;
      if (i === active && !opts.force) return;
      /* A user action during the intro fan takes over immediately. */
      if (stage.classList.contains("hs-fan") || stage.classList.contains("hs-intro")) {
        window.clearTimeout(introT);
        stage.classList.remove("hs-fan", "hs-intro");
      }
      active = i;
      arrange();
      swapCap(i, !!opts.live);
      if (opts.user) userDrove = true;
      if (mqMobile.matches && !opts.fromScroll) {
        /* Programmatic scroll on the mobile scroller: suspend snap, glide
         * the target slide to center, restore snap 640ms later. */
        const sr = stage.getBoundingClientRect();
        const r = slideEls[i].getBoundingClientRect();
        prog = true;
        stage.style.scrollSnapType = "none";
        stage.scrollBy({
          left: (r.left + r.right) / 2 - (sr.left + sr.right) / 2,
          behavior: reduced ? "auto" : "smooth",
        });
        window.clearTimeout(progT);
        progT = window.setTimeout(() => {
          prog = false;
          stage.style.scrollSnapType = "";
        }, 640);
      }
      resetAuto();
    };

    /* autoStep references go (declared below) — safe: it first runs from
     * resetAuto() at boot, after every const in this closure is assigned. */
    const resetAuto = () => {
      autoAcc = 0;
      pillBar.style.setProperty("--p", "0");
      document.body.classList.toggle("hs-auto-off", !(autoOn && !userDrove));
      if (autoRaf) cancelAnimationFrame(autoRaf);
      autoLast = performance.now();
      if (autoOn && !userDrove && !reduced) autoRaf = requestAnimationFrame(autoStep);
    };

    const introCustom = () => {
      window.clearTimeout(introT);
      stage.classList.remove("hs-leave", "hs-fan");
      navEl.classList.remove("hs-leave", "enter");
      capEl.classList.remove("hs-leave", "enter");
      glowEl?.classList.remove("hs-leave", "enter");
      if (reduced || mqMobile.matches) {
        /* Reduced / mobile: strip the pre-paint hiding classes immediately
         * (mobile CSS already neutralizes them; this is the belt). */
        stage.classList.remove("hs-intro");
        navEl.classList.remove("pre-in");
        capEl.classList.remove("pre-in");
        glowEl?.classList.remove("pre-in");
        return;
      }
      stage.classList.add("hs-intro");
      navEl.classList.add("pre-in");
      capEl.classList.add("pre-in");
      glowEl?.classList.add("pre-in");
      slideEls.forEach((sl) => sl.style.setProperty("--ad", String(Math.abs(Number(sl.getAttribute("data-d"))))));
      void stage.offsetWidth;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          stage.classList.remove("hs-intro");
          stage.classList.add("hs-fan");
          navEl.classList.remove("pre-in");
          navEl.classList.add("enter");
          capEl.classList.remove("pre-in");
          capEl.classList.add("enter");
          glowEl?.classList.remove("pre-in");
          glowEl?.classList.add("enter");
          introT = window.setTimeout(() => {
            stage.classList.remove("hs-fan");
            navEl.classList.remove("enter");
            capEl.classList.remove("enter");
            glowEl?.classList.remove("enter");
          }, 2200);
        })
      );
    };

    const scanActive = (live: boolean) => {
      scRaf = 0;
      const sr = stage.getBoundingClientRect();
      const mid = (sr.left + sr.right) / 2;
      let best = 0;
      let bd = Infinity;
      slideEls.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs((r.left + r.right) / 2 - mid);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best !== active) {
        go(best, { fromScroll: true, user: true, live });
        return true;
      }
      return false;
    };

    const scSettle = () => {
      scanActive(false);
      if (capLive && !reduced) {
        capLive = false;
        writeCap(active, true);
      }
    };

    /* ── listeners ── */
    tabEls.forEach((tab, i) => listen(tab, "click", () => go(i, { user: true })));
    listen(prevBtn, "click", () => go(active - 1, { user: true }));
    listen(nextBtn, "click", () => go(active + 1, { user: true }));
    slideEls.forEach((s, i) =>
      listen(s, "click", (e) => {
        if (swiped) {
          e.preventDefault();
          return;
        }
        if (i !== active && !mqMobile.matches) {
          e.preventDefault();
          go(i, { user: true });
        }
      })
    );
    listen(stage, "keydown", (e) => {
      const ev = e as KeyboardEvent;
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        go(active + 1, { user: true });
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        go(active - 1, { user: true });
      }
    });
    listen(stage, "pointerdown", (e) => {
      if (mqMobile.matches) return;
      px0 = (e as PointerEvent).clientX;
      dragging = true;
      swiped = false;
    });
    listen(
      window,
      "pointerup",
      (e) => {
        if (!dragging) return;
        dragging = false;
        const dx = (e as PointerEvent).clientX - px0;
        if (Math.abs(dx) > 40) {
          swiped = true;
          go(active + (dx < 0 ? 1 : -1), { user: true });
          window.setTimeout(() => {
            swiped = false;
          }, 50);
        }
      },
      { passive: true }
    );
    listen(colEl, "pointerenter", () => {
      hover = true;
    });
    listen(colEl, "pointerleave", () => {
      hover = false;
    });
    listen(stage, "focusin", () => {
      focusIn = true;
    });
    listen(stage, "focusout", () => {
      focusIn = false;
    });
    listen(tabsEl, "focusin", () => {
      focusIn = true;
    });
    listen(tabsEl, "focusout", () => {
      focusIn = false;
    });
    listen(
      stage,
      "scroll",
      () => {
        if (!mqMobile.matches || prog) return;
        if (!scRaf) scRaf = requestAnimationFrame(() => scanActive(true));
        window.clearTimeout(scT);
        scT = window.setTimeout(scSettle, 90);
      },
      { passive: true }
    );
    listen(
      window,
      "resize",
      () => {
        window.clearTimeout(resizeT);
        resizeT = window.setTimeout(() => {
          fitStageH();
          movePill();
        }, 120);
      },
      { passive: true }
    );

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            inView = en.isIntersecting;
          });
        },
        { rootMargin: "100px 0px" }
      );
      io.observe(stage);
    }

    let roTabs: ResizeObserver | null = null;
    let roStage: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      roTabs = new ResizeObserver(() => movePill());
      roTabs.observe(tabsEl);
      roStage = new ResizeObserver(() => fitStageH());
      roStage.observe(stage);
    }

    const onMqChange = () => {
      fitStageH();
      movePill();
      resetAuto();
    };
    mqMobile.addEventListener("change", onMqChange);
    cleanups.push(() => mqMobile.removeEventListener("change", onMqChange));

    /* ── boot (mirror: fit(); arrange(); intro at 140ms; fonts → movePill;
     * 600ms movePill safety; resetAuto) ── */
    fitStageH();
    arrange();
    introBootT = window.setTimeout(introCustom, 140);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        movePill();
        fitStageH();
      });
    }
    safetyT = window.setTimeout(movePill, 600);
    resetAuto();

    return () => {
      cleanups.forEach((c) => c());
      window.clearTimeout(introT);
      window.clearTimeout(introBootT);
      window.clearTimeout(capT);
      window.clearTimeout(scT);
      window.clearTimeout(progT);
      window.clearTimeout(resizeT);
      window.clearTimeout(safetyT);
      if (autoRaf) cancelAnimationFrame(autoRaf);
      if (scRaf) cancelAnimationFrame(scRaf);
      io?.disconnect();
      roTabs?.disconnect();
      roStage?.disconnect();
      document.body.classList.remove("hs-auto-off");
    };
  }, []);

  /* Caption release — the mirror writeCap's `.pre` + double-rAF dance:
   * hide line/ctas with no transition, force one reflow, then release the
   * word masks (transform:'' → the .5s tf-home transition) and fade the
   * line/ctas back in. Re-runs on locale switches so freshly mounted masks
   * never sit stuck at translateY(115%). */
  useIsoLayoutEffect(() => {
    if (cap.gen === 0 || !cap.animate) return;
    const capEl = capRef.current;
    if (!capEl) return;
    capEl.classList.add("pre");
    void capEl.offsetHeight;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        capEl.classList.remove("pre");
        capEl.querySelectorAll<HTMLElement>(".hs-name .wi").forEach((w) => {
          w.style.transform = "";
        });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [cap.gen, cap.animate, locale]);

  return (
    <section className="hero hs" id="top">
      {/* ambient — mirror orbs + sparks, crimson-tinted via the tf tokens */}
      <div className="glow v dA" style={GLOW_V_STYLE} aria-hidden="true" />
      <div className="glow g dB" style={GLOW_G_STYLE} aria-hidden="true" />
      <div className="sparks" aria-hidden="true">
        {SPARK_STYLES.map((style, i) => (
          <span key={i} className="spark" style={style}>
            <i />
          </span>
        ))}
      </div>

      <div className="hero-mid">
        <div className="wrap hero-in">
          <div className="hs-text">
            {/* kicker — version injected from the live release store
                (useLatestAppRelease), the same source hero.tsx uses */}
            <span className="kicker">{t.hero.kicker.replace("{version}", release.version)}</span>

            <h1 id="h1" data-words="" aria-label={h1Text}>
              <span aria-hidden="true">
                {h1Parts.map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 && " "}
                    <span className="w">
                      <span className={part.ltr ? "wi ltr" : "wi"} style={{ "--wd": `${i * 80}ms` } as CSSProperties}>
                        {part.t}
                      </span>
                    </span>
                  </Fragment>
                ))}
                {" "}
                <span className="w">
                  <span className="wi emjs" style={{ "--wd": `${h1Parts.length * 80}ms` } as CSSProperties}>
                    <img className="emj" src={asset("/tf/1f60e.webp")} alt="😎" width={64} height={64} />
                    <img className="emj" src={asset("/tf/1f49c.webp")} alt="💜" width={64} height={64} />
                  </span>
                </span>
              </span>
            </h1>

            <p className="lead" id="hlead">
              {leadWords.map((word, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span className="w">
                    <span className="wi" style={{ "--wd": `${180 + i * 48}ms` } as CSSProperties}>
                      {word}
                    </span>
                  </span>
                </Fragment>
              ))}
              {" "}
              <span className="w">
                <span className="wi emjs" style={{ "--wd": `${180 + leadWords.length * 48}ms` } as CSSProperties}>
                  <img className="emj" src={asset("/tf/1f447-1f3fb.webp")} alt="👇🏻" width={64} height={64} />
                  <img className="emj" src={asset("/tf/1f525.webp")} alt="🔥" width={64} height={64} />
                </span>
              </span>
            </p>
          </div>

          <div className="hs-stagecol" id="hsCol" ref={colRef} style={INITIAL_ACCENT_STYLE}>
            {/* the deck — data-d is engine-owned (arrange() rewrites it);
                slide 0 is the LCP candidate: eager + high priority */}
            <div
              className="hs-stage hs-intro"
              id="hsStage"
              tabIndex={0}
              role="region"
              aria-roledescription="carousel"
              aria-label={a11y.stage}
              ref={stageRef}
            >
              {slides.map((slide, i) => (
                <div key={i} className="hs-slide" data-i={i} data-d={i} data-href={slide.ctas[0]?.href}>
                  <div className="hs-float">
                    <div className="hs-frame">
                      <img
                        src={asset(SLIDE_MEDIA[i]?.src ?? SLIDE_MEDIA[0].src)}
                        width={1306}
                        height={900}
                        sizes="(max-width:899px) 86vw, 46vw"
                        alt={SLIDE_MEDIA[i]?.alt ?? SLIDE_MEDIA[0].alt}
                        loading={i === 0 ? "eager" : "lazy"}
                        fetchPriority={i === 0 ? "high" : undefined}
                        decoding="async"
                      />
                      <a className="hs-go" href={slide.ctas[0]?.href ?? "#"} aria-label={slide.name} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hs-deckglow pre-in" aria-hidden="true" ref={glowRef} />

            <div className="hs-nav pre-in" id="hsNav" ref={navRef}>
              <button className="hs-arr" id="hsPrev" type="button" aria-label={a11y.prev} ref={prevRef}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
              <div className="hs-tabs" id="hsTabs" role="tablist" aria-label={a11y.tabs} ref={tabsRef}>
                <span className="hs-pill" id="hsPill" aria-hidden="true" ref={pillRef}>
                  <i ref={pillBarRef} />
                </span>
                {slides.map((slide, i) => (
                  <button
                    key={i}
                    className="hs-tab"
                    role="tab"
                    type="button"
                    data-i={i}
                    aria-selected={i === 0}
                    style={{ "--i": `${i}` } as CSSProperties}
                  >
                    {slide.tab}
                  </button>
                ))}
              </div>
              <button className="hs-arr" id="hsNext" type="button" aria-label={a11y.next} ref={nextRef}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
            </div>

            {/* caption — engine-swapped; gen keys remount the word masks */}
            <div className="hs-box pre-in" id="hsCap" ref={capRef}>
              <div className="hs-box-text hs-fade">
                <h2 className="hs-name" id="hsName">
                  <i aria-hidden="true" />
                  <span className="hs-name-t" key={`${cap.gen}:${locale}`}>
                    {cap.animate ? <CaptionName name={activeSlide.name} /> : activeSlide.name}
                  </span>
                </h2>
                <p className="hs-line" id="hsLine">
                  {activeSlide.line}
                </p>
              </div>
              <div className="hs-ctas hs-fade" id="hsCtas">
                {activeSlide.ctas.map((cta) => (
                  <a key={cta.href + cta.label} className={"btn " + (cta.primary ? "btn-p" : "btn-g")} href={cta.href}>
                    {cta.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Caption name — mirror writeCap's wordsOf split with the 70ms/word
 * stagger. The inline translateY(115%) + transitionDelay keep the mirror's
 * transition-release path alive for non-fx-on visitors, while --wd drives
 * the fx-on wordIn animation (same rise, same stagger) everywhere else;
 * the .pre effect releases the transforms. Non-animated rewrites render
 * plain text (instant, like the mirror's writeCap(i,false) intent). */
function CaptionName({ name }: { name: string }) {
  const parts = wordsOf(name);
  return (
    <>
      {parts.map((part, k) => (
        <Fragment key={k}>
          {k > 0 && " "}
          <span className="w">
            <span
              className={part.ltr ? "wi ltr" : "wi"}
              style={
                {
                  "--wd": `${k * 70}ms`,
                  transitionDelay: `${k * 70}ms`,
                  transform: "translateY(115%)",
                } as CSSProperties
              }
            >
              {part.t}
            </span>
          </span>
        </Fragment>
      ))}
    </>
  );
}
