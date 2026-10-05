"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/* ---------------------------------------------------------------------
 * NVIDIA GeForce RTX 5090 Founders Edition — procedural replica
 *
 * Researched against official NVIDIA material and review photography:
 *  - 304 × 137 mm, 2-slot (~48 mm thick) "Double Flow Through" cooler.
 *  - Compact PCB in the middle; fin stacks extend to both ends; BOTH
 *    fans sit on the SAME face (fan side) and pass air completely
 *    through the card — the backplate has matching circular cutouts.
 *  - Two ~110 mm fans, horizontally aligned, 9 curved scimitar blades,
 *    brushed flat hub, no protective grille.
 *  - Steep central X-frame (~±55°) whose arms terminate at the inner
 *    quadrants of the fan rings; the four corners are solid rounded
 *    shroud; raised outer border frame with brass inner hairlines.
 *  - "RTX 5090" printed small in the lower corner region, angled with
 *    the frame; the lit "PC MAX" brand strip sits on the top edge toward
 *    the IO end (system-integrator style); recessed, angled 12V-2x6
 *    (16-pin) connector near top-center; 3× DisplayPort + 1× HDMI on a
 *    nickel IO bracket; gold PCIe edge-connector fingers with keying
 *    notch.
 *
 * World scale: 5.4 units = 304 mm (×0.01776).
 * Local face coords: shroud plate spans local z 0 → 0.1; proud parts
 * extend further. Front face group sits at world z = +0.325, back face
 * group is mirrored (rotation-y = π) at world z = −0.325.
 * ------------------------------------------------------------------- */

const L = 5.4; // length (304 mm)
const H = 2.43; // height  (137 mm)
const D = 0.85; // depth   (~48 mm — 2-slot)

const PLATE_T = 0.1; // shroud face-plate thickness
const FACE_Z = D / 2 - PLATE_T; // 0.325 — face group origin (plate back)

const FAN_X = 1.28; // fan centers (aligned, ±)
const FAN_R = 0.9; // fan cutout radius (~101 mm bore)
const RING_R = 0.92; // bezel ring centerline radius
const BLADES = 9; // verified blade count

const X_ANGLE = (55 * Math.PI) / 180; // steep FE X arms
const X_LEN = 2.14; // full bar length through the center

type Quality = "high" | "medium" | "low";

/* ------------------------------ helpers ------------------------------ */

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -h / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + h - r);
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  s.lineTo(x0 + r, y0 + h);
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/* shroud plate with the two flow-through fan cutouts */
function plateGeometry(): THREE.ExtrudeGeometry {
  const s = roundedRectShape(5.34, 2.26, 0.12);
  for (const x of [FAN_X, -FAN_X]) {
    const hole = new THREE.Path();
    hole.absarc(x, 0, FAN_R, 0, Math.PI * 2, true);
    s.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(s, { depth: PLATE_T, bevelEnabled: false, curveSegments: 48 });
}

/* raised picture-frame border around each face (the FE outer lip) */
function frameGeometry(): THREE.ExtrudeGeometry {
  const s = roundedRectShape(5.3, 2.22, 0.13);
  const hole = new THREE.Path();
  const hw = 4.98 / 2;
  const hh = 1.9 / 2;
  const r = 0.3;
  hole.moveTo(-hw + r, -hh);
  hole.lineTo(hw - r, -hh);
  hole.quadraticCurveTo(hw, -hh, hw, -hh + r);
  hole.lineTo(hw, hh - r);
  hole.quadraticCurveTo(hw, hh, hw - r, hh);
  hole.lineTo(-hw + r, hh);
  hole.quadraticCurveTo(-hw, hh, -hw, hh - r);
  hole.lineTo(-hw, -hh + r);
  hole.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.048,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 24,
  });
}

