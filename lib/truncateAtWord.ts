/** Truncate plain text at a word boundary (for inline “…more” clamps). */
export function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '');
}

/**
 * Find the longest word-boundary prefix of `text` that still fits in `maxLines`
 * when rendered with `moreLabel` inline immediately after (no float gap).
 */
export function truncateToFitLines(
  container: HTMLElement,
  text: string,
  maxLines: number,
  moreLabel: string
): string {
  if (!text) return '';
  const width = container.getBoundingClientRect().width;
  if (!width) return truncateAtWord(text, 220);

  const lineHeight = parseFloat(getComputedStyle(container).lineHeight);
  const maxHeight = lineHeight * maxLines + 1;

  const probe = container.cloneNode(false) as HTMLElement;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.width = `${width}px`;
  probe.style.minHeight = '';
  probe.style.maxHeight = '';
  probe.style.overflow = 'visible';
  container.parentElement?.appendChild(probe);

  const fits = (candidate: string) => {
    probe.replaceChildren();
    probe.append(document.createTextNode(`${candidate} `));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cld-description-more';
    btn.textContent = moreLabel;
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
