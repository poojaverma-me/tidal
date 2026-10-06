export const pct = (p: number) => `${Math.round(p * 100)}%`;
export const usd = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(5)}` : n < 100 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`);
export const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);
export const age = (min: number) => (min < 1 ? "now" : min < 60 ? `${min}m` : min < 60 * 24 ? `${Math.floor(min / 60)}h` : `${Math.floor(min / 1440)}d`);
export const initials = (s: string) =>
  s
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
export const PRIORITY = ["P4", "P3", "P2", "P1"];
export const priorityLabel = (p?: number) => (p === undefined ? "—" : PRIORITY[Math.min(3, Math.max(0, Math.round(p)))]);
export const priorityColor = (p?: number) => (p === undefined ? "var(--ink-3)" : p >= 2.5 ? "var(--red)" : p >= 1.6 ? "var(--orange)" : p >= 0.8 ? "#007AFF" : "var(--ink-3)");
