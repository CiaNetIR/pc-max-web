/**
 * PC MAX Web — responsive WebP variants (Task 24, Lighthouse "Improve image
 * delivery": 123 KiB est. savings on mobile).
 *
 * The static GitHub-Pages export runs next/image with `unoptimized`, which
 * emits a bare `src` and NO srcset — so every device downloads the full
 * 840px key-art even when it renders at ~380 CSS px (Lighthouse's Moto G
 * Power @ DPR 1.75 needs 662 device px). The gallery cards now hand-roll a
 * srcSet; this script produces the two missing widths:
 *
 *   <name>-480.webp  — DPR-1 desktop 3-col cards (~392 px) + mock thumbnails
 *   <name>-672.webp  — DPR-1.75 mobile full-bleed cards (~380 CSS × 1.75)
 *   <name>.webp      — 840px master (kept as-is; high-DPR phones/desktops)
 *
 * Encoding is single-shot from the git-tracked JPEG originals (Task 23
 * deleted them from the worktree; `git show e70fa4b~1:…` restores them), so
 * re-running never stacks generation loss on already-lossy WebPs.
 *
 * Run: `bun scripts/responsive-images.ts` (idempotent).
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdir, rm, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/* Commit whose parent still carries the untouched JPEG sources. */
const SRC_REF = "e70fa4b~1";
const GAMES = ["cyberpunk", "gtav", "wukong", "eldenring", "alanwake2", "bg3"];
/* [width, quality] — quality matches the 840 master (q78, effort 6). */
const VARIANTS = [
  [480, 78],
  [672, 78],
] as const;

const ROOT = process.cwd();
const TMP = path.join(ROOT, ".image-opt-tmp");
const KB = (n: number) => `${(n / 1024).toFixed(1)} KB`;

async function main() {
  await mkdir(TMP, { recursive: true });

  let variantBytes = 0;
  for (const game of GAMES) {
    /* Restore the pristine JPEG source from git history (bytes identical to
     * what Task 23 encoded the 840px master from). */
    const jpg = path.join(TMP, `${game}.jpg`);
    const bytes = execFileSync("git", ["show", `${SRC_REF}:public/games/${game}.jpg`], {
      cwd: ROOT,
      maxBuffer: 32 * 1024 * 1024,
    });
    await writeFile(jpg, bytes);

    const master = (await stat(path.join(ROOT, "public/games", `${game}.webp`))).size;
    for (const [width, quality] of VARIANTS) {
      const tmpOut = path.join(TMP, `${game}-${width}.webp`);
      await sharp(jpg).resize({ width }).webp({ quality, effort: 6 }).toFile(tmpOut);
      const out = path.join(ROOT, "public/games", `${game}-${width}.webp`);
      await rm(out, { force: true });
      await rename(tmpOut, out);
      const size = (await stat(out)).size;
      variantBytes += size;
      console.log(`games/${game}-${width}.webp: ${KB(size)} (${width}w q${quality}) — master ${KB(master)}`);
    }
    await rm(jpg, { force: true });
  }

  await rm(TMP, { recursive: true, force: true });
  const widths = VARIANTS.map(([w]) => `${w}w`).join(" + ");
  console.log(`\nVARIANTS ADDED: ${KB(variantBytes)} on disk (${GAMES.length} games × ${widths})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
