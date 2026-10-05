"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, advance } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { GpuModel } from "./gpu-model";

/*
 * Hero GPU scene — studio product shot of the PC MAX card.
 *
 * - Transparent canvas (no <color> background): the page background and
 *   the constellation field behind the canvas stay visible; the card
 *   floats above them. Nothing hides the card, and the card hides nothing.
 * - The scene mounts only at ≥640px (hero gate) — tier is tablet/desktop.
 * - Multi-layer physical shadow: a real directional shadow map (key light,
 *   PCF-soft) PLUS a height-driven soft penumbra pair. Every layer
 *   repositions/rescales/fades with the card's live height above the
 *   ground, so the shadow reads as physics, not paint.
 * - Render loop pauses when the hero is offscreen.
 */

type Tier = "tablet" | "desktop";

/* The component only mounts client-side (ssr:false dynamic import), so the
 * initial tier can be read synchronously — no first-frame flip. */
function useTier(): Tier {
  const [tier, setTier] = useState<Tier>(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
      ? "desktop"
      : "tablet"
  );
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const update = () => setTier(desktop.matches ? "desktop" : "tablet");
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);
  return tier;
}

const QUALITY: Record<Tier, "high" | "medium"> = {
  desktop: "high",
  tablet: "medium",
};

/* Per-tier camera rig (single source of truth — consumed by the Canvas's
 * `camera` prop at root creation AND by <TierCamera> for live updates). */
const TIER_CAMERA: Record<Tier, { position: [number, number, number]; fov: number }> = {
  tablet: { position: [0.25, 0.9, 9.2], fov: 42 },
  desktop: { position: [0.25, 1.0, 8.6], fov: 39 },
};

/* Full-page pointer tracking (works with pointer-events: none canvas) */
function usePointerRef() {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return ref;
}

/* Scroll progress through the hero (0 → 1 as the hero scrolls away) */
function useScrollRef() {
  const ref = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      ref.current = THREE.MathUtils.clamp(window.scrollY / window.innerHeight, 0, 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return ref;
}

/* Drag-to-rotate: grab anywhere on the hero (non-interactive targets only)
 * and the GPU spins with you — then springs back home on release. */
function useDragListeners(drag: React.RefObject<{ active: boolean; x: number; y: number; yaw: number; pitch: number }>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const hero = document.getElementById("top");
    if (!hero) return;

    const isInteractive = (t: EventTarget | null) =>
      t instanceof HTMLElement && !!t.closest("button, a, input, [role='button']");

    const down = (e: PointerEvent) => {
      if (isInteractive(e.target)) return;
      drag.current.active = true;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      hero.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (drag.current.active) {
        drag.current.yaw = THREE.MathUtils.clamp(
          drag.current.yaw + (e.clientX - drag.current.x) * 0.006,
          -0.9,
          0.9
        );
        drag.current.pitch = THREE.MathUtils.clamp(
          drag.current.pitch + (e.clientY - drag.current.y) * 0.003,
          -0.28,
          0.34
        );
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
      } else if (e.target === hero || (e.target instanceof Node && hero.contains(e.target))) {
        hero.style.cursor = isInteractive(e.target) ? "" : "grab";
      }
    };
    const up = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      hero.style.cursor = "grab";
    };

    hero.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      hero.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      hero.style.cursor = "";
    };
  }, [drag, enabled]);
}

/* ------------------------------ Rig ----------------------------------- */

const GROUND_Y = -1.85; // virtual floor below the floating card
const REST_HEIGHT = 1.85; // card resting height above the floor

/* Largest step the scene may take in one frame (seconds). rAF starvation
 * (hidden tab, occlusion, long main-thread tasks) must never translate into
 * a multi-second scene jump — spikes are clamped to 20fps-equivalent. */
const MAX_FRAME_STEP = 1 / 20;

