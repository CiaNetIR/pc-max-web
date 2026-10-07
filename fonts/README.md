# Fonts

## The TweakFa pair (IRANYekanX + Poppins) — active

Self-hosted woff2 cuts. The IRANYekanX faces + Poppins digit grafts were
downloaded from <https://tweakfa.com/phoenix-landing/fonts/> (the
Phoenix-Guardian landing), matching the reference site's typography
byte-for-byte; the four Poppins latin cuts (v3.0, Task 42) were downloaded
from Google Fonts' latin unicode-range files:

```
IRANYekanX-{Regular,Medium,DemiBold,Bold,ExtraBold}.woff2   → Persian face, 400–800
Poppins-{Regular,SemiBold,Bold,ExtraBold}.latin.woff2       → EN face, 400/600/700/800 (~8KB each)
Poppins-{Regular,SemiBold,Bold}.digits.woff2                → Latin digit subsets (U+0030-0039)
```

Wired in `src/app/[[...lang]]/layout.tsx` (`LOCAL_FACES` → injected hoisted
`<style>` with BASE_PATH-aware urls) + `src/app/globals.css`
(`--font-sans` / `--font-display` stacks, `html[dir="rtl"]` override):

- `font-display: swap` on every face.
- **The digits trick**: the Poppins digit files are declared UNDER the
  `'IRANYekanX'` family with `unicode-range: U+0030-0039` — Latin digits inside
  Persian text render in Poppins while every other glyph renders in IRANYekanX
  (the signature TweakFa move).
- v3.0: Poppins (latin subsets) carries the EN display + body voice
  (`--font-sans` / `--font-display`); EN preloads SemiBold + Bold, FA preloads
  IRANYekanX Regular/Bold/ExtraBold. The FA document never references the
  'Poppins' family, so the latin cuts never download there.
- `SpaceGrotesk-Var.latin.woff2` (v2.8 EN display face) was deleted in v3.0
  (Task 42 Wave C) — fully unused since the Poppins swap.

## Ariobarzan (Persian typeface) — retired

The old commercial-font drop-in contract was removed in v2.1.0 when the
TweakFa pair landed. (Ariobarzan remains a paid font at spacedesign.ir and
cannot be redistributed.)
