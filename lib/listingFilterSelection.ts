/** One active id per filter category — tap again to clear. */
export function selectSingleFilterId(prev: string[], id: string): string[] {
  return prev.includes(id) ? [] : [id];
}
