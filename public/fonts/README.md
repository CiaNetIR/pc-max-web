# Fonts

## The TweakFa pair (IRANYekanX + Poppins) — active

Self-hosted woff2 cuts downloaded from <https://tweakfa.com/phoenix-landing/fonts/>
(the Phoenix-Guardian landing), matching the reference site's typography
byte-for-byte:

```
IRANYekanX-{Regular,Medium,DemiBold,Bold,ExtraBold}.woff2   → Persian face, 400–800
Poppins-{Regular,SemiBold,Bold}.latin.woff2                 → Latin face, 400/600/700
Poppins-{Regular,SemiBold,Bold}.digits.woff2                → Latin digit subsets (U+0030-0039)
```

Wired in `src/app/layout.tsx` (`LOCAL_FACES` → injected hoisted `<style>` with
BASE_PATH-aware urls) + `src/app/globals.css` (`--font-sans` / `--font-display`
stacks, `html[dir="rtl"]` override):

- `font-display: swap` on every face.
- **The digits trick**: the Poppins digit files are declared UNDER the
  `'IRANYekanX'` family with `unicode-range: U+0030-0039` — Latin digits inside
  Persian text render in Poppins while every other glyph renders in IRANYekanX
  (the signature TweakFa move).
- EN preloads the three Poppins latin cuts; the FA SSR flavor preloads
  IRANYekanX Regular/Bold/ExtraBold.

## Ariobarzan (Persian typeface) — retired

The old commercial-font drop-in contract was removed in v2.1.0 when the
TweakFa pair landed. (Ariobarzan remains a paid font at spacedesign.ir and
cannot be redistributed.)
