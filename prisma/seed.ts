/* Seed: PC MAX releases + changelog history (LEGACY data source).
 * Run: bun prisma/seed.ts
 *
 * Task 32: the website UI now reads release facts from the app repo's real
 * GitHub Releases (src/lib/app-release.ts); this seed only feeds the
 * legacy /api/release + /api/changelog routes and the /api/download
 * fallback — kept for external consumers, not the marketing surface. */
import { PrismaClient } from "@prisma/client";
import { INSTALLER_FILE } from "../src/lib/gh-pages";

/* Version of the local demo artifact tracked by INSTALLER_FILE (the file
 * the /api/download route streams). */
const APP_VERSION = "2.4.1";

const db = new PrismaClient();

async function main() {
  // wipe (idempotent re-runs)
  await db.eventLog.deleteMany();
  await db.changelogEntry.deleteMany();
  await db.release.deleteMany();
  await db.waitlistSubscriber.deleteMany();

  await db.release.createMany({
    data: [
      {
        version: APP_VERSION,
        channel: "stable",
        fileName: INSTALLER_FILE,
        notes: "Streamline guardrails for Blackwell, faster Epic detection",
        releasedAt: new Date("2025-11-18T10:00:00Z"),
        downloads: 128450,
      },
      {
        version: "2.4.0",
        channel: "stable",
        fileName: "PCMAX-Setup-2.4.0-x64.exe",
        notes: "Smart Profiles, verified backup timeline",
        releasedAt: new Date("2025-10-29T10:00:00Z"),
        downloads: 94210,
      },
      {
        version: "2.3.2",
        channel: "stable",
        fileName: "PCMAX-Setup-2.3.2-x64.exe",
        notes: "Faster standby memory trim, GOG icon fix",
        releasedAt: new Date("2025-09-14T10:00:00Z"),
        downloads: 71008,
      },
    ],
  });

  await db.changelogEntry.createMany({
    data: [
      // 2.4.1
      { version: "2.4.1", tag: "feature", text: "Streamline guardrails for RTX 50 (Blackwell) GPUs", sort: 1 },
      { version: "2.4.1", tag: "improvement", text: "Faster EXE detection for Epic Games installs", sort: 2 },
      { version: "2.4.1", tag: "fix", text: "Fixed a rare crash when scanning libraries on network drives", sort: 3 },
      // 2.4.0
      { version: "2.4.0", tag: "feature", text: "Smart Profiles — Yellow (quality) and Green (performance) per game", sort: 1 },
      { version: "2.4.0", tag: "feature", text: "Backup timeline with integrity verification", sort: 2 },
      { version: "2.4.0", tag: "improvement", text: "40% faster standby memory trim", sort: 3 },
      { version: "2.4.0", tag: "fix", text: "Power plan switching on Windows 11 24H2", sort: 4 },
      // 2.3.2
      { version: "2.3.2", tag: "improvement", text: "Standby memory trim rewritten — 40% faster", sort: 1 },
      { version: "2.3.2", tag: "fix", text: "Resolved icon extraction for GOG titles", sort: 2 },
      { version: "2.3.2", tag: "fix", text: "Startup manager now respects delayed-launch entries", sort: 3 },
    ],
  });

  console.log("Seed OK:", await db.release.count(), "releases,", await db.changelogEntry.count(), "changelog entries");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
