import type { ComponentType, SVGProps } from "react";
import {
  Cpu as LucideCpu,
  DatabaseBackup,
  Download as LucideDownload,
  Fan as LucideFan,
  FolderOpen,
  Gamepad2,
  Gauge,
  Gpu as LucideGpu,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type IconProps = SVGProps<SVGSVGElement>;

/*
 * Premium icon system — powered by Lucide (lucide.dev), the industry standard
 * for crisp 24×24 stroke icons. One consistent stroke grammar across the whole
 * site: same viewBox, same caps/joins, scale-perfect at any size.
 * Brand marks (Windows logo, PC MAX logo) are crafted in-house.
 */

/* ------------------------------- GPU -------------------------------- */

export const GpuIcon = LucideGpu as ComponentType<IconProps>;

/* ------------------------------- CPU -------------------------------- */

export const CpuIcon = LucideCpu as ComponentType<IconProps>;

/* ------------------------------- Fan -------------------------------- */

export const FanIcon = LucideFan as ComponentType<IconProps>;

/* ----------------------------- Windows ------------------------------ */

/** Official-style Windows 4-pane mark (brand glyph, drawn in-house) */
export function WindowsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M3 4.5 10.6 3.46v7.54H3zM11.6 3.32 21 2v9H11.6zM3 12h7.6v7.54L3 18.5zM11.6 12H21v9l-9.4-1.32z" />
    </svg>
  );
}

/* ------------------------------ Shield ------------------------------ */

export const ShieldIcon = ShieldCheck as ComponentType<IconProps>;

/* ------------------------------ Folder ------------------------------ */

export const FolderIcon = FolderOpen as ComponentType<IconProps>;

/* ----------------------------- Download ----------------------------- */

export const DownloadIcon = LucideDownload as ComponentType<IconProps>;

/* ----------------------------- Settings ----------------------------- */

export const SettingsIcon = Settings2 as ComponentType<IconProps>;

/* ----------------------------- Gamepad ------------------------------ */

export const GamepadIcon = Gamepad2 as ComponentType<IconProps>;

/* ---------------------------- Performance --------------------------- */

export const PerformanceIcon = Gauge as ComponentType<IconProps>;

/* -------------------------------- AI --------------------------------- */

export const AiIcon = Sparkles as ComponentType<IconProps>;

/* ------------------------------ Backup ------------------------------ */

export const BackupIcon = DatabaseBackup as ComponentType<IconProps>;

/* ------------------------------ Logo -------------------------------- */

/** PC MAX brand mark — layered silicon die with three cores */
export function LogoMark({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <rect x="2.5" y="4" width="19" height="16" rx="4.5" />
      <circle cx="7.1" cy="12" r="2.1" />
      <circle cx="12" cy="12" r="2.1" />
      <circle cx="16.9" cy="12" r="2.1" />
      <circle cx="7.1" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="16.9" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ------------------------------ Icon map ----------------------------- */

export const iconMap: Record<string, ComponentType<IconProps>> = {
  gpu: GpuIcon,
  cpu: CpuIcon,
  fan: FanIcon,
  windows: WindowsIcon,
  shield: ShieldIcon,
  folder: FolderIcon,
  download: DownloadIcon,
  settings: SettingsIcon,
  gamepad: GamepadIcon,
  performance: PerformanceIcon,
  ai: AiIcon,
  backup: BackupIcon,
};