function Rig({
  tier,
  flip,
  pointer,
  scroll,
  groupRef,
  children,
}: {
  tier: Tier;
  flip: boolean;
  pointer: React.RefObject<{ x: number; y: number }>;
  scroll: React.RefObject<number>;
  groupRef: React.RefObject<THREE.Group | null>;
  children: React.ReactNode;
}) {
  const drag = useRef({ active: false, x: 0, y: 0, yaw: 0, pitch: 0 });
  useDragListeners(drag, tier === "desktop");
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Layout targets: the card floats toward the text-free side (mirrored in
  // RTL) at both tablet and desktop sizes.
  const targetX = flip ? -2.05 : 2.05;
  const targetY = -0.02;
  const scale = tier === "tablet" ? 0.74 : 0.88;
  const baseYaw = flip ? -0.52 : 0.52;

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    /* Defensive delta hygiene: clamp to (0, MAX_FRAME_STEP]. A negative or
     * spiked dt would push damp() past its target (instability) or snap the
     * pose — this makes the rig frame-rate independent on 60/120/144Hz and
     * immune to renderer hiccups. */
    const dt = Math.min(Math.max(delta, 0), MAX_FRAME_STEP);
    /* Scene time from the virtual seconds clock (see the render loop below)
     * — continuous across pauses, never jumps. */
    const t = state.clock.elapsedTime;

    // released drag offsets spring back home (heavy: slow release, λ<2)
    const d = drag.current;
    if (!d.active) {
      d.yaw = THREE.MathUtils.damp(d.yaw, 0, 1.5, dt);
      d.pitch = THREE.MathUtils.damp(d.pitch, 0, 1.5, dt);
    }

    /* Mass & inertia: the pose TARGETS are computed absolutely (base +
     * input offsets — never accumulated), then approached through slow
     * exponential dampers below. Slower λ = heavier rig: the card visibly
     * lags the cursor, accelerates into a move, and settles with damping
     * instead of snapping — precision-engineering feel, not a game object. */
    // idle sway + cursor parallax + drag + scroll-driven cinematic drift
    const sway = reducedMotion ? 0 : Math.sin(t * 0.22) * 0.04;
    const s = scroll.current;
    const yaw = baseYaw + sway + d.yaw + pointer.current.x * 0.2 + s * 0.24;
    const pitch = -0.05 + d.pitch - pointer.current.y * 0.11 + s * 0.12;

    /* Single transform source: the group's pose is written ONLY here (one
     * useFrame, absolute base+offset targets — never accumulated onto the
     * previous frame's value), so no source can fight another. */
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 2.15, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, pitch, 2.15, dt);
    g.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.01;

    // idle float (slow, heavy drift — period ≈ 10s) + layout placement
    // (sinking slightly as you scroll — which the shadow layers below
    // track live)
    const float = reducedMotion ? 0 : Math.sin(t * 0.62) * 0.055;
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 2.5, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY + float - s * 0.35, 2.5, dt);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, scale, 2.5, dt));
  });

  /* Steady-state initial pose: the mount values equal the first frame's
   * targets (all oscillators start at 0, no input yet) — the card appears
   * exactly at rest where it will stay, so loading can never read as a
   * jump/teleport/reposition. */
  return (
    <group
      ref={groupRef}
      position={[targetX, targetY, 0]}
      rotation={[-0.05, baseYaw, 0]}
      scale={scale}
    >
      {children}
    </group>
  );
}

/* ------------------------- Physics shadow ---------------------------- */

/* Radial soft-blob shaders — alpha fades from center to edge; the
 * smoothstep start controls hardness (0 = very soft, 0.52 = tight). */
const SHADOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SHADOW_CORE_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = 1.0 - smoothstep(0.52, 1.0, d);
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * uOpacity);
  }
`;
const SHADOW_PEN_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = 1.0 - smoothstep(0.0, 1.0, d);
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * uOpacity);
  }
`;
/* stable identities so r3f applies them once at mount */
const CORE_UNIFORMS = { uOpacity: { value: 0.4 } };
const PEN_UNIFORMS = { uOpacity: { value: 0.24 } };

/*
 * Multi-layer, height-aware ground shadow:
 *  1. Real directional shadow map from the key light (PCF-soft) — the
 *     card's true silhouette projected and offset by the light angle.
 *  2. A tight contact core under the card — sharpens, darkens and shrinks
 *     as the card nears the floor.
 *  3. A wide soft penumbra — grows, fades and blurs as the card rises.
 * All three follow the card's live position every frame.
 */
