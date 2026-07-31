/**
 * Narrowing a list of collections by a typed query.
 *
 * All that remains of a larger module that also placed an anchored menu beside a per-card button.
 * That menu is gone — selection is the single way films are gathered — and its placement maths went
 * with it rather than sitting unused.
 */

/**
 * Filters collections by name.
 *
 * Case-insensitive and trimmed, matching anywhere in the name rather than only the start: someone
 * looking for "Saturday nights" is as likely to type "nights".
 */
export function filterByName<T extends { name: string }>(
  items: readonly T[],
  query: string | null | undefined,
): readonly T[] {
  const needle = (query ?? '').trim().toLowerCase();
  if (!needle) return items;

  return items.filter((item) => item.name.toLowerCase().includes(needle));
}
