/** Singular / plural labels for listing counts (1 → singular). */
export function catalogCountLabel(count: number, singular: string, plural: string): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${n} ${n === 1 ? singular : plural}`;
}
