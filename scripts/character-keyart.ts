/**
 * PC MAX Web — Task 33: famous-character key art swap.
 *
 * Every image on the site now carries instantly recognizable game
 * characters (user request): Ghost (CoD) as the hero stage art, and a
 * gallery of Johnny Silverhand (Cyberpunk 2077), the GTA V trio, the
 * Destined One (Black Myth: Wukong), Kratos vs Thor (God of War), Geralt
 * vs the Leshen (The Witcher 3) and Arthur Morgan (RDR2).
 *
 * One-shot encoding from the pristine downloaded originals (VLM-picked
 * candidates in /tmp/imgcandidates): single encode per variant, so no
 * generation-loss stacking. Exact 16:10 center crop (the gallery + hero
 * frames are aspect-[16/10] with object-cover, so masters are normalized
 * to the frame ratio — identical rendering for every key art).
 *
 * Run: `bun scripts/character-keyart.ts` (idempotent, overwrites).
 */
import sharp from "sharp";
import { stat } from "node:fs/promises";
import path from "node:path";

const SRC = "/tmp/imgcandidates";
const OUT = path.join(process.cwd(), "public/games");
const KB = (n: number) => `${(n / 1024).toFixed(1)} KB`;

/* [slug, source file] — hero first. */
const ART: Array<[slug: string, file: string]> = [
  ["ghost", "ghost-4.jpg"], // HERO — CoD Ghost, hard-shell skull mask, black void bg
  ["cyberpunk", "cp-1.img"], // Johnny Silverhand close-up, dark blue neon
  ["gtav", "gtav-1.img"], // official trio cover art
  ["wukong", "wukong-3.img"], // the Destined One, dark cinematic render
  ["kratos", "kratos-3.img"], // Thor grabs Kratos — Ragnarök promo still
  ["geralt", "geralt-5.img"], // Geralt vs the Leshen, red-lit misty forest
  ["rdr2", "arthur-7.img"], // Arthur Morgan close-up, chiaroscuro on black
];

const WIDTHS = [840, 672, 480] as const; // master, DPR-1.75 mobile, DPR-1 desktop/thumbs
const QUALITY = 78;

async function main() {
  let total = 0;
  for (const [slug, file] of ART) {
    const img = sharp(path.join(SRC, file));
    const { width = 0, height = 0 } = await img.metadata();
    /* center-crop to exact 16:10 first, then resize per width */
    const target = 16 / 10;
    let cropW = width;
    let cropH = height;
    if (width / height > target) cropW = Math.round(height * target);
    else cropH = Math.round(width / target);
    const left = Math.round((width - cropW) / 2);
    const top = Math.round((height - cropH) / 2);

    for (const w of WIDTHS) {
      const out = path.join(OUT, w === 840 ? `${slug}.webp` : `${slug}-${w}.webp`);
      await img
        .clone()
        .extract({ left, top, width: cropW, height: cropH })
        .resize({ width: w })
        .webp({ quality: QUALITY, effort: 6 })
        .toFile(out);
      const size = (await stat(out)).size;
      total += size;
      console.log(`games/${path.basename(out)}: ${KB(size)} (${w}w q${QUALITY}, src ${width}x${height})`);
    }
  }
  console.log(`\nTOTAL: ${KB(total)} (7 key arts × 3 widths)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