function PhysicsShadow({
  rig,
  light,
}: {
  rig: React.RefObject<THREE.Group | null>;
  light: boolean;
}) {
  const coreMesh = useRef<THREE.Mesh>(null);
  const penMesh = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const penMat = useRef<THREE.ShaderMaterial>(null);
  const groundMat = useRef<THREE.ShadowMaterial>(null);
  const tmp = useRef(new THREE.Vector3());

  useFrame(() => {
    const g = rig.current;
    if (!g) return;
    g.getWorldPosition(tmp.current);

    /* live height of the card above the floor (scroll makes it descend) */
    const rel = THREE.MathUtils.clamp(tmp.current.y - GROUND_Y, 0.2, REST_HEIGHT * 1.6) / REST_HEIGHT;

    /* light-cast drift: the key light sits at +x, so the card's shadow
     * mass displaces toward -x as the card rises, easing back under the
     * card as it descends — the soft layers and the real shadow map stay
     * coherent instead of stacking dead-center. */
    const cast = rel * 0.3;

    /* tight contact core — near floor: smaller, sharper, darker */
    if (coreMesh.current) {
      const cs = 0.8 + 0.42 * rel;
      coreMesh.current.position.set(tmp.current.x - cast * 0.6, GROUND_Y + 0.012, 0);
      coreMesh.current.scale.set(5.3 * cs, 2.7 * cs, 1);
    }
    if (coreMat.current) {
      coreMat.current.uniforms.uOpacity.value = (light ? 0.3 : 0.42) / (0.55 + 0.45 * rel);
    }

    /* wide penumbra — higher: larger, softer, lighter, cast further */
    if (penMesh.current) {
      const ps = 0.88 + 0.6 * rel;
      penMesh.current.position.set(tmp.current.x - cast, GROUND_Y + 0.006, 0);
      penMesh.current.scale.set(8.6 * ps, 4.4 * ps, 1);
    }
    if (penMat.current) {
      penMat.current.uniforms.uOpacity.value = (light ? 0.14 : 0.24) / (0.5 + 0.5 * rel);
    }

    /* the real shadow map stays physically placed by the light; only its
     * density responds to proximity (closer = denser) */
    if (groundMat.current) {
      groundMat.current.opacity = (light ? 0.34 : 0.4) / (0.5 + 0.5 * rel);
    }
  });

  return (
    <group>
      {/* wide soft penumbra */}
      <mesh ref={penMesh} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={penMat}
          transparent
          depthWrite={false}
          uniforms={PEN_UNIFORMS}
          vertexShader={SHADOW_VERT}
          fragmentShader={SHADOW_PEN_FRAG}
        />
      </mesh>
      {/* tight contact core */}
      <mesh ref={coreMesh} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={coreMat}
          transparent
          depthWrite={false}
          uniforms={CORE_UNIFORMS}
          vertexShader={SHADOW_VERT}
          fragmentShader={SHADOW_CORE_FRAG}
        />
      </mesh>
      {/* real shadow-map catcher */}
      <mesh rotation-x={-Math.PI / 2} position={[0, GROUND_Y, 0]} receiveShadow>
        <planeGeometry args={[34, 16]} />
        <shadowMaterial ref={groundMat} transparent opacity={0.3} color="#000000" />
      </mesh>
    </group>
  );
}

/* --------------------------- Live camera ----------------------------- */

/* r3f applies the `camera` prop only when a root is CREATED (verified in
 * @react-three/fiber 9.7's configure(): the re-creation branch requires
 * passing a camera INSTANCE, so plain option objects never re-apply).
 * Crossing the 1024px tier boundary mid-session therefore used to leave
 * whichever tier mounted FIRST in control of fov/position forever. This
 * tiny subscriber pumps the tier's calibrated rig onto the CURRENT camera
 * (state.camera inside useFrame — it also converges onto a brand-new
 * camera after a context-loss remount, because the remount re-initializes
 * `pending`). Idempotent on first mount: exactly the lookAt(0,0,0)
 * framing r3f itself applies at creation. */
