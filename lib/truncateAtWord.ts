/** Truncate plain text at a word boundary (for inline “…more” clamps). */
export function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '');
}

function measureProbe(container: HTMLElement): HTMLElement {
  const width = container.getBoundingClientRect().width;
  const probe = container.cloneNode(false) as HTMLElement;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.width = width ? `${width}px` : '';
  probe.style.minHeight = '';
  probe.style.maxHeight = '';
  probe.style.overflow = 'visible';
  container.parentElement?.appendChild(probe);
  return probe;
}

function lineLimitHeight(container: HTMLElement, maxLines: number): number {
  const lineHeight = parseFloat(getComputedStyle(container).lineHeight);
  return lineHeight * maxLines + 1;
}

/** True when plain `text` wraps to more than `maxLines` at the container width. */
export function textExceedsLines(
  container: HTMLElement,
  text: string,
  maxLines: number
): boolean {
  if (!text) return false;
  const width = container.getBoundingClientRect().width;
  if (!width) return false;

  const probe = measureProbe(container);
  probe.textContent = text;
  const exceeds = probe.scrollHeight > lineLimitHeight(container, maxLines);
  probe.remove();
  return exceeds;
}

/**
 * Find the longest word-boundary prefix of `text` that still fits in `maxLines`
 * when rendered with `moreLabel` inline immediately after (no float gap).
 */
export function truncateToFitLines(
  container: HTMLElement,
  text: string,
  maxLines: number,
  moreLabel: string,
  moreClassName = 'cld-description-more'
): string {
  if (!text) return '';
  const width = container.getBoundingClientRect().width;
  if (!width) return truncateAtWord(text, 220);

  const maxHeight = lineLimitHeight(container, maxLines);
  const probe = measureProbe(container);

  const fits = (candidate: string) => {
    probe.replaceChildren();
    probe.append(document.createTextNode(`${candidate} `));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = moreClassName;
    btn.textContent = moreLabel;
    const containerStyle = getComputedStyle(container);
    btn.style.fontFamily = containerStyle.fontFamily;
    btn.style.fontSize = containerStyle.fontSize;
    btn.style.fontWeight = containerStyle.fontWeight;
    btn.style.lineHeight = containerStyle.lineHeight;
    btn.style.letterSpacing = containerStyle.letterSpacing;
    probe.append(btn);
    return probe.scrollHeight <= maxHeight;
  };

  let lo = 0;
  let hi = text.length;
  let best = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = truncateAtWord(text, mid);
    if (fits(candidate)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  probe.remove();
  return truncateAtWord(text, best);
}
