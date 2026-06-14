export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function countWhere<T>(
  items: T[],
  predicate: (item: T) => boolean,
): number {
  return items.filter(predicate).length;
}

export function countByField<T>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function countInLastDays(
  items: { created_at: string }[],
  days: number,
  now = Date.now(),
): number {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => new Date(item.created_at).getTime() >= cutoff).length;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(unitIndex === 0 ? 0 : 1) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function durationHours(
  startIso: string | null,
  endIso: string | null,
): number | null {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 0) return null;
  return ms / (1000 * 60 * 60);
}
