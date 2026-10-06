/**
 * PC MAX Web — one-shot image diet (Task 23, Lighthouse "Improve image
 * delivery": ~314 KB est. savings).
 *
 * Converts the page-load images to WebP (the LCP emblem + navbar/footer
 * logos + the six game key-arts) and recompresses the app-convention icons
 * in place. PNG originals for the *manifest* icons stay untouched — the PWA
 * spec-safe format — only <Image> references move to .webp.
 *
 * Run: `bun scripts/optimize-images.ts` (idempotent; sources are re-read
 * from git-tracked originals, so re-running never degrades quality).
 */
import sharp from "sharp";
import { readdir, stat, mkdir, rm, rename } from "node:fs/promises";
import path from "node:path";

/* Run from the repo root: `bun scripts/optimize-images.ts`. */
const ROOT = process.cwd();
const TMP = path.join(ROOT, ".image-opt-tmp");

const KB = (n: number) => `${(n / 1024).toFixed(1)} KB`;

async function sizeOf(file: string) {
  return (await stat(file)).size;
}

/** Convert → WebP next to the source (single encode — the tmp file is
 *  atomically moved into place, never re-encoded). Returns [src, out, outSize]. */
async function toWebp(rel: string, quality: number, maxSize?: number) {
  const src = path.join(ROOT, rel);
  const out = src.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  let pipe = sharp(src);
  if (maxSize) {
    const meta = await sharp(src).metadata();
    const scale = Math.min(1, maxSize / Math.max(meta.width ?? maxSize, meta.height ?? maxSize));
    if (scale < 1) pipe = pipe.resize({ width: Math.round((meta.width ?? maxSize) * scale) });
  }
  const tmp = path.join(TMP, path.basename(out));
  await pipe.webp({ quality, effort: 6 }).toFile(tmp);
  await rm(out, { force: true });
  await rename(tmp, out);
  return [src, out, await sizeOf(out)] as const;
}

/** Recompress a PNG in place (palette-safe: keeps alpha via palette). */
async function recompressPng(rel: string) {
  const file = path.join(ROOT, rel);
  const before = await sizeOf(file);
  const tmp = path.join(TMP, path.basename(file));
  await sharp(file).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(tmp);
  await rm(file, { force: true });
  await rename(tmp, file);
  return [before, await sizeOf(file)] as const;
}

async function main() {
  await mkdir(TMP, { recursive: true });
  let saved = 0;
  const log = (msg: string) => console.log(msg);

  /* 1 — game key-arts: JPEG → WebP q78 (displayed ≤662×378 desktop, ~350px
   *     mobile; 840px source retained for ~1.25× DPR headroom). */
  for (const f of (await readdir(path.join(ROOT, "public/games"))).filter((f) => f.endsWith(".jpg"))) {
    const [src, _out, outSize] = await toWebp(`public/games/${f}`, 78);
    const before = await sizeOf(src);
    saved += before - outSize;
    log(`games/${f}: ${KB(before)} → ${KB(outSize)} (webp q78)`);
    await rm(src, { force: true }); // .jpg is now unreferenced — delete
  }

  /* 2 — brand logos for <Image> refs (hero emblem = LCP, navbar, footer,
   *     download section). PNG originals stay: manifest icons (spec-safe). */
  for (const [rel, q] of [
    ["public/brand/pcmax-logo-256.png", 92],
    ["public/brand/pcmax-logo-96.png", 92],
  ] as const) {
    const [src, _out, outSize] = await toWebp(rel, q);
    const before = await sizeOf(src);
    saved += before - outSize;
    log(`${rel}: ${KB(before)} → ${KB(outSize)} (webp q${q})`);
  }

  /* 3 — app-convention icons in place (favicon link + manifest 512 + apple). */
  for (const rel of ["src/app/icon.png", "src/app/apple-icon.png"]) {
    const [before, after] = await recompressPng(rel);
    saved += before - after;
    log(`${rel}: ${KB(before)} → ${KB(after)} (palette png)`);
  }

  await rm(TMP, { recursive: true, force: true });
  log(`\nTOTAL SAVED: ${KB(saved)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
