/** Marble / plate overlap into the footer wave (Footer.png transparent band). */
export const FOOTER_WAVE_MARBLE_PX = 165;

const MIN_BG_HEIGHT = 600;

/** Footer may live inside the shell or globally in `app/layout.tsx`. */
export function resolvePageFooter(shell: HTMLElement): HTMLElement | null {
  const inShell = shell.querySelector('footer.footer-bg');
  if (inShell instanceof HTMLElement) return inShell;
  const global = document.querySelector('footer.footer-bg');
  return global instanceof HTMLElement ? global : null;
}

/**
 * Height for a repeat-y background layer anchored to `shell` top.
 * Extends through main content and into the footer wave overlap zone.
 *
 * Uses layout boxes only — never `scrollHeight`, which includes the absolute
 * bg itself and can create a feedback loop / nested scrollport.
 */
export function measurePageBackgroundHeight(shell: HTMLElement): number {
  let h = 0;

  const footer = resolvePageFooter(shell);
  if (footer) {
    const shellTop = shell.getBoundingClientRect().top + window.scrollY;
    const footerTop = footer.getBoundingClientRect().top + window.scrollY;
    h = Math.max(h, footerTop - shellTop + FOOTER_WAVE_MARBLE_PX);
  }

  const main = shell.querySelector('main');
  if (main instanceof HTMLElement) {
    h = Math.max(h, main.offsetTop + main.offsetHeight);
  }

  return Math.max(h, shell.offsetHeight, MIN_BG_HEIGHT);
}
