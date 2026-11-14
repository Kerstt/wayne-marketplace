export function formatPrice(price: number) {
  if (Number(price) === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number(price) % 1 === 0 ? 0 : 2,
  }).format(Number(price));
}

const STEPS: [number, string, string][] = [
  [60, "second", "s"],
  [60, "minute", "m"],
  [24, "hour", "h"],
  [7, "day", "d"],
  [4.345, "week", "w"],
  [12, "month", "mo"],
  [Number.POSITIVE_INFINITY, "year", "y"],
];

function ago(iso: string, short: boolean) {
  let value = Math.max((Date.now() - new Date(iso).getTime()) / 1000, 0);
  for (const [step, unit, abbr] of STEPS) {
    if (value < step) {
      const n = Math.floor(value);
      if (unit === "second") return short ? "now" : "just now";
      return short ? `${n}${abbr}` : `${n} ${unit}${n === 1 ? "" : "s"} ago`;
    }
    value /= step;
  }
  return "";
}

/** "3 hours ago" */
export const timeAgo = (iso: string) => ago(iso, false);
/** "3h" */
export const shortAgo = (iso: string) => ago(iso, true);
