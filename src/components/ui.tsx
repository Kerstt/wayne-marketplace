import Link from "next/link";
import { formatPrice } from "@/lib/format";

/** Yellow "price sticker". Free items get a green sticker. */
export function PriceTag({
  price,
  size = "md",
  className = "",
  testId,
}: {
  price: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  testId?: string;
}) {
  const free = Number(price) === 0;
  const sizes = {
    sm: "px-2 py-0.5 text-[12px]",
    md: "px-2.5 py-1 text-[14px]",
    lg: "px-4 py-1.5 text-[22px]",
  };
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-tight shadow-[var(--shadow-sticker)] ${sizes[size]} ${
        free ? "bg-leaf text-white" : "bg-sun text-ink"
      } ${className}`}
    >
      <span aria-hidden className={`rounded-full ${free ? "bg-white/70" : "bg-ink/70"} ${size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5"}`} />
      {formatPrice(price)}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Wayne Market home" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition group-hover:bg-accent">
        <span className="font-serif text-[22px] italic leading-none">W</span>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent group-hover:bg-sun" />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-serif text-[26px] leading-none tracking-tight">Wayne</span>
        <span className="eyebrow text-ink-3">Market</span>
      </span>
    </Link>
  );
}

export function Avatar({
  label,
  seed,
  size = 40,
  className = "",
}: {
  label: string;
  /** Stable string for the colour (use the email so a person looks the same everywhere). */
  seed?: string;
  size?: number;
  className?: string;
}) {
  const palette = ["#FF5A1F", "#1E6B4A", "#3E5BA9", "#B5447A", "#C98A12", "#5A4FCF"];
  const hash = [...(seed ?? label)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, backgroundColor: palette[hash % palette.length], fontSize: size * 0.48 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-serif italic leading-none text-white ${className}`}
    >
      {(label.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-3 hover:border-ink-3 focus:border-ink focus:ring-4 focus:ring-accent/15";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition hover:bg-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-card px-5 py-3 text-[15px] font-semibold text-ink transition hover:border-ink active:scale-[0.98] disabled:opacity-50";
