export function formatPrice(price: number) {
  if (Number(price) === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number(price) % 1 === 0 ? 0 : 2,
  }).format(Number(price));
}

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = Math.max(diff, 0);
  for (const [step, unit] of units) {
    if (value < step) {
      const n = Math.floor(value);
      if (unit === "second") return "just now";
      return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
    }
    value /= step;
  }
  return "";
}