/* one scimitar fan blade — a twisted, swept, tapered ribbon */
function bladeGeometry(): THREE.BufferGeometry {
  const rows = 16;
  const cols = 5;
  const rRoot = 0.17;
  const rTip = 0.855;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const r = rRoot + (rTip - rRoot) * t;
    // angular width — widest mid-blade, tapered at root and tip
    const w = 0.29 + 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.12));
    // scimitar sweep, increasingly swept toward the tip
    const phi = -0.24 + 0.6 * t * t;
    // pitch twist — shallow at the root, steep at the tip
    const a = 0.34 + 0.5 * t;
    for (let j = 0; j <= cols; j++) {
      const s = j / cols - 0.5;
      const theta = phi + s * w;
      const axial = s * w * r * Math.sin(a) * 0.62;
      positions.push(r * Math.cos(theta), r * Math.sin(theta), axial);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a0 = i * (cols + 1) + j;
      const b0 = a0 + cols + 1;
      indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/* ------------------------- canvas text prints ------------------------ */

const BRAND_FONT = "PcMaxBrand";

/* Load the brand font ONCE per document. Every text texture (and every
 * mount — context-loss recovery, viewport tier flips) previously built its
 * OWN FontFace: each mount re-fetched the same file and stacked duplicate
 * family entries into document.fonts. The settled promise is shared by
 * all textures; a failed load clears the slot so a later mount retries. */
let brandFont: Promise<FontFace | null> | null = null;
function loadBrandFont(): Promise<FontFace | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  if (!brandFont) {
    try {
      brandFont = new FontFace(BRAND_FONT, "url(/fonts/pcmax-sora-800.ttf)")
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
          return loaded;
        })
        .catch(() => {
          brandFont = null; /* let a later mount retry */
          return null;
        });
    } catch {
      /* FontFace constructor unavailable — fallback stays */
      return Promise.resolve(null);
    }
  }
  return brandFont;
}

/* subtle micro-roughness variation — breaks the sterile CGI-smooth look
 * of anodized/die-cast surfaces without any network texture fetch */
function noiseTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 216 + rand() * 40; // ~0.85–1.0 of base roughness
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/* disposed-texture registry — lets a late font-load callback check whether
 * its texture is still alive without touching refs during render (a ref
 * read inside useMemo trips the compiler's refs rule). Weak entries GC
 * with the texture, so nothing accumulates. */
const disposedTextures = new WeakSet<THREE.Texture>();

function useTextTexture(text: string, width: number, height: number, color: string, fontPx: number, spacing: number) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    const family = `'${BRAND_FONT}', 'Arial Black', 'Segoe UI', 'DejaVu Sans', sans-serif`;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `800 ${fontPx}px ${family}`;
      try {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
      } catch {
        /* older canvas — no tracking, still fine */
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(text, width / 2, height / 2 + height * 0.05);
    };

    draw();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    // upgrade to the real Sora ExtraBold once the same-origin font loads
    // (shared singleton — see loadBrandFont; skipped if this texture was
    // already disposed by the time the font settles)
    loadBrandFont().then((loaded) => {
      if (!loaded || disposedTextures.has(tex)) return;
      draw();
      tex.needsUpdate = true;
    });

    return tex;
  }, [text, width, height, color, fontPx, spacing]);

  useEffect(
    () => () => {
      disposedTextures.add(texture);
      texture.dispose();
    },
    [texture]
  );
  return texture;
}

/* --------------------------- fan assembly ---------------------------- */

/* bezel trim shared by both faces — the front fans sit inside these
 * rings; on the back face the same rings trim the open flow-through
 * cutouts (through which the fin stacks are visible) */
function FanTrim({ x, mats }: { x: number; mats: Record<string, THREE.Material> }) {
  return (
    <group>
      {/* bezel ring + brass hairline around the fan bore */}
      <mesh position={[x, 0, 0.105]} material={mats.ring}>
        <torusGeometry args={[RING_R, 0.035, 14, 64]} />
      </mesh>
      <mesh position={[x, 0, 0.124]} material={mats.brass}>
        <torusGeometry args={[0.952, 0.008, 10, 64]} />
      </mesh>
    </group>
  );
}

