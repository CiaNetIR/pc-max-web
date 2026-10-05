# Fonts

## Ariobarzan (Persian typeface) — drop-in slot

Ariobarzan is a **commercial font** (designer: Saeid Poonki) sold at
<https://spacedesign.ir/store/downloads/دانلود-فونت-آریوبرزن-ariobarzan-فونت-فارسی-bold-بر/>.
It cannot be redistributed with the project — purchase it, then drop the
files here and the site picks them up **automatically, zero code changes**.

Expected filenames (any of the three extensions works, `.woff2` preferred):

```
ariobarzan-regular.woff2   → body text   (weight 400)
ariobarzan-bold.woff2      → display/titles (weight 700)
```

Rules already wired in `src/app/layout.tsx` + `src/app/globals.css`:

- `font-display: swap` (Persian text paints on the fallback while loading)
- Arabic-script `unicode-range` — Latin text stays on the system stack
- **Both files present** → titles *and* body text use Ariobarzan
- **Bold file only** → titles use Ariobarzan, body text stays on Vazirmatn
  (a Bold-only cut must never render long-form paragraphs)
- Files absent → Vazirmatn fallback, no failed font requests

### Converting TTF → WOFF2

```bash
pip install fonttools brotli
fonttools ttLib.woff2 compress ariobarzan-regular.ttf
fonttools ttLib.woff2 compress ariobarzan-bold.ttf
```

Other files in this directory (`pcmax-sora-800.ttf`) are the Latin brand
cut used by the GPU brand texture — not related to Persian typography.
