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
  probe.style.minHeight = '0';
  probe.style.maxHeight = 'none';
  probe.style.overflow = 'visible';
  probe.style.display = 'block';
  probe.style.whiteSpace = 'normal';
  probe.classList.remove('clamped');
  container.parentElement?.appendChild(probe);
  return probe;
}

function lineLimitHeight(container: HTMLElement, maxLines: number): number {
  const style = getComputedStyle(container);
  let lineHeight = parseFloat(style.lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    const fontSize = parseFloat(style.fontSize) || 16;
    lineHeight = fontSize * 1.4;
  }
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

function appendMoreButton(
  probe: HTMLElement,
  container: HTMLElement,
  moreLabel: string,
  moreClassName: string
) {
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
  btn.style.display = 'inline';
  btn.style.whiteSpace = 'nowrap';
  btn.style.padding = '0';
  btn.style.border = 'none';
  btn.style.background = 'none';
  btn.style.verticalAlign = 'baseline';
  probe.append(btn);
}

/**
 * Find the longest word-boundary prefix of `text` that still fits in `maxLines`
 * when rendered with `moreLabel` inline at the end of the last line (not alone
 * on a following line).
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
  if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
    return truncateAtWord(text, 220);
  }

  const probe = measureProbe(container);

  const fits = (candidate: string) => {
    if (!candidate) return true;

    probe.replaceChildren();
    probe.append(document.createTextNode(candidate));
    const textOnlyHeight = probe.scrollHeight;

    probe.replaceChildren();
    probe.append(document.createTextNode(`${candidate} `));
    appendMoreButton(probe, container, moreLabel, moreClassName);
    const withMoreHeight = probe.scrollHeight;

    if (withMoreHeight > maxHeight) return false;
    // Reject when "...more" wraps onto its own new line below the text.
    if (withMoreHeight > textOnlyHeight + 1) return false;
    return true;
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

/**
 * True when the inline "...more" button sits on a lower line than the last
 * text character (i.e. it wrapped alone instead of ending the last content line).
 */
export function moreButtonOnOwnLine(container: HTMLElement): boolean {
  const btn = container.querySelector('button');
  if (!btn) return false;

  const textNode = Array.from(container.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim()
  );
  if (!textNode?.textContent) return false;

  const text = textNode.textContent;
  let end = text.length;
  while (end > 0 && /\s/.test(text[end - 1] || '')) end -= 1;
  if (end <= 0) return false;

  const range = document.createRange();
  range.setStart(textNode, end - 1);
  range.setEnd(textNode, end);
  const textTop = range.getBoundingClientRect().top;
  const btnTop = btn.getBoundingClientRect().top;
  return btnTop > textTop + 2;
}

/**
 * Like truncateToFitLines, but binary-searches against the live DOM node that
 * already contains the "...more" button — matches first-paint fonts/width.
 */
export function truncateToFitLinesLive(
  container: HTMLElement,
  text: string,
  maxLines: number
): string {
  if (!text) return '';
  if (!container.getBoundingClientRect().width) return truncateAtWord(text, 220);

  const maxHeight = lineLimitHeight(container, maxLines);
  if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
    return truncateAtWord(text, 220);
  }

  const btn = container.querySelector('button');
  let textNode = Array.from(container.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE
  ) as Text | undefined;

  if (!textNode) {
    textNode = document.createTextNode('');
    if (btn) container.insertBefore(textNode, btn);
    else container.appendChild(textNode);
  }

  const previous = textNode.textContent;

  const fits = (candidate: string) => {
    textNode!.textContent = candidate ? `${candidate} ` : '';
    if (container.scrollHeight > maxHeight) return false;
    if (btn && moreButtonOnOwnLine(container)) return false;
    return true;
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

  const result = truncateAtWord(text, best);
  textNode.textContent = previous;
  return result;
}
