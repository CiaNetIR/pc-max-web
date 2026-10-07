/* Task 44 — the PC MAX visual signature: the "frame progression" motif.
 *
 * Three ascending bars — the frame rate climbing, the system reaching
 * its MAX. The two shorter bars are the neutral current-color (inherits
 * text color at reduced opacity), the tallest bar is always crimson:
 * one controlled accent, repeated site-wide (kickers, separators,
 * footer, navbar hover) so the brand reads as a system, not a skin.
 *
 * Brand marks do not mirror in RTL — the ascent is abstract geometry,
 * like the logo it accompanies. Purely decorative: always aria-hidden.
 */
export function Motif({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <rect x="1.5" y="9" width="3" height="6" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="6.5" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.75" />
      <rect x="11.5" y="1" width="3" height="14" rx="1" fill="#e50914" />
    </svg>
  );
}
