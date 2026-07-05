// Pure display formatters (unit-tested, no DOM / locale-independent branches).

export function formatRul(days: number | null | undefined): string {
  if (days === null || days === undefined) return "\u2014";
  if (days <= 0) return "Overdue";
  if (days < 1) return "<1 day";
  if (days < 45) return `${Math.round(days)} days`;
  if (days < 365) return `~${Math.round(days / 30)} months`;
  return `~${(days / 365).toFixed(1)} years`;
}

export function formatShi(shi: number | null | undefined): string {
  if (shi === null || shi === undefined) return "\u2014";
  return Math.round(shi).toString();
}

export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "\u2014";
  return `${Math.round(n)}%`;
}

export function formatConfidence(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function titleCase(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDefectType(value: string): string {
  return titleCase(value);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString();
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "\u2014";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