function Fan({
  x,
  fanRef,
  index,
  bladeGeom,
  mats,
}: {
  x: number;
  fanRef: React.RefObject<[number, number]>;
  index: 0 | 1;
  bladeGeom: THREE.BufferGeometry;
  mats: Record<string, THREE.Material>;
}) {
  const spinner = useRef<THREE.Group>(null);
  const bladeAngles = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < BLADES; i++) arr.push((i / BLADES) * Math.PI * 2);
    return arr;
  }, []);

  useFrame((_, delta) => {
    /* clamp + sign-guard the dt (see gpu-scene Rig): fan speed stays
     * frame-rate independent and can never strobe from a delta spike. */
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (spinner.current) spinner.current.rotation.z -= dt * fanRef.current[index];
  });

  return (
    <group>
      {/* fan duct — recessed cylindrical throat inside the cutout */}
      <mesh rotation-x={Math.PI / 2} position={[x, 0, 0.015]} material={mats.duct}>
        <cylinderGeometry args={[0.895, 0.895, 0.17, 48, 1, true]} />
      </mesh>

      <FanTrim x={x} mats={mats} />

      {/* rotating assembly — 9 twisted scimitar blades + brushed hub */}
      <group ref={spinner} position={[x, 0, -0.025]}>
        {bladeAngles.map((angle, i) => (
          <group key={i} rotation-z={angle}>
            <mesh geometry={bladeGeom} material={mats.blade} />
          </group>
        ))}
        <mesh rotation-x={Math.PI / 2} material={mats.hub}>
          <cylinderGeometry args={[0.185, 0.19, 0.1, 32]} />
        </mesh>
        {/* brushed hub cap */}
        <mesh position={[0, 0, 0.052]} material={mats.hubCap}>
          <circleGeometry args={[0.185, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.054]} material={mats.hubDot}>
          <circleGeometry args={[0.055, 24]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------- one shroud face --------------------------- */

function ShroudFace({
  back = false,
  plateGeom,
  frameGeom,
  bladeGeom,
  mats,
  rtxMat,
  fanRef,
  quality,
}: {
  back?: boolean;
  plateGeom: THREE.ExtrudeGeometry;
  frameGeom: THREE.ExtrudeGeometry;
  bladeGeom: THREE.BufferGeometry;
  mats: Record<string, THREE.Material>;
  rtxMat: THREE.Material;
  fanRef: React.RefObject<[number, number]>;
  quality: Quality;
}) {
  return (
    <group rotation-y={back ? Math.PI : 0} position={[0, 0, back ? -FACE_Z : FACE_Z]}>
      {/* shroud plate with both fan cutouts */}
      <mesh geometry={plateGeom} material={mats.plate} castShadow />

      {/* raised border frame (the proud outer lip) */}
      <mesh geometry={frameGeom} material={mats.frame} position={[0, 0, PLATE_T]} castShadow />

      {/* brass hairlines tracing the inner edge of the border frame */}
      <mesh position={[0, 0.955, PLATE_T + 0.03]} material={mats.brass}>
        <boxGeometry args={[4.96, 0.015, 0.018]} />
      </mesh>
      <mesh position={[0, -0.955, PLATE_T + 0.03]} material={mats.brass}>
        <boxGeometry args={[4.96, 0.015, 0.018]} />
      </mesh>
      <mesh position={[2.47, 0, PLATE_T + 0.03]} material={mats.brass}>
        <boxGeometry args={[0.015, 1.88, 0.018]} />
      </mesh>
      <mesh position={[-2.47, 0, PLATE_T + 0.03]} material={mats.brass}>
        <boxGeometry args={[0.015, 1.88, 0.018]} />
      </mesh>

      {/* the X — steep faceted bars crossing at the center: wide base +
       * narrower proud cap, a stepped profile that catches studio light */}
      {[X_ANGLE, -X_ANGLE].map((rot, i) => (
        <group key={i} rotation-z={rot}>
          <RoundedBox
            args={[X_LEN, 0.26, 0.048]}
            radius={0.02}
            smoothness={quality === "low" ? 1 : 2}
            position={[0, 0, PLATE_T + 0.018]}
            material={mats.xarm}
            castShadow
          />
          <RoundedBox
            args={[X_LEN - 0.14, 0.19, 0.05]}
            radius={0.018}
            smoothness={quality === "low" ? 1 : 2}
            position={[0, 0, PLATE_T + 0.046]}
            material={mats.xarm}
            castShadow
          />
        </group>
      ))}
      {/* center diamond where the bars cross */}
      <mesh position={[0, 0, PLATE_T + 0.034]} rotation-z={Math.PI / 4} material={mats.xarm} castShadow>
        <boxGeometry args={[0.27, 0.27, 0.045]} />
      </mesh>

      {/* "RTX 5090" print in the lower corner region, angled with the frame */}
      <mesh position={[2.2, -0.88, PLATE_T + 0.014]} rotation-z={-0.75} material={rtxMat}>
        <planeGeometry args={[0.6, 0.12]} />
      </mesh>

      {/* front face carries the two real fans; the back face is the
       * flow-through side — open cutouts trimmed with bezel rings,
       * fin stacks visible through them */}
      <FanTrim x={FAN_X} mats={mats} />
      <FanTrim x={-FAN_X} mats={mats} />
      {!back && <Fan x={FAN_X} fanRef={fanRef} index={0} bladeGeom={bladeGeom} mats={mats} />}
      {!back && <Fan x={-FAN_X} fanRef={fanRef} index={1} bladeGeom={bladeGeom} mats={mats} />}
    </group>
  );
}

/* ------------------------------ GPU model ---------------------------- */

/* shared activity clock — fans idle down when nobody is interacting */
let lastInteraction = typeof performance !== "undefined" ? performance.now() : 0;
function markInteraction() {
  lastInteraction = performance.now();
}

export function GpuModel({ quality = "high" }: { quality?: Quality }) {
  /* respect OS reduced-motion — fans park instead of spinning */
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  /* fan speeds with idle ramp-down (front face only — back has no fans) */
  const fanSpeeds = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ["pointermove", "scroll", "keydown", "pointerdown", "touchstart"];
    events.forEach((e) => window.addEventListener(e, markInteraction, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, markInteraction));
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(Math.max(delta, 0), 0.05);
    const idle = performance.now() - lastInteraction > 4500;
    const target: [number, number] = reducedMotion ? [0, 0] : idle ? [1.0, 0.85] : [3.4, 2.9];
    fanSpeeds.current[0] = THREE.MathUtils.damp(fanSpeeds.current[0], target[0], 1.1, dt);
    fanSpeeds.current[1] = THREE.MathUtils.damp(fanSpeeds.current[1], target[1], 1.1, dt);
  });

  const bladeGeom = useMemo(() => bladeGeometry(), []);
  const plateGeom = useMemo(() => plateGeometry(), []);
  const frameGeom = useMemo(() => frameGeometry(), []);

  const rtxTex = useTextTexture("RTX 5090", 512, 96, "#b8bcc2", 64, 6);
  const pcmaxTex = useTextTexture("PC MAX", 1024, 256, "#ffffff", 185, 12);
  const noiseTex = useMemo(() => noiseTexture(), []);

  const mats = useMemo(() => {
    const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
    const phys = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
    return {
      body: phys({ color: "#232529", metalness: 0.85, roughness: 0.36, roughnessMap: noiseTex, envMapIntensity: 1.45, clearcoat: 0.28, clearcoatRoughness: 0.4 }),
      plate: phys({ color: "#17181c", metalness: 0.9, roughness: 0.27, roughnessMap: noiseTex, envMapIntensity: 1.7, clearcoat: 0.5, clearcoatRoughness: 0.28 }),
      frame: phys({ color: "#202127", metalness: 0.88, roughness: 0.28, roughnessMap: noiseTex, envMapIntensity: 1.85, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
      xarm: std({ color: "#1b1c21", metalness: 0.87, roughness: 0.31, emissive: "#ffffff", emissiveIntensity: 0.03, envMapIntensity: 1.3 }),
      duct: std({ color: "#050507", metalness: 0.2, roughness: 0.95, side: THREE.DoubleSide }),
      ring: std({ color: "#191a1f", metalness: 0.85, roughness: 0.32 }),
      blade: std({ color: "#26272c", metalness: 0.68, roughness: 0.42, side: THREE.DoubleSide, envMapIntensity: 0.9 }),
      hub: std({ color: "#3a3d43", metalness: 0.9, roughness: 0.36 }),
      hubCap: std({ color: "#43464d", metalness: 0.92, roughness: 0.3 }),
      hubDot: std({ color: "#141519", metalness: 0.7, roughness: 0.45 }),
      brass: std({ color: "#b98d4f", metalness: 1, roughness: 0.28, envMapIntensity: 1.4 }),
      fin: std({ color: "#1a1c20", metalness: 0.6, roughness: 0.6, envMapIntensity: 0.35 }),
      silver: std({ color: "#b7bcc2", metalness: 0.95, roughness: 0.3 }),
      gold: std({ color: "#c9a227", metalness: 1, roughness: 0.25 }),
      connector: std({ color: "#0c0c0e", metalness: 0.4, roughness: 0.6 }),
      rtx: std({
        map: rtxTex,
        emissiveMap: rtxTex,
        emissive: "#ffffff",
        emissiveIntensity: 0.14,
        transparent: true,
        roughness: 0.6,
        metalness: 0.05,
      }),
      /* PC MAX brand LED — the card's lit top-edge strip (like a system
       * integrator's custom edition): readable at every angle, but a
       * physical part of the hardware, not an overlay. Calibrated premium:
       * bright enough to read instantly, restrained enough to read as
       * etched hardware lighting rather than neon (pairs with the softened
       * Bloom pass in gpu-scene). */
      pcmax: std({
        map: pcmaxTex,
        emissiveMap: pcmaxTex,
        emissive: "#ffffff",
        emissiveIntensity: 1.9,
        transparent: true,
        roughness: 0.5,
        metalness: 0.05,
      }),
    } as Record<string, THREE.MeshStandardMaterial>;
  }, [rtxTex, pcmaxTex]);

  /* fin stack positions — flow-through fins behind the fan zones */
  const finXs = useMemo(() => {
    const arr: number[] = [];
    const step = quality === "low" ? 0.13 : quality === "medium" ? 0.105 : 0.092;
    for (let x = 0.56; x <= 2.26; x += step) {
      arr.push(x, -x);
    }
    return arr;
  }, [quality]);

  /* vent slots along the edges (air outlets) */
  const topVentXs = useMemo(() => {
    const arr: number[] = [];
    for (let x = 1.68; x <= 2.32; x += 0.16) arr.push(x);
    return arr;
  }, []);
  const botVentXs = useMemo(() => {
    const arr: number[] = [];
    for (let x = 0.95; x <= 2.25; x += 0.16) arr.push(x);
    return arr;
  }, []);

  /* dispose procedural resources on unmount / HMR */
  useEffect(
    () => () => {
      bladeGeom.dispose();
      plateGeom.dispose();
      frameGeom.dispose();
      noiseTex.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [bladeGeom, plateGeom, frameGeom, noiseTex, mats]
  );

  return (
    <group>
      {/* chassis — top & bottom edge slabs with real bevels (2-slot) */}
      <RoundedBox args={[5.34, 0.18, D]} radius={0.05} smoothness={2} position={[0, H / 2 - 0.09, 0]} material={mats.body} castShadow receiveShadow />
      <RoundedBox args={[5.34, 0.18, D]} radius={0.05} smoothness={2} position={[0, -(H / 2 - 0.09), 0]} material={mats.body} castShadow receiveShadow />
      {/* tail end cap */}
      <RoundedBox args={[0.22, H, D]} radius={0.06} smoothness={2} position={[L / 2 - 0.09, 0, 0]} material={mats.body} castShadow />
      {/* IO-end wall (bracket mounts just beyond) */}
      <RoundedBox args={[0.18, H, D]} radius={0.05} smoothness={2} position={[-L / 2 + 0.08, 0, 0]} material={mats.body} castShadow />

      {/* flow-through fin stacks — visible through both faces' cutouts */}
      {finXs.map((x, i) => (
        <mesh key={`fin-${i}`} position={[x, 0, -0.11]} material={mats.fin}>
          <boxGeometry args={[0.03, 1.9, 0.44]} />
        </mesh>
      ))}
      {/* dark interior block — the compact mid-card PCB zone */}
      <mesh position={[0, 0, 0]} material={mats.duct}>
        <boxGeometry args={[1.06, 1.98, 0.62]} />
      </mesh>
      {/* light-block interior walls behind the fan planes — keep the
       * flow-through interior deep black instead of glow-through */}
      <mesh position={[1.33, 0, 0.165]} material={mats.duct}>
        <boxGeometry args={[1.86, 1.95, 0.025]} />
      </mesh>
      <mesh position={[-1.33, 0, 0.165]} material={mats.duct}>
        <boxGeometry args={[1.86, 1.95, 0.025]} />
      </mesh>

      {/* front (fan) + back (flow-through) shroud faces */}
      <ShroudFace
        plateGeom={plateGeom}
        frameGeom={frameGeom}
        bladeGeom={bladeGeom}
        mats={mats}
        rtxMat={mats.rtx}
        fanRef={fanSpeeds}
        quality={quality}
      />
      <ShroudFace
        back
        plateGeom={plateGeom}
        frameGeom={frameGeom}
        bladeGeom={bladeGeom}
        mats={mats}
        rtxMat={mats.rtx}
        fanRef={fanSpeeds}
        quality={quality}
      />

      {/* "PC MAX" brand LED — top edge toward the IO end, raked like the
       * real strip. The letters sit in a recessed near-black channel (like
       * an OLED inset on real hardware) so the white text keeps full
       * contrast in both light and dark studios — on the card body,
       * perspective-correct, catching light. */}
      <mesh position={[-1.26, H / 2 + 0.024, 0.124]} rotation-x={-0.99} material={mats.duct}>
        <planeGeometry args={[1.78, 0.27]} />
      </mesh>
      <mesh position={[-1.26, H / 2 + 0.031, 0.131]} rotation-x={-0.99} material={mats.pcmax}>
        <planeGeometry args={[1.64, 0.23]} />
      </mesh>

      {/* recessed, angled 12V-2x6 (16-pin) power connector near top-center */}
      <mesh position={[0.52, H / 2 - 0.045, 0]} material={mats.connector}>
        <boxGeometry args={[0.5, 0.13, 0.4]} />
      </mesh>
      <mesh position={[0.5, H / 2 + 0.015, 0.02]} rotation-z={0.1} material={mats.hub}>
        <boxGeometry args={[0.34, 0.07, 0.24]} />
      </mesh>
      {/* angled cable-guide lip behind the connector */}
      <mesh position={[0.82, H / 2 + 0.03, 0.04]} rotation-z={-0.5} material={mats.body}>
        <boxGeometry args={[0.3, 0.028, 0.42]} />
      </mesh>

      {/* vent slots along the top + bottom edges (air outlets) */}
      {topVentXs.map((x, i) => (
        <mesh key={`vt-${i}`} position={[x, H / 2 + 0.008, 0]} material={mats.duct}>
          <boxGeometry args={[0.09, 0.045, 0.52]} />
        </mesh>
      ))}
      {botVentXs.map((x, i) => (
        <mesh key={`vb-${i}`} position={[x, -H / 2 - 0.008, 0]} material={mats.duct}>
          <boxGeometry args={[0.09, 0.045, 0.52]} />
        </mesh>
      ))}

      {/* PCIe edge connector — gold fingers with the keying notch */}
      <mesh position={[-2.38, -H / 2 - 0.045, -0.08]} material={mats.gold}>
        <boxGeometry args={[0.24, 0.08, 0.06]} />
      </mesh>
      <mesh position={[-1.55, -H / 2 - 0.045, -0.08]} material={mats.gold}>
        <boxGeometry args={[1.34, 0.08, 0.06]} />
      </mesh>

      {/* IO bracket — nickel, 3× DisplayPort + 1× HDMI, vent slats, screws */}
      <mesh position={[-L / 2 - 0.045, 0, 0]} material={mats.silver}>
        <boxGeometry args={[0.06, 2.52, 1.0]} />
      </mesh>
      {[-0.72, -0.26, 0.2, 0.66].map((y, i) => (
        <mesh key={`io-${i}`} position={[-L / 2 - 0.075, y, 0]} material={mats.connector}>
          <boxGeometry args={[0.02, 0.2, 0.46]} />
        </mesh>
      ))}
      {[-0.98, -0.49, 0.03, 0.43, 0.92].map((y, i) => (
        <mesh key={`iov-${i}`} position={[-L / 2 - 0.055, y, 0]} material={mats.duct}>
          <boxGeometry args={[0.03, 0.07, 0.62]} />
        </mesh>
      ))}
      {[-1.13, 1.13].map((y, i) => (
        <mesh key={`sc-${i}`} position={[-L / 2 - 0.07, y, 0]} rotation-z={Math.PI / 2} material={mats.hub}>
          <cylinderGeometry args={[0.038, 0.038, 0.022, 14]} />
        </mesh>
      ))}
    </group>
  );
}