function TierCamera({ tier }: { tier: Tier }) {
  const pending = useRef<Tier | null>(tier);
  useEffect(() => {
    pending.current = tier;
  }, [tier]);
  useFrame((state) => {
    const want = pending.current;
    if (want === null) return;
    pending.current = null;
    const cfg = TIER_CAMERA[want];
    const camera = state.camera;
    camera.position.set(...cfg.position);
    camera.lookAt(0, 0, 0);
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== cfg.fov) {
      camera.fov = cfg.fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/* ------------------------------ Scene -------------------------------- */

/* Is the hero (and therefore the scene) inside the viewport? Drives the
 * manual render loop below. */
function useHeroVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return visible;
}

export function GpuScene({ flip = false }: { flip?: boolean }) {
  const tier = useTier();
  const pointer = usePointerRef();
  const scroll = useScrollRef();
  const heroVisible = useHeroVisible();
  /* Self-healing: if the GPU driver kills the WebGL context (memory
   * pressure, driver resets — the classic "3D object vanished" bug),
   * remount the whole scene on a fresh context instead of staying blank
   * forever. */
  const [contextGeneration, setContextGeneration] = useState(0);

  /* The scene's own clock, in SECONDS (see the loop below for why it must
   * not be the raw rAF timestamp). Survives loop restarts, so animation
   * phases continue exactly where they froze while the hero was offscreen. */
  const virtualClock = useRef(0);
  const clockRef = useRef<THREE.Clock | null>(null);

  /* Manual render loop — exactly ONE rAF drives this whole scene (the
   * constellation behind it owns its own separate loop; nothing nests).
   *
   * ROOT-CAUSE NOTE (jitter fix): r3f's frameloop="never" mode derives the
   * useFrame `delta` AND `clock.elapsedTime` from the timestamp handed to
   * advance(). The canonical rAF timestamp is in MILLISECONDS — feeding it
   * raw made every subscriber see delta ≈ 16.7 (1000× the documented
   * seconds), which saturated every damp() to a hard snap (zero input
   * smoothing) and turned the slow sine sway/float into ~41–135 Hz
   * oscillations that alias at display refresh — the visible micro-shake.
   *
   * The fix: drive advance() with our own SECONDS-based virtual clock,
   * advanced by the real frame step clamped to MAX_FRAME_STEP. Delta and
   * elapsedTime then carry their documented units for every subscriber
   * (rig, fans, particles), motion is frame-rate independent (60/120/144Hz
   * behave identically), starvation gaps can't snap the pose, and pauses
   * freeze/resume the clock instead of jumping it. THREE.Clock's internal
   * oldTime is pinned right before each advance so its own getDelta() call
   * contributes ~0 instead of corrupting the branch that computes ours. */
  useEffect(() => {
    if (!heroVisible) return;
    let raf = 0;
    let last = -1; // previous rAF timestamp (ms); -1 = first tick after (re)start
    const tick = (t: number) => {
      const step = last < 0 ? 0 : Math.min((t - last) / 1000, MAX_FRAME_STEP);
      last = t;
      virtualClock.current += step;
      if (clockRef.current) clockRef.current.oldTime = performance.now();
      advance(virtualClock.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heroVisible]);

  const { resolvedTheme } = useTheme();
  const light = resolvedTheme === "light";
  const quality = QUALITY[tier];

  const rig = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.DirectionalLight>(null);

  /* Theme flips swap the key light's shadow-map resolution (2048 light /
   * 1024 dark). three.js allocates a light's shadow render target ONLY
   * while shadow.map === null — mutating mapSize on a live light silently
   * keeps rendering into the OLD target (and retains its GPU memory).
   * Drop the stale target on theme change; the next rendered frame
   * reallocates at the newly applied size. */
  useEffect(() => {
    const l = keyLight.current;
    const stale = l?.shadow.map;
    if (!l || !stale) return;
    l.shadow.map = null;
    if (stale.depthTexture !== null) {
      stale.depthTexture.dispose();
      stale.depthTexture = null;
    }
    stale.dispose();
  }, [light]);

  const dpr: [number, number] = tier === "tablet" ? [1, 1.6] : [1, 2];

  /* Studio lighting — one strong key, a weak fill, controlled ambience.
   * The key light casts the real shadow. */
  const keyIntensity = light ? 2.15 : 1.8;
  const ambientIntensity = light ? 0.3 : 0.2;

  return (
    <Canvas
      key={contextGeneration}
      frameloop="never"
      shadows
      dpr={dpr}
      camera={TIER_CAMERA[tier]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={(state) => {
        const gl = state.gl;
        clockRef.current = state.clock; // for the oldTime pinning above
        /* Context-loss remount continuity: a fresh root starts a fresh
         * THREE.Clock at elapsedTime 0, so the FIRST advance() below would
         * hand every subscriber a delta equal to the ENTIRE virtual elapsed
         * time (one giant frame — Sparkles/composer consume raw delta).
         * Align the new clock with the shared virtual seconds clock so
         * recovery resumes exactly where it froze (delta ≈ 0). */
        state.clock.elapsedTime = virtualClock.current;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        /* transparent clear so the page background + constellation show
         * through around the card */
        gl.setClearAlpha(0);
        /* self-heal on GPU context loss — see contextGeneration above */
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            setContextGeneration((g) => g + 1);
          },
          false
        );
      }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        {/* keep the live camera on the tier's calibrated rig (the `camera`
            prop itself is mount-time only in r3f) */}
        <TierCamera tier={tier} />

        {/* studio lighting — key (shadow-casting), weak fill, crimson kicker */}
        <ambientLight intensity={ambientIntensity} />
        <directionalLight
          ref={keyLight}
          position={[3.5, 8.5, 4.5]}
          intensity={keyIntensity}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={light ? 2048 : 1024}
          shadow-mapSize-height={light ? 2048 : 1024}
          shadow-radius={4}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-camera-near={2}
          shadow-camera-far={22}
          shadow-bias={-0.0003}
          shadow-normalBias={0.02}
        />
        {/* weak fill from the left — keeps shadow side readable, not black */}
        <directionalLight position={[-7, 2.5, 3]} intensity={light ? 0.45 : 0.3} color="#ffffff" />
        {/* controlled crimson kicker — brand rim light, not a glow */}
        <directionalLight position={[-6, 3, 4]} intensity={light ? 0.18 : 0.3} color="#ff4b52" />
        <directionalLight position={[0, 3, -7]} intensity={light ? 0.35 : 0.5} color="#ffffff" />

        {/* procedural environment (no network HDR) */}
        <Environment resolution={tier === "tablet" ? 192 : 256}>
          <color attach="background" args={["#050506"]} />
          <Lightformer form="rect" intensity={6} color="#ffffff" position={[0, 5, -9]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 0.5, 7]} scale={[12, 0.7, 1]} />
          <Lightformer form="rect" intensity={light ? 0.8 : 1.7} color="#e50914" position={[-6, 0, -1]} rotation-y={Math.PI / 2} scale={[7, 2.5, 1]} />
          <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[10, 2, 0]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="circle" intensity={2} color="#ffffff" position={[0, 9, 4]} scale={4} />
          <Lightformer form="rect" intensity={light ? 0.7 : 1.3} color="#c1121f" position={[4, -4, 3]} rotation-x={-Math.PI / 2} scale={[6, 2, 1]} />
        </Environment>

        <Rig tier={tier} flip={flip} pointer={pointer} scroll={scroll} groupRef={rig}>
          <GpuModel quality={quality} />
        </Rig>

        {/* multi-layer, height-aware shadow */}
        <PhysicsShadow rig={rig} light={light} />

        {/* ambient ember particles — desktop only */}
        {tier === "desktop" && (
          <Sparkles count={48} scale={[12, 6, 8]} position={[0, 0.5, -1.5]} size={2.2} speed={0.2} color="#e50914" opacity={light ? 0.3 : 0.45} />
        )}

        {/* bloom on emissive parts — desktop only; restrained radius + gain
         * so the PC MAX strip reads as hardware light, not a neon halo */}
        {tier === "desktop" && (
          <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1} luminanceSmoothing={0.15} radius={0.5} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}

export default GpuScene;
