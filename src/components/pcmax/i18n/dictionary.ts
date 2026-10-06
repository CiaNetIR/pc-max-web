export type Locale = "en" | "fa";

const en = {
  nav: {
    features: "Features",
    install: "How it works",
    benchmarks: "Benchmarks",
    faq: "FAQ",
    download: "Download",
    menu: "Menu",
  },
  hero: {
    /* {version} is replaced with the live app release at render (hero.tsx) —
       sourced from lib/app-release.ts (GitHub resolver), never hardcoded. */
    kicker: "PC optimization for Windows · v{version}",
    title1: "More FPS.",
    title2: "Better frames. Full control.",
    sub: "PC MAX intelligently optimizes Windows, installs advanced frame-generation workflows, and prepares your games for maximum performance.",
    /* Trust badges — every claim here is documented on-page (FAQ / safety /
       privacy): snapshot+rollback, no-injection, telemetry scope. */
    bullets: [
      "Snapshot before every change",
      "One-click rollback, any time",
      "No game injection",
      "No telemetry in the desktop app",
    ],
    trustLine: "Windows 10 & 11 · x64 · Free",
    /* The framed app-window stage below the CTAs is an interface PREVIEW,
     * not a live feed — the badge + caption keep that explicit (no fake
     * live-data framing). Chips carry static, verifiable product facts. */
    stage: {
      badge: "Preview",
      caption: "Interface preview — artwork is illustrative.",
    },
    primary: "Download PC MAX",
    secondary: "See how it works",
    hint: "Scroll to explore",
  },
  pipeline: {
    eyebrow: "What is PC MAX",
    title: "One platform between your games and your hardware.",
    desc: "PC MAX is a Windows desktop app backed by its own server — per-game graphics settings and Windows tuning are delivered from it, never baked into the app.",
    nodes: [
      { label: "Games", desc: "Synced from the server — new titles arrive without an app rebuild" },
      { label: "GPU", desc: "Detected locally by the Rust hardware engine" },
      { label: "Windows", desc: "Registry, services and scheduled tasks — tuned as one transaction" },
      { label: "PC MAX", desc: "A desktop app plus its own API — settings delivered, not baked in" },
      { label: "Optimized Experience", desc: "Snapshot before every change. One-click rollback. Offline-first." },
    ],
  },
  multiframe: {
    eyebrow: "Frame Generation",
    title: "Frame generation, engineered per hardware.",
    desc: "Three workflows, one goal — smoother frames. PC MAX installs the right one for your GPU, per game, with guided setup and automatic backups.",
    compatibility: "Compatibility",
    note: "Compatibility is verified per-title during setup.",
    cards: [
      {
        name: "OptiScaler",
        tagline: "Universal upscaling integration",
        badges: ["DLSS", "FSR", "XeSS"],
        bullets: [
          "Guided installation, per game",
          "Automatic backup of original files",
        ],
      },
      {
        name: "AI Optical Flow",
        tagline: "Motion-aware frame synthesis",
        badges: ["RTX 20", "RTX 30", "RTX 40", "RTX 50"],
        bullets: [
          "Synthesizes high-quality intermediate frames",
          "Latency-aware, responsive play",
        ],
      },
      {
        name: "Streamline PC MAX",
        tagline: "Next-generation frame interpolation",
        warning: "Only RTX 40 / RTX 50",
        bullets: [
          "Newest frame-generation path",
          "Guarded installer — incompatible GPUs are protected",
        ],
      },
    ],
    tech: {
      title: "Technical details",
      entries: [
        {
          name: "OptiScaler",
          details: [
            "Guided installation per game — pick the EXE, PC MAX handles the rest",
            "Works with DLSS, FSR and XeSS-based upscaler families",
            "Smart integration with automatic backup of original files",
            "Hardware-aware setup adapts to your GPU generation",
          ],
        },
        {
          name: "AI Optical Flow",
          details: [
            "Analyzes motion vectors between rendered frames",
            "Uses the optical-flow capabilities of each RTX generation",
            "Latency-aware design for smooth, responsive play",
            "Only offered on hardware that supports it",
          ],
        },
        {
          name: "Streamline PC MAX",
          details: [
            "Built on the Streamline framework architecture",
            "Targets the newest frame-generation path",
            "Requires Ada (RTX 40) or Blackwell (RTX 50) hardware",
            "Guarded installer — incompatible GPUs are detected and protected",
          ],
        },
      ],
    },
  },
  install: {
    eyebrow: "Installation Flow",
    title: "From download to optimized, in seven steps.",
    desc: "A verified pipeline — installer, account, sync, profile. A snapshot is taken before anything changes.",
    steps: [
      { title: "Download", desc: "Get the PC MAX installer for Windows" },
      { title: "Run Setup", desc: "The wizard installs PC MAX on your Windows PC" },
      { title: "Launch", desc: "Open the app — a native Windows desktop application" },
      { title: "Sign In", desc: "A free account (email + password) — it syncs your catalogue" },
      { title: "Sync", desc: "The game catalogue and profiles sync from the server" },
      { title: "Pick a Game", desc: "Browse or search, open a title, choose a profile" },
      { title: "Apply", desc: "A full snapshot is taken first — then it applies. Play." },
    ],
    /* Task 39 — the pinned scroll journey (scrollytelling) over these same
     * seven steps. Labels are UI chrome only; the step content itself stays
     * the steps array above (single source of truth, EN+FA). */
    journey: {
      menuLabel: "Installation steps",
      scrollHint: "Scroll to run the sequence",
      skip: "Skip the sequence",
      counter: "Step {n} of {total}",
      disclaimer: "Illustrative interface — this preview is driven by your scroll.",
    },
  },
  /* Task 39 — the sector HUD: the fixed mini menu box that tracks scroll
   * position through the page's sections (sector names only, in page
   * order — the ids live in the component, translations here). */
  hud: {
    label: "Section",
    menuLabel: "Jump to section",
    close: "Close",
    sectors: [
      "Top",
      "Console",
      "Platform",
      "Frame Gen",
      "Profiles",
      "Safety",
      "Benchmarks",
      "Community",
      "Install",
      "FAQ",
      "Download",
    ],
  },
  library: {
    eyebrow: "Game Library",
    title: "Your library, synced.",
    desc: "Games arrive straight from the PC MAX catalogue — searchable, filterable, every title carrying ready profiles and performance ratings. No manual entry.",
    badges: {
      exe: "Catalogue synced",
      icon: "Performance rated",
      ready: "Profile ready",
    },
    footnote: "Showcase — characters and key art belong to their respective publishers; shown for illustration.",
    games: [
      { name: "Cyberpunk 2077", genre: "RPG · Open World" },
      { name: "GTA V", genre: "Action · Open World" },
      { name: "Black Myth: Wukong", genre: "Action RPG" },
      { name: "God of War", genre: "Action · Adventure" },
      { name: "The Witcher 3", genre: "RPG · Open World" },
      { name: "Red Dead Redemption 2", genre: "Action · Open World" },
    ],
  },
  profiles: {
    eyebrow: "Optimization Profiles",
    title: "Maximum FPS or High Quality. Your call.",
    desc: "Named profiles per game, from Maximum FPS to Ultra Quality — each with a Target FPS, a hardware tier and versioned updates.",
    yellow: {
      name: "Image first",
      mode: "High Quality",
      points: [
        "Settings grouped by category — Graphics, Ray Tracing, Display",
        "Per-profile Target FPS and hardware tier, Mid-range to Ultra",
        "Versioned releases with notes; updates flagged “New optimization”",
        "Sharper image reconstruction — ideal for single-player epics",
      ],
    },
    green: {
      name: "Frames first",
      mode: "Maximum FPS",
      points: [
        "Prioritizes high frame rates for competitive play",
        "Latency kept in check while frames climb",
        "New games go live on your next sync — no app rebuild needed",
        "Balanced and Ultra Quality profiles sit between these two",
      ],
    },
    active: "Active",
    switchHint: "Tap to compare profiles",
  },
  safety: {
    eyebrow: "System Safety",
    title: "Tuned hard. Reversible, always.",
    desc: "Windows changes apply as one transaction with full rollback — downloads are HMAC-signed and short-lived, and premium access is re-checked server-side.",
    optimizer: {
      eyebrow: "Windows Optimizer",
      title: "A faster Windows, without the guesswork.",
      desc: "Registry, services, scheduled tasks — every change the Rust engine makes runs inside that transaction, fully reversible.",
      stats: [
        { value: 235, suffix: "", label: "automated tests in CI" },
        { value: 151, suffix: "", label: "API tests" },
        { value: 48, suffix: "", label: "desktop tests" },
        { value: 36, suffix: "", label: "Rust engine tests" },
      ],
      note: "Executables and scripts can never enter a package — the allowlist is enforced on both sides.",
    },
    backup: {
      eyebrow: "Backup & Restore",
      title: "Every change, reversible.",
      desc: "A full snapshot is taken before anything changes. One click rolls everything back, any time.",
      steps: [
        { title: "Snapshot", desc: "A full snapshot is captured before anything changes" },
        { title: "Apply", desc: "Changes run as one transaction — all or nothing" },
        { title: "Rollback", desc: "If any step fails, everything rolls back in full" },
        { title: "Restore", desc: "One click returns your system to the snapshot, any time" },
      ],
    },
  },
  bench: {
    eyebrow: "Benchmarks",
    title: "Numbers, not promises.",
    desc: "Frame generation plus Windows tuning — the combined effect, measured before and after on our test bench.",
    avgLabel: "Average observed uplift",
    avg: "+34%",
    unit: "fps",
    beforeLabel: "Before",
    afterLabel: "PC MAX",
    viewAll: "View all benchmarks",
    viewLess: "Show fewer",
    /* The per-game pairs below are illustrative examples of typical results —
     * only the +34% headline is a measured, documented figure. */
    gamesNote: "Per-game pairs are illustrative; the headline average is the measured figure.",
    games: [
      { name: "Cyberpunk 2077", before: 68, after: 94 },
      { name: "Alan Wake 2", before: 54, after: 76 },
      { name: "Black Myth: Wukong", before: 61, after: 83 },
      { name: "Starfield", before: 48, after: 66 },
      { name: "Baldur's Gate 3", before: 74, after: 96 },
      { name: "GTA V", before: 118, after: 144 },
    ],
    note: "Median of 3 runs · 1440p · RTX 4070 test bench · frame generation where compatible · Results vary by system.",
  },
  social: {
    eyebrow: "Trust",
    title: "The numbers behind the platform.",
    desc: "Download counts from our own release records — plus facts you can verify on this page.",
    /* `downloads` + `releases` values are DB-derived at render (server
     * wrapper / build-time DB); the `fallback` is used only when the DB is
     * unavailable. `tests` + `telemetry` are static documented facts. */
    stats: {
      downloads: { fallback: 293, suffix: "K+", label: "downloads across releases" },
      releases: { fallback: 3, suffix: "", label: "stable releases shipped" },
      tests: { value: 470, suffix: "", label: "automated tests" },
      telemetry: { value: 0, suffix: "", label: "telemetry in the desktop app" },
    },
    trust: {
      title: "Trust, by design",
      items: [
        { title: "Verify every install", desc: "Every release is published on GitHub Releases with its installer and signature file — review the build before you run it.", meta: "See the Download card", href: "#download" },
        { title: "No telemetry", desc: "No analytics, no trackers in the desktop app. Optimizations run fully offline.", meta: "", href: "" },
        { title: "Open changelog", desc: "Every release is documented and dated — features, improvements, fixes.", meta: "View the changelog", href: "#download" },
      ],
    },
    artifacts: {
      title: "Prefer artifacts over words?",
      changelog: "View the changelog",
      benchmarks: "See the benchmarks",
    },
  },
  showcase: {
    eyebrow: "Product",
    title: "The console for your PC.",
    desc: "The PC MAX desktop app — glass surfaces, soft reflections and live tabs.",
    disclaimer: "Interface preview — values are illustrative.",
    /* Auto-rotation control (the 1.5s panel swap) — WCAG 2.2.2 pause */
    pauseAuto: "Pause auto-rotate",
    resumeAuto: "Resume auto-rotate",
    tabs: {
      dashboard: "Dashboard",
      multiframe: "Multi-Frame",
      windows: "Optimized Windows",
      settings: "Settings",
    },
    mf: {
      perGame: "Per-game profiles",
      status: {
        installed: "Installed",
        ready: "Ready",
        incompatible: "Not compatible",
      },
    },
    win: {
      applied: "Optimizations applied",
      of: "of",
      modules: "modules",
      revert: "Revert all",
      services: "Services",
    },
    settings: {
      language: "Language",
      profile: "Default profile",
      telemetry: "Telemetry",
      off: "Off",
    },
  },
  features: {
    eyebrow: "Features",
    title: "Detect. Optimize. Protect.",
    desc: "Three disciplines, one platform — everything PC MAX does falls into one of them.",
    groups: [
      {
        icon: "cpu",
        title: "Detect",
        desc: "Everything starts by knowing your machine — precisely.",
        items: [
          "Hardware detection in the Rust engine — GPU, CPU, display",
          "Game catalogue synced from the server, with instant search and filters",
          "Versioned profile updates, flagged with a “New optimization” badge",
        ],
      },
      {
        icon: "performance",
        title: "Optimize",
        desc: "The right change, per game. Nothing more, nothing less.",
        items: [
          "Windows tuned for gaming: registry, services, scheduled tasks",
          "Per-game profiles — Maximum FPS, Balanced, High Quality, Ultra Quality",
          "Target FPS and hardware tier per profile — settings grouped by category",
        ],
      },
      {
        icon: "shield",
        title: "Protect",
        desc: "Every change reversible. That is the design, not a feature.",
        items: [
          "Full snapshot before any change, with one-click rollback",
          "Windows changes apply as a transaction — full rollback on any failure",
          "Executables and scripts never enter a package; premium is gated server-side",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions, answered.",
    desc: "The five that matter — technical facts only.",
    core: [
      {
        q: "Does PC MAX actually improve FPS?",
        a: "Yes — through two mechanisms: Windows tuning (startup, memory, power, services) and per-game frame-generation workflows. The combined average on our test bench is +34%, median of 3 measured runs. Results vary by system.",
      },
      {
        q: "Can I undo changes?",
        a: "Everything is reversible. A snapshot of the affected files and settings is created before anything changes, integrity is verified after optimizing, and one click restores the snapshot — at any time.",
      },
      {
        q: "What exactly does PC MAX modify?",
        a: "Windows settings (startup, power plan, services, memory management) and — only when you install a workflow for a game — that game's upscaling and frame-generation files, always after an automatic backup. No kernel hacks, no driver replacements.",
      },
      {
        q: "Which GPUs are supported?",
        a: "Any DirectX 12 GPU benefits from Windows optimization. Frame generation is GPU-aware: OptiScaler is broad, AI Optical Flow needs RTX 20 and up, Streamline needs RTX 40/50. The installer only offers what your hardware supports.",
      },
      {
        q: "What about anti-cheat?",
        a: "PC MAX never injects anything into games and never touches anti-cheat systems. It optimizes Windows and installs documented, per-game upscaling files — the same files Steam verification can restore. We still recommend testing in unranked matches first; policies are set by each game's publisher.",
      },
    ],
    fullLabel: "Full FAQ",
    full: [
      {
        q: "Is there a subscription?",
        a: "The core app is free to download and use. An account (email and password) syncs your catalogue; premium extras are subscription-gated and enforced server-side.",
      },
      {
        q: "Does it work offline?",
        a: "Yes — the app is offline-first: it keeps working from your last synced catalogue and profiles and re-syncs automatically when you're back online. Internet is only needed for the first sync, updates and package downloads.",
      },
      {
        q: "Which Windows versions are supported?",
        a: "Windows 10 (64-bit) and Windows 11. Some optimizations are version-specific; PC MAX detects your build and adapts automatically.",
      },
      {
        q: "What is OptiScaler?",
        a: "OptiScaler is an open-source integration layer that lets games use modern upscalers — such as DLSS, FSR and XeSS — more flexibly across different GPUs. PC MAX installs and maintains it for you, per game, with automatic backups.",
      },
      {
        q: "What is AI Optical Flow?",
        a: "A frame-generation technique that analyzes motion between rendered frames and synthesizes new in-between frames. Support depends on your RTX generation — the installer detects your hardware and only offers compatible paths.",
      },
      {
        q: "Does PC MAX modify game files?",
        a: "Only when you install a frame-generation workflow for that game — and always after an automatic backup. Steam file verification also works normally afterward.",
      },
    ],
    stillHave: {
      title: "Still have questions?",
      desc: "Ask the community on Discord — or drop us an email.",
      cta: "Join the Discord",
    },
  },
  cta: {
    title: "Your PC. Maxed.",
    sub: "Download PC MAX and prepare your machine for its best possible frames.",
    button: "Download PC MAX",
    buttonBusy: "Fetching latest release…",
    meta: "Free download · Windows 10/11 · x64",
    versionLabel: "Latest",
    sizeLabel: "Installer",
    releasedLabel: "Released",
    sourceLabel: "Source",
    requirements: {
      os: "OS",
      osValue: "Windows 10 / 11 · 64-bit",
      arch: "Architecture",
      archValue: "x64",
      ram: "Memory",
      ramValue: "4 GB min · 8 GB recommended",
      disk: "Disk space",
      diskValue: "220 MB",
      gpu: "Graphics",
      gpuValue: "DirectX 12 compatible GPU",
    },
    editions: {
      free: {
        name: "PC MAX",
        badge: "Current",
        price: "Free",
        tagline: "Everything on this page. Every optimization, every workflow.",
      },
      pro: {
        name: "PC MAX Pro",
        badge: "Coming soon",
        price: "—",
        tagline: "Priority profiles, AI tuning and early workflows — for enthusiasts.",
        cta: "Join waitlist",
      },
    },
    changelog: {
      title: "What's new",
      viewOnGithub: "View on GitHub",
      error: "Changelog unavailable right now.",
      empty: "No release notes yet.",
    },
    /* Release provenance — replaces the old local-artifact SHA-256 row
     * (Task 32): the installer now ships from the app repo's GitHub
     * Releases, so the honest, verifiable signal is WHERE it comes from
     * and that the button always fetches the newest tag live. */
    source: {
      label: "Official release",
      value: "github.com/CiaNetIR/pc-max",
      note: "The button always fetches the newest release, live from GitHub.",
    },
    /* Checksum row — the REAL SHA-256 measured from the published
     * installer artifact (Task 35). Rendered only while the download
     * serves exactly that version (see VerifyRow in
     * download-cta.client.tsx); version-pinned, never a generic claim. */
    verify: {
      label: "Verify this download",
      copy: "Copy",
      copied: "SHA-256 copied to clipboard",
      copyFailed: "Select the checksum and copy it manually",
      note: "Measured from the published installer — compare locally in PowerShell: Get-FileHash -Algorithm SHA256",
    },
    waitlist: {
      title: "Get Pro early",
      desc: "One email when Pro lands. Nothing else — ever.",
      placeholder: "you@example.com",
      emailLabel: "Email address",
      button: "Notify me",
      success: "You're on the list.",
      successDesc: "We'll email you the moment PC MAX Pro ships.",
      duplicate: "Already on the list — see you at launch.",
      error: "Couldn't subscribe — check the address and retry.",
      /* Shown instead of the form on the static GitHub Pages build (no
       * server to POST to there). */
      staticNote:
        "The waitlist runs on the full PC MAX site — this static GitHub Pages build can't take sign-ups. Track releases on GitHub instead.",
    },
    bottomBar: {
      label: "Download PC MAX",
      note: "Free · Windows 10 / 11 · x64",
      close: "Dismiss",
    },
  },
  footer: {
    tagline: "Premium Windows gaming optimization.",
    product: "Product",
    community: "Community",
    support: "Support",
    legal: "Legal",
    communityLinks: [
      { label: "Discord", href: "https://discord.gg/pcmax" },
      { label: "Telegram", href: "https://t.me/pcmaxapp" },
    ],
    supportLinks: [
      { label: "support@pcmax.io", href: "mailto:support@pcmax.io" },
      { label: "bugs@pcmax.io", href: "mailto:bugs@pcmax.io" },
    ],
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    privacyBody: "PC MAX works offline-first. We do not collect, store or transmit personal data. This website logs anonymous, aggregate events only (page views, download counts) — no identifiers. The desktop app contains zero telemetry. Emails shared with the waitlist are used only to announce Pro availability, and nothing else.",
    termsBody: "PC MAX is provided free of charge, as-is, without warranty. You remain responsible for keeping backups — the app automates this, but verification is good practice. OptiScaler is used under its open-source license. PC MAX is not affiliated with NVIDIA, Microsoft, Valve or any game publisher.",
    platformItems: ["Windows 10 & 11", "x64 architecture", "Offline-ready", "Zero telemetry"],
    rights: "© {year} PC MAX. All rights reserved.",
    disclaimer: "PC MAX is an independent product. Not affiliated with NVIDIA, Microsoft, or any game publisher.",
    madeFor: "Built for Windows 10 & 11",
  },
  common: {
    switchTo: "فارسی",
    skipToContent: "Skip to main content",
  },
  error404: {
    title: "Lost in optimization.",
    sub: "The page you're looking for doesn't exist. Let's get you back to smoother frames.",
    cta: "Back to home",
  },
  errorPage: {
    title: "Something glitched.",
    sub: "This section failed to load. Give it another try.",
    retry: "Try again",
  },
};

export type Dictionary = typeof en;

const fa: Dictionary = {
  nav: {
    features: "قابلیت‌ها",
    install: "نحوه کار",
    benchmarks: "بنچمارک",
    faq: "سوالات",
    download: "دانلود",
    menu: "منو",
  },
  hero: {
    kicker: "بهینه‌سازی ویندوز برای بازی · نسخه {version}",
    title1: "فریم بیشتر.",
    title2: "تصویر بهتر. کنترل کامل.",
    sub: "پی‌سی‌مکس ویندوز را هوشمندانه بهینه می‌کند، جریان‌کاری پیشرفته‌ی فریم‌ساخت را نصب می‌کند و بازی‌های شما را برای حداکثر عملکرد آماده می‌سازد.",
    /* نشان‌های اعتماد — هر ادعا در همین صفحه مستند است (سوالات / ایمنی / حریم خصوصی). */
    bullets: [
      "اسنپ‌شات پیش از هر تغییر",
      "بازگشت با یک کلیک، در هر زمان",
      "بدون تزریق داخل بازی",
      "بدون تله‌متری در اپ دسکتاپ",
    ],
    trustLine: "ویندوز 10 و 11 · x64 · رایگان",
    stage: {
      badge: "پیش‌نمایش",
      caption: "پیش‌نمایش رابط — تصویر، نمایشی است.",
    },
    primary: "دانلود PC MAX",
    secondary: "نحوه‌ی کار را ببینید",
    hint: "برای کاوش اسکرول کنید",
  },
  pipeline: {
    eyebrow: "پی‌سی‌مکس چیست؟",
    title: "یک پلتفرم، میان بازی‌های شما و سخت‌افزارتان.",
    desc: "پی‌سی‌مکس یک اپلیکیشن دسکتاپ ویندوز با سرور اختصاصی خودش است — تنظیمات گرافیکی هر بازی و بهینه‌سازی ویندوز از سرور ارائه می‌شوند؛ بدون نیاز به ساخت مجدد اپ.",
    nodes: [
      { label: "بازی‌ها", desc: "همگام‌شده از سرور — بازی‌های جدید بدون نیاز به ساخت مجدد اپ می‌رسند" },
      { label: "پردازنده‌ی گرافیکی", desc: "تشخیص سخت‌افزار به‌صورت محلی، توسط موتور Rust" },
      { label: "ویندوز", desc: "رجیستری، سرویس‌ها و تسک‌های زمان‌بندی — در قالب یک تراکنش" },
      { label: "پی‌سی‌مکس", desc: "اپ دسکتاپ به‌همراه API اختصاصی‌اش — تنظیمات از سرور، نه تعبیه‌شده" },
      { label: "تجربه‌ی بهینه", desc: "اسنپ‌شات پیش از هر تغییر؛ بازگشت با یک کلیک؛ کارکرد آفلاین." },
    ],
  },
  multiframe: {
    eyebrow: "فریم‌ساخت",
    title: "فریم‌ساخت، مهندسی‌شده برای هر سخت‌افزار.",
    desc: "سه جریان کاری، یک هدف — فریم‌های نرم‌تر. پی‌سی‌مکس مناسب‌ترین گزینه را برای کارت گرافیکی شما، به‌ازای هر بازی، با نصب هدایت‌شده و پشتیبان‌گیری خودکار مستقر می‌کند.",
    compatibility: "سازگاری",
    note: "سازگاری هنگام نصب برای هر بازی به‌صورت خودکار بررسی می‌شود.",
    cards: [
      {
        name: "OptiScaler",
        tagline: "یکپارچه‌سازی همگانی مقیاس‌بندی",
        badges: ["DLSS", "FSR", "XeSS"],
        bullets: [
          "نصب هدایت‌شده، به‌ازای هر بازی",
          "پشتیبان‌گیری خودکار فایل‌های اصلی",
        ],
      },
      {
        name: "AI Optical Flow",
        tagline: "فریم‌ساخت آگاه از حرکت",
        badges: ["RTX 20", "RTX 30", "RTX 40", "RTX 50"],
        bullets: [
          "ساخت فریم‌های میانی با کیفیت بالا",
          "طراحی آگاه از تأخیر، برای بازی پاسخ‌گو",
        ],
      },
      {
        name: "Streamline PC MAX",
        tagline: "میان‌یابی فریم نسل جدید",
        warning: "فقط RTX 40 / RTX 50",
        bullets: [
          "جدیدترین مسیر فریم‌ساخت",
          "نصب‌کننده‌ی محافظ — کارت‌های ناسازگار محافظت می‌شوند",
        ],
      },
    ],
    tech: {
      title: "جزئیات فنی",
      entries: [
        {
          name: "OptiScaler",
          details: [
            "نصب هدایت‌شده برای هر بازی — فایل EXE را انتخاب کنید، بقیه با پی‌سی‌مکس",
            "کار با خانواده‌ی مقیاس‌بندهای DLSS، FSR و XeSS",
            "یکپارچه‌سازی هوشمند همراه با پشتیبان‌گیری خودکار فایل‌های اصلی",
            "تنظیمات آگاه از سخت‌افزار، متناسب با نسل کارت گرافیکی شما",
          ],
        },
        {
          name: "AI Optical Flow",
          details: [
            "تحلیل بردارهای حرکت میان فریم‌های رندرشده",
            "استفاده از قابلیت‌های Optical Flow هر نسل RTX",
            "طراحی آگاه از تأخیر، برای بازی روان و پاسخ‌گو",
            "فقط روی سخت‌افزاری که پشتیبانی می‌کند پیشنهاد می‌شود",
          ],
        },
        {
          name: "Streamline PC MAX",
          details: [
            "ساخته‌شده بر معماری فریم‌ورک Streamline",
            "هدف‌گیری جدیدترین مسیر فریم‌ساخت",
            "نیازمند سخت‌افزار Ada ‏(RTX 40) یا Blackwell ‏(RTX 50)",
            "نصب‌کننده‌ی محافظ — کارت‌های ناسازگار شناسایی و محافظت می‌شوند",
          ],
        },
      ],
    },
  },
  install: {
    eyebrow: "فرآیند نصب",
    title: "از دانلود تا سیستم بهینه، در هفت گام.",
    desc: "یک فرآیند راستی‌آزمایی‌شده — نصب‌کننده، حساب کاربری، همگام‌سازی، پروفایل. پیش از هر تغییری اسنپ‌شات گرفته می‌شود.",
    steps: [
      { title: "دانلود", desc: "نصب‌کننده‌ی PC MAX را برای ویندوز دریافت کنید" },
      { title: "راه‌اندازی", desc: "ویزارد نصب، پی‌سی‌مکس را روی ویندوز شما مستقر می‌کند" },
      { title: "اجرای اپ", desc: "اپ را باز کنید — یک اپلیکیشن دسکتاپ بومی ویندوز" },
      { title: "ورود", desc: "یک حساب رایگان (ایمیل و رمز عبور) — کاتالوگ شما را همگام نگه می‌دارد" },
      { title: "همگام‌سازی", desc: "کاتالوگ بازی‌ها و پروفایل‌ها از سرور همگام می‌شوند" },
      { title: "انتخاب بازی", desc: "مرور یا جست‌وجو کنید؛ بازی را باز و پروفایل را انتخاب کنید" },
      { title: "اعمال", desc: "اول اسنپ‌شات کامل، بعد اعمال پروفایل. بازی کنید." },
    ],
    journey: {
      menuLabel: "مراحل نصب",
      scrollHint: "برای اجرای توالی اسکرول کنید",
      skip: "رد کردن توالی",
      counter: "مرحله {n} از {total}",
      disclaimer: "رابط نمایشی — این پیش‌نمایش با اسکرول شما هدایت می‌شود.",
    },
  },
  hud: {
    label: "بخش",
    menuLabel: "پرش به بخش",
    close: "بستن",
    sectors: [
      "آغاز",
      "کنسول",
      "پلتفرم",
      "فریم‌ساخت",
      "پروفایل‌ها",
      "ایمنی",
      "بنچمارک",
      "جامعه",
      "نصب",
      "سوالات",
      "دانلود",
    ],
  },
  library: {
    eyebrow: "کتابخانه‌ی بازی",
    title: "کتابخانه‌ی شما، همگام‌شده.",
    desc: "بازی‌ها مستقیم از کاتالوگ PC MAX می‌رسند — قابل جست‌وجو و فیلتر، و هر عنوان با پروفایل آماده و امتیاز عملکرد. بدون ورود دستی.",
    badges: {
      exe: "همگام با کاتالوگ",
      icon: "امتیاز عملکرد",
      ready: "پروفایل آماده",
    },
    footnote: "نمایشی — کاراکترها و تصاویر متعلق به ناشران اصلی بازی‌ها هستند؛ صرفاً برای نمایش به‌کار رفته‌اند.",
    games: [
      { name: "Cyberpunk 2077", genre: "نقش‌آفرینی · جهان‌باز" },
      { name: "GTA V", genre: "اکشن · جهان‌باز" },
      { name: "Black Myth: Wukong", genre: "نقش‌آفرینی اکشن" },
      { name: "God of War", genre: "اکشن · ماجراجویی" },
      { name: "The Witcher 3", genre: "نقش‌آفرینی · جهان‌باز" },
      { name: "Red Dead Redemption 2", genre: "اکشن · جهان‌باز" },
    ],
  },
  profiles: {
    eyebrow: "پروفایل‌های بهینه‌سازی",
    title: "Maximum FPS یا High Quality؟ انتخاب با شماست.",
    desc: "پروفایل‌های نام‌دار برای هر بازی، از Maximum FPS تا Ultra Quality — هر کدام با Target FPS، سطح سخت‌افزار و به‌روزرسانی نسخه‌دار.",
    yellow: {
      name: "اولویت با تصویر",
      mode: "High Quality",
      points: [
        "تنظیمات گروه‌بندی‌شده — گرافیک، Ray Tracing و نمایشگر",
        "Target FPS و سطح سخت‌افزار برای هر پروفایل، از Mid-range تا Ultra",
        "انتشار نسخه‌دار با یادداشت؛ به‌روزرسانی‌ها با نشان «بهینه‌سازی جدید»",
        "بازسازی تصویر واضح‌تر — ایده‌آل برای بازی‌های داستانی تک‌نفره",
      ],
    },
    green: {
      name: "اولویت با فریم",
      mode: "Maximum FPS",
      points: [
        "اولویت با نرخ فریم بالا برای بازی رقابتی",
        "تأخیر تحت کنترل، در حالی که فریم بالا می‌رود",
        "بازی‌های جدید در همگام‌سازی بعدی شما فعال می‌شوند — بدون نیاز به ساخت مجدد اپ",
        "پروفایل‌های Balanced و Ultra Quality میان همین دو قرار دارند",
      ],
    },
    active: "فعال",
    switchHint: "برای مقایسه لمس کنید",
  },
  safety: {
    eyebrow: "ایمنی سیستم",
    title: "تنظیم قاطع. همیشه قابل بازگشت.",
    desc: "تغییرات ویندوز در قالب یک تراکنش با بازگشت کامل اعمال می‌شوند — دانلودها با امضای HMAC و کوتاه‌مدت، و کنترل دسترسی پرمیوم سمت سرور.",
    optimizer: {
      eyebrow: "بهینه‌ساز ویندوز",
      title: "ویندوزی سریع‌تر، بدون آزمون‌وخطا.",
      desc: "رجیستری، سرویس‌ها و تسک‌های زمان‌بندی — هر تغییری که موتور Rust اعمال می‌کند داخل همان تراکنش اجرا می‌شود و کاملاً قابل بازگشت است.",
      stats: [
        { value: 235, suffix: "", label: "تست خودکار در CI" },
        { value: 151, suffix: "", label: "تست API" },
        { value: 48, suffix: "", label: "تست دسکتاپ" },
        { value: 36, suffix: "", label: "تست موتور Rust" },
      ],
      note: "فایل‌های اجرایی و اسکریپت‌ها هرگز نمی‌توانند وارد بسته شوند — فهرست مجاز در هر دو سمت اعمال می‌شود.",
    },
    backup: {
      eyebrow: "پشتیبان‌گیری و بازیابی",
      title: "هر تغییری، قابل بازگشت.",
      desc: "پیش از هر تغییری اسنپ‌شات کامل گرفته می‌شود. با یک کلیک همه‌چیز برمی‌گردد، در هر زمان.",
      steps: [
        { title: "اسنپ‌شات", desc: "پیش از هر تغییری، یک اسنپ‌شات کامل گرفته می‌شود" },
        { title: "اعمال", desc: "تغییرات در قالب یک تراکنش اجرا می‌شوند — همه یا هیچ" },
        { title: "بازگشت خودکار", desc: "اگر هر مرحله‌ای شکست بخورد، همه‌چیز کامل بازمی‌گردد" },
        { title: "بازیابی", desc: "با یک کلیک، سیستم به اسنپ‌شات برمی‌گردد — در هر زمان" },
      ],
    },
  },
  bench: {
    eyebrow: "بنچمارک",
    title: "اعداد، نه وعده.",
    desc: "فریم‌ساخت همراه با تنظیمات ویندوز — اثر ترکیبی، قبل و بعد از پی‌سی‌مکس روی میز آزمون ما اندازه‌گیری شده است.",
    avgLabel: "میانگین بهبود مشاهده‌شده",
    avg: "+34%",
    unit: "fps",
    beforeLabel: "قبل",
    afterLabel: "با PC MAX",
    viewAll: "مشاهده‌ی همه‌ی بنچمارک‌ها",
    viewLess: "نمایش کمتر",
    gamesNote: "جفت‌های هر بازی نمونه‌های نمایشی هستند؛ میانگین اعلام‌شده عدد اندازه‌گیری‌شده است.",
    games: [
      { name: "Cyberpunk 2077", before: 68, after: 94 },
      { name: "Alan Wake 2", before: 54, after: 76 },
      { name: "Black Myth: Wukong", before: 61, after: 83 },
      { name: "Starfield", before: 48, after: 66 },
      { name: "Baldur's Gate 3", before: 74, after: 96 },
      { name: "GTA V", before: 118, after: 144 },
    ],
    note: "میانه‌ی 3 اجرا · 1440p · میز آزمون RTX 4070 · فریم‌ساخت در صورت سازگاری · نتایج به سیستم شما بستگی دارد.",
  },
  social: {
    eyebrow: "اعتماد",
    title: "اعدادِ پشت پلتفرم.",
    desc: "شمار دانلودها از سوابق انتشار خودمان — به‌همراه حقایقی که می‌توانید در همین صفحه راستی‌آزمایی کنید.",
    stats: {
      downloads: { fallback: 293, suffix: "K+", label: "دانلود در همه‌ی نسخه‌ها" },
      releases: { fallback: 3, suffix: "", label: "نسخه‌ی پایدار عرضه‌شده" },
      tests: { value: 470, suffix: "", label: "تست خودکار" },
      telemetry: { value: 0, suffix: "", label: "تله‌متری در اپ دسکتاپ" },
    },
    trust: {
      title: "اعتماد، در طراحی",
      items: [
        { title: "هر نصب را راستی‌آزمایی کنید", desc: "هر نسخه به‌همراه نصب‌کننده و فایل امضایش در ریلیزهای گیت‌هاب منتشر می‌شود — پیش از اجرا، بیلد را بررسی کنید.", meta: "در کارت دانلود", href: "#download" },
        { title: "بدون تله‌متری", desc: "اپ دسکتاپ هیچ تحلیلی نمی‌فرستد و ردیاب ندارد. بهینه‌سازی‌ها کاملاً آفلاین اجرا می‌شوند.", meta: "", href: "" },
        { title: "تاریخچه‌ی باز", desc: "هر نسخه مستند و تاریخ‌دار است — قابلیت‌ها، بهبودها و رفع اشکال‌ها.", meta: "مشاهده‌ی تاریخچه", href: "#download" },
      ],
    },
    artifacts: {
      title: "به‌جای حرف، مدرک؟",
      changelog: "مشاهده‌ی تاریخچه تغییرات",
      benchmarks: "مشاهده‌ی بنچمارک‌ها",
    },
  },
  showcase: {
    eyebrow: "محصول",
    title: "کنسولِ رایانه‌ی شما.",
    desc: "اپلیکیشن دسکتاپ PC MAX — سطوح شیشه‌ای، بازتاب‌های ملایم و تب‌های زنده.",
    disclaimer: "پیش‌نمایش رابط کاربری — مقادیر نمایشی هستند.",
    /* کنترل چرخش خودکار (تعویض پنل هر ۱.۵ ثانیه) — توقف WCAG 2.2.2 */
    pauseAuto: "توقف چرخش خودکار",
    resumeAuto: "ادامه چرخش خودکار",
    tabs: {
      dashboard: "داشبورد",
      multiframe: "مولتی‌فریم",
      windows: "ویندوز بهینه",
      settings: "تنظیمات",
    },
    mf: {
      perGame: "پروفایل به‌ازای هر بازی",
      status: {
        installed: "نصب‌شده",
        ready: "آماده",
        incompatible: "ناسازگار",
      },
    },
    win: {
      applied: "بهینه‌سازی‌های اعمال‌شده",
      of: "از",
      modules: "ماژول",
      revert: "بازگردانی همه",
      services: "سرویس‌ها",
    },
    settings: {
      language: "زبان",
      profile: "پروفایل پیش‌فرض",
      telemetry: "تله‌متری",
      off: "خاموش",
    },
  },
  features: {
    eyebrow: "قابلیت‌ها",
    title: "شناسایی. بهینه‌سازی. محافظت.",
    desc: "سه اصل، یک پلتفرم — هر کاری پی‌سی‌مکس انجام می‌دهد در یکی از این سه جای می‌گیرد.",
    groups: [
      {
        icon: "cpu",
        title: "شناسایی",
        desc: "همه‌چیز با شناخت دقیق سیستم شما آغاز می‌شود.",
        items: [
          "تشخیص سخت‌افزار در موتور Rust — گرافیک، پردازنده و نمایشگر",
          "همگام‌سازی کاتالوگ بازی‌ها از سرور، با جست‌وجوی لحظه‌ای و فیلترها",
          "به‌روزرسانی نسخه‌دار پروفایل‌ها، با نشان «بهینه‌سازی جدید»",
        ],
      },
      {
        icon: "performance",
        title: "بهینه‌سازی",
        desc: "تغییر درست، به‌ازای هر بازی. نه کمتر، نه بیشتر.",
        items: [
          "تنظیم ویندوز برای بازی: رجیستری، سرویس‌ها و تسک‌های زمان‌بندی",
          "پروفایل به‌ازای هر بازی — Maximum FPS، Balanced، High Quality و Ultra Quality",
          "Target FPS و سطح سخت‌افزار برای هر پروفایل — تنظیمات گروه‌بندی‌شده",
        ],
      },
      {
        icon: "shield",
        title: "محافظت",
        desc: "هر تغییری قابل بازگشت است. این طراحی است، نه قابلیت.",
        items: [
          "اسنپ‌شات کامل پیش از هر تغییر و بازگشت با یک کلیک",
          "تغییرات ویندوز در قالب یک تراکنش — بازگشت کامل در صورت شکست",
          "فایل اجرایی و اسکریپت در بسته‌ها ممنوع؛ کنترل پرمیوم سمت سرور",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "سوالات متداول",
    title: "سوال‌ها، پاسخ‌ها.",
    desc: "پنج سوال اصلی — فقط حقایق فنی.",
    core: [
      {
        q: "پی‌سی‌مکس واقعاً فریم را بهتر می‌کند؟",
        a: "بله — از دو مسیر: تنظیم ویندوز (استارت‌آپ، حافظه، انرژی، سرویس‌ها) و جریان‌های کاری فریم‌ساخت به‌ازای هر بازی. میانگین ترکیبی روی میز آزمون ما +34٪ است — میانه‌ی 3 اجرای اندازه‌گیری‌شده. نتایج به سیستم شما بستگی دارد.",
      },
      {
        q: "می‌توانم تغییرات را برگردانم؟",
        a: "همه‌چیز قابل بازگشت است. پیش از هر تغییری از فایل‌ها و تنظیمات مرتبط اسنپ‌شات گرفته می‌شود، پس از بهینه‌سازی صحت آن راستی‌آزمایی می‌شود و با یک کلیک — در هر زمان — به نقطه‌ی بازیابی برمی‌گردید.",
      },
      {
        q: "پی‌سی‌مکس دقیقاً چه چیزهایی را تغییر می‌دهد؟",
        a: "تنظیمات ویندوز (استارت‌آپ، طرح انرژی، سرویس‌ها، مدیریت حافظه) و — فقط وقتی برای بازی‌ای جریان کاری نصب کنید — فایل‌های مقیاس‌بندی و فریم‌ساخت همان بازی، همیشه پس از پشتیبان‌گیری خودکار. بدون هک هسته، بدون جایگزینی درایور.",
      },
      {
        q: "کدام کارت‌های گرافیکی پشتیبانی می‌شوند؟",
        a: "هر کارت گرافیکی سازگار با DirectX 12 از بهینه‌سازی ویندوز بهره می‌برد. فریم‌ساخت آگاه از سخت‌افزار است: اپتی‌اسکیلر گسترده است، AI Optical Flow به RTX 20 و بالاتر و Streamline به RTX 40/50 نیاز دارد. نصب‌کننده فقط مسیرهای پشتیبانی‌شده‌ی سخت‌افزار شما را پیشنهاد می‌دهد.",
      },
      {
        q: "وضعیت ضدچیت‌ها چیست؟",
        a: "پی‌سی‌مکس هیچ چیزی داخل بازی تزریق نمی‌کند و به سیستم‌های ضدچیت دست نمی‌زند. ویندوز را بهینه می‌کند و فایل‌های مستند مقیاس‌بندی را به‌ازای هر بازی نصب می‌کند — همان فایل‌هایی که راستی‌آزمایی فایل Steam می‌تواند بازیابی کند. با این حال توصیه می‌کنیم ابتدا در مسابقات غیررتبه‌ای آزمایش کنید؛ سیاست‌ها را ناشر هر بازی تعیین می‌کند.",
      },
    ],
    fullLabel: "همه‌ی سوالات",
    full: [
      {
        q: "آیا اشتراک یا هزینه‌ای دارد؟",
        a: "اپ اصلی رایگان است. ورود با ایمیل و رمز عبور، کاتالوگ شما را همگام نگه می‌دارد؛ برخی قابلیت‌های ویژه اشتراکی‌اند و سمت سرور کنترل می‌شوند.",
      },
      {
        q: "بدون اینترنت کار می‌کند؟",
        a: "بله — اپ آفلاین-محور است: با آخرین کاتالوگ و پروفایل‌های همگام‌شده کار می‌کند و با آنلاین شدن، خودکار دوباره همگام می‌شود. اینترنت فقط برای اولین همگام‌سازی، به‌روزرسانی‌ها و دانلود بسته‌ها لازم است.",
      },
      {
        q: "کدام نسخه‌های ویندوز پشتیبانی می‌شوند؟",
        a: "ویندوز 10 (64بیتی) و ویندوز 11. برخی بهینه‌سازی‌ها مخصوص هر نسخه هستند؛ پی‌سی‌مکس نسخه‌ی ویندوز شما را تشخیص می‌دهد و خودکار تنظیم می‌شود.",
      },
      {
        q: "اپتی‌اسکیلر (OptiScaler) چیست؟",
        a: "اپتی‌اسکیلر یک لایه‌ی یکپارچه‌سازی متن‌باز است که به بازی‌ها اجازه می‌دهد از مقیاس‌بندهای مدرن — مثل DLSS، FSR و XeSS — انعطاف‌پذیرتر روی کارت‌های گرافیکی مختلف استفاده کنند. پی‌سی‌مکس آن را برای شما، به‌ازای هر بازی، همراه با پشتیبان‌گیری خودکار نصب و نگه‌داری می‌کند.",
      },
      {
        q: "AI Optical Flow چیست؟",
        a: "تکنیکی در فریم‌ساخت که حرکت میان فریم‌های رندرشده را تحلیل می‌کند و فریم‌های میانی جدید می‌سازد. پشتیبانی آن به نسل RTX شما بستگی دارد — نصب‌کننده سخت‌افزار شما را شناسایی می‌کند و فقط مسیرهای سازگار را پیشنهاد می‌دهد.",
      },
      {
        q: "پی‌سی‌مکس فایل‌های بازی را تغییر می‌دهد؟",
        a: "فقط وقتی که برای آن بازی جریان کاری فریم‌ساخت نصب کنید — و همیشه پس از پشتیبان‌گیری خودکار. راستی‌آزمایی فایل Steam هم بعد از آن به‌درستی کار می‌کند.",
      },
    ],
    stillHave: {
      title: "هنوز سوال دارید؟",
      desc: "سوال‌تان را در دیسکورد بپرسید — یا برایمان ایمیل بفرستید.",
      cta: "عضویت در دیسکورد",
    },
  },
  cta: {
    title: "رایانه‌ی شما. در اوج.",
    sub: "پی‌سی‌مکس را دانلود کنید و ماشین خود را برای بهترین فریم‌های ممکنش آماده کنید.",
    button: "دانلود PC MAX",
    buttonBusy: "در حال دریافت آخرین نسخه…",
    meta: "دانلود رایگان · ویندوز 10/11 · 64بیتی",
    versionLabel: "آخرین نسخه",
    sizeLabel: "نصب‌کننده",
    releasedLabel: "انتشار",
    sourceLabel: "منبع",
    requirements: {
      os: "سیستم‌عامل",
      osValue: "ویندوز 10 / 11 · 64بیتی",
      arch: "معماری",
      archValue: "x64",
      ram: "حافظه",
      ramValue: "حداقل 4 گیگ · پیشنهادی 8 گیگ",
      disk: "فضای دیسک",
      diskValue: "220 مگابایت",
      gpu: "گرافیک",
      gpuValue: "کارت گرافیکی سازگار با DirectX 12",
    },
    editions: {
      free: {
        name: "PC MAX",
        badge: "فعلی",
        price: "رایگان",
        tagline: "همه‌چیزِ همین صفحه. تمام بهینه‌سازی‌ها، تمام جریان‌های کاری.",
      },
      pro: {
        name: "PC MAX Pro",
        badge: "به‌زودی",
        price: "—",
        tagline: "پروفایل‌های اولویت‌دار، تنظیم هوش مصنوعی و جریان‌های کاری زودهنگام — برای حرفه‌ای‌ها.",
        cta: "عضویت در لیست انتظار",
      },
    },
    changelog: {
      title: "چه چیزی جدید است",
      viewOnGithub: "مشاهده در گیت‌هاب",
      error: "تاریخچه تغییرات در حال حاضر در دسترس نیست.",
      empty: "هنوز یادداشتی برای نسخه‌ها ثبت نشده است.",
    },
    /* خاستگاه انتشار — جایگزین ردیف SHA-256 artifact محلی (تسک ۳۲):
     * نصب‌کننده اکنون از ریلیزهای رسمی گیت‌هاب مخزن اپ توزیع می‌شود؛
     * صادقانه‌ترین سیگنال قابل‌راستی‌آزمایی، خودِ منبع است. */
    source: {
      label: "انتشار رسمی",
      value: "github.com/CiaNetIR/pc-max",
      note: "دکمه همیشه جدیدترین نسخه را به‌صورت زنده از گیت‌هاب می‌گیرد.",
    },
    /* ردیف چک‌سام — SHA-256 واقعی، اندازه‌گیری‌شده از خودِ آرتیفکت
     * منتشرشده (تسک ۳۵). فقط وقتی نمایش داده می‌شود که دانلود دقیقاً
     * همان نسخه را سرو کند؛ به نسخه گره خورده، نه ادعای کلی. */
    verify: {
      label: "راستی‌آزمایی این دانلود",
      copy: "کپی",
      copied: "SHA-256 کپی شد",
      copyFailed: "چک‌سام را انتخاب و دستی کپی کنید",
      note: "اندازه‌گیری‌شده از نصب‌کننده‌ی منتشرشده — در پاورشل با Get-FileHash -Algorithm SHA256 مقایسه کنید",
    },
    waitlist: {
      title: "پرو را زودتر بگیرید",
      desc: "یک ایمیل هنگام عرضه‌ی Pro. همین — هیچ چیز دیگری.",
      placeholder: "you@example.com",
      emailLabel: "نشانی ایمیل شما",
      button: "خبرم کن",
      success: "در لیست هستید.",
      successDesc: "به‌محض عرضه‌ی PC MAX Pro به شما ایمیل می‌زنیم.",
      duplicate: "قبلاً در لیست هستید — منتظر روز عرضه هستیم.",
      error: "ثبت‌نام انجام نشد — آدرس را بررسی و دوباره تلاش کنید.",
      /* در نسخهٔ استاتیک GitHub Pages به‌جای فرم نمایش داده می‌شود. */
      staticNote:
        "لیست انتظار در نسخهٔ کامل سایت فعال است — این نسخهٔ استاتیک GitHub Pages ثبت‌نام نمی‌پذیرد. تا آن موقع، نسخه‌ها را در گیت‌هاب دنبال کنید.",
    },
    bottomBar: {
      label: "دانلود PC MAX",
      note: "رایگان · ویندوز 10 / 11 · x64",
      close: "بستن",
    },
  },
  footer: {
    tagline: "بهینه‌سازی حرفه‌ای بازی روی ویندوز.",
    product: "محصول",
    community: "کامیونیتی",
    support: "پشتیبانی",
    legal: "قانونی",
    communityLinks: [
      { label: "دیسکورد", href: "https://discord.gg/pcmax" },
      { label: "تلگرام", href: "https://t.me/pcmaxapp" },
    ],
    supportLinks: [
      { label: "support@pcmax.io", href: "mailto:support@pcmax.io" },
      { label: "bugs@pcmax.io", href: "mailto:bugs@pcmax.io" },
    ],
    privacy: "سیاست حریم خصوصی",
    terms: "شرایط استفاده",
    privacyBody: "پی‌سی‌مکس آفلاین-محور کار می‌کند. هیچ داده‌ی شخصی‌ای جمع‌آوری، ذخیره یا منتقل نمی‌شود. این وب‌سایت فقط رویدادهای تجمیعی و بی‌نام (بازدید صفحه، شمار دانلود) را ثبت می‌کند؛ بدون هیچ شناسه‌ای. اپلیکیشن دسکتاپ تله‌متری صفر دارد. ایمیل‌های ثبت‌شده در لیست انتظار فقط برای اطلاع‌رسانی عرضه‌ی Pro استفاده می‌شوند و نه چیز دیگری.",
    termsBody: "پی‌سی‌مکس رایگان و «همین‌طور که هست» و بدون ضمانت ارائه می‌شود. مسئولیت نگه‌داری پشتیبان با شماست؛ اپ خودکار این کار را انجام می‌دهد اما راستی‌آزمایی عادت خوبی است. اپتی‌اسکیلر تحت مجوز متن‌باز خودش استفاده می‌شود. پی‌سی‌مکس وابسته به NVIDIA، مایکروسافت، Valve یا هیچ ناشر بازی نیست.",
    platformItems: ["ویندوز 10 و 11", "معماری x64", "آفلاین‌پذیر", "بدون تله‌متری"],
    rights: "© {year} پی‌سی‌مکس. تمامی حقوق محفوظ است.",
    disclaimer: "پی‌سی‌مکس محصولی مستقل است و وابسته به NVIDIA، مایکروسافت یا هیچ ناشر بازی نیست.",
    madeFor: "ساخته‌شده برای ویندوز 10 و 11",
  },
  common: {
    switchTo: "English",
    skipToContent: "پرش به محتوای اصلی",
  },
  error404: {
    title: "در بهینه‌سازی گم شدید.",
    sub: "صفحه‌ای که دنبالش بودید وجود ندارد. بیایید به فریم‌های نرم‌تر برگردیم.",
    cta: "بازگشت به خانه",
  },
  errorPage: {
    title: "یک اختلال کوچک رخ داد.",
    sub: "این بخش بارگذاری نشد. دوباره تلاش کنید.",
    retry: "تلاش مجدد",
  },
};

export const dictionary: Record<Locale, Dictionary> = { en, fa };
