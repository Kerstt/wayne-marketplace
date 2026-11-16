import Link from "next/link";
import { ArrowRight, LayoutGrid, Rows3, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { Listing } from "@/lib/types";
import { FeaturedCard, ListingCard, ListingRow } from "@/components/ListingCard";
import { CategoryIcon } from "@/components/CategoryIcon";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string; view?: string; sort?: string }>;

const SORTS: Record<string, { label: string; column: string; ascending: boolean }> = {
  newest: { label: "Newest", column: "created_at", ascending: false },
  "price-asc": { label: "Price ↑", column: "price", ascending: true },
  "price-desc": { label: "Price ↓", column: "price", ascending: false },
};

const SUGGESTIONS = ["bike", "sofa", "guitar", "macbook", "free"];

function buildHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const category = getCategory(sp.category ?? "") ? sp.category : undefined;
  const cat = category ? getCategory(category) : undefined;
  const view = sp.view === "list" ? "list" : "grid";
  const sortKey = sp.sort && SORTS[sp.sort] ? sp.sort : "newest";
  const sort = SORTS[sortKey];

  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select("*")
    .order(sort.column, { ascending: sort.ascending })
    .order("created_at", { ascending: false })
    .limit(120);

  if (category) query = query.eq("category", category);
  if (q) {
    // strip characters that have meaning in PostgREST filter syntax
    // every word must appear (in the title or description), in any order
    const words = q
      .replace(/[%,()*\\"]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6);
    for (const w of words) query = query.or(`title.ilike.%${w}%,description.ilike.%${w}%`);
  }

  const [{ data, error }, { data: payable }] = await Promise.all([
    query,
    supabase.from("sellers").select("user_id").eq("charges_enabled", true),
  ]);
  const listings = (data ?? []) as Listing[];
  const payableSellers = new Set((payable ?? []).map((s) => s.user_id as string));
  const isBuyable = (l: Listing) => l.status === "active" && Number(l.price) >= 0.5 && payableSellers.has(l.user_id);
  const activeCount = listings.filter((l) => l.status !== "sold").length;
  const keep = {
    q,
    category,
    view: view === "list" ? "list" : undefined,
    sort: sortKey === "newest" ? undefined : sortKey,
  };
  const filtered = !!(q || category);
  const firstActive = listings.find((l) => l.status !== "sold");
  const showBento = !filtered && view === "grid" && sortKey === "newest" && listings.length >= 7 && !!firstActive;
  const featured = showBento ? firstActive : undefined;
  const others = listings.filter((l) => l !== featured);
  const side = showBento ? others.slice(0, 6) : [];
  const rest = showBento ? others.slice(6) : listings;

  return (
    <main>
      {/* ── Hero / results header ─────────────────────────── */}
      {!filtered ? (
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:pb-14 lg:pt-16">
            <div className="animate-rise">
              <p className="eyebrow flex items-center gap-2 text-accent">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                {activeCount} things for sale nearby
              </p>
              <h1 className="mt-4 font-serif text-[56px] leading-[0.9] tracking-[-0.02em] sm:text-[80px] lg:text-[104px]">
                Good stuff,
                <br />
                <em className="text-accent">down the street.</em>
              </h1>
            </div>
            <div className="animate-rise lg:pb-3" style={{ animationDelay: "80ms" }}>
              <p className="max-w-md text-[17px] leading-relaxed text-ink-2">
                Buy and sell secondhand with people nearby. No fees, no shipping. Just a message and a meetup.
              </p>
              <form action="/" role="search" className="mt-5 flex gap-2">
                <label className="flex flex-1 items-center gap-3 rounded-full border border-ink bg-card px-5 py-3.5 focus-within:ring-4 focus-within:ring-accent/20">
                  <Search className="h-5 w-5 text-ink-3" />
                  <input
                    name="q"
                    placeholder="What are you looking for?"
                    aria-label="Search Marketplace"
                    className="w-full bg-transparent text-[16px] outline-none placeholder:text-ink-3"
                  />
                </label>
                <button className="rounded-full bg-ink px-6 text-[15px] font-semibold text-paper transition hover:bg-accent">
                  Search
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="eyebrow text-ink-3">Try</span>
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s}
                    href={`/?q=${s}`}
                    className="rounded-full border border-dashed border-ink-3/50 px-3 py-1 font-mono text-[12px] text-ink-2 transition hover:border-ink hover:bg-card hover:text-ink"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="border-b border-line">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-end gap-5 px-4 py-8 sm:px-6">
            {cat && (
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-ink"
                style={{ backgroundColor: cat.tint }}
              >
                <CategoryIcon name={cat.icon} className="h-8 w-8" />
              </span>
            )}
            <div className="mr-auto">
              <p className="eyebrow text-ink-3">
                {q ? "Search" : "Category"}
                {q && cat ? ` · in ${cat.label}` : ""}
              </p>
              <h1 className="mt-1 font-serif text-[44px] leading-none tracking-tight sm:text-[60px]" data-testid="results-heading">
                {q ? (
                  <>
                    “<em>{q}</em>”
                  </>
                ) : (
                  cat?.label
                )}
              </h1>
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-[14px] font-medium text-ink-2 transition hover:border-ink hover:text-ink"
            >
              <X className="h-4 w-4" /> Clear
            </Link>
          </div>
        </section>
      )}

      {/* ── Category rail + view controls ─────────────────── */}
      <div className="sticky top-16 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <nav aria-label="Categories" className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 py-3">
            <Chip href={buildHref({ ...keep, category: undefined })} active={!category} tint="#17140F" icon="all">
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.slug}
                href={buildHref({ ...keep, category: c.slug })}
                active={category === c.slug}
                tint={c.tint}
                icon={c.icon}
              >
                {c.label}
              </Chip>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto font-serif text-[30px] leading-none tracking-tight">
            {filtered
              ? `${listings.length} ${listings.length === 1 ? "item" : "items"}`
              : showBento
                ? "Fresh this week"
                : "Everything for sale"}
          </h2>
          <Segmented label="Sort">
            {Object.entries(SORTS).map(([key, s]) => (
              <SegLink
                key={key}
                href={buildHref({ ...keep, sort: key === "newest" ? undefined : key })}
                active={sortKey === key}
                ariaLabel={`Sort by ${s.label}`}
              >
                {s.label}
              </SegLink>
            ))}
          </Segmented>
          <Segmented label="View">
            <SegLink href={buildHref({ ...keep, view: undefined })} active={view === "grid"} ariaLabel="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </SegLink>
            <SegLink href={buildHref({ ...keep, view: "list" })} active={view === "list"} ariaLabel="List view">
              <Rows3 className="h-4 w-4" />
            </SegLink>
          </Segmented>
        </div>

        {error && (
          <p className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-[14px] text-accent-dark">
            Couldn&apos;t load listings: {error.message}
          </p>
        )}

        {!error && listings.length === 0 && <EmptyState filtered={filtered} />}

        {featured && (
          <section className="mb-14 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
            <FeaturedCard listing={featured} buyable={isBuyable(featured)} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {side.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i + 1} square buyable={isBuyable(l)} />
              ))}
            </div>
          </section>
        )}

        {showBento && rest.length > 0 && (
          <div className="mb-6 flex items-baseline justify-between border-t border-line pt-8">
            <h2 className="font-serif text-[30px] leading-none tracking-tight">More around town</h2>
            <span className="eyebrow text-ink-3">{rest.length} more</span>
          </div>
        )}

        {rest.length > 0 &&
          (view === "grid" ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {rest.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} buyable={isBuyable(l)} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-line bg-paper">
              <div className="eyebrow hidden grid-cols-[96px_1fr_140px_120px_auto] gap-4 border-b border-line bg-paper-2/60 px-4 py-2.5 text-ink-3 sm:grid">
                <span>Item</span>
                <span />
                <span>Category</span>
                <span>Where · When</span>
                <span className="text-right">Price</span>
              </div>
              {rest.map((l) => (
                <ListingRow key={l.id} listing={l} buyable={isBuyable(l)} />
              ))}
            </div>
          ))}
      </div>
    </main>
  );
}

function Chip({
  href,
  active,
  tint,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  tint: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full py-1.5 pl-1.5 pr-3.5 text-[14px] font-medium transition ${
        active ? "bg-ink text-paper" : "text-ink-2 hover:bg-card hover:text-ink"
      }`}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: active ? (icon === "all" ? "#FF5A1F" : tint) : icon === "all" ? "#EBE4D5" : tint }}
      >
        <CategoryIcon name={icon} className={`h-4 w-4 ${active && icon === "all" ? "text-white" : "text-ink"}`} />
      </span>
      {children}
    </Link>
  );
}

function Segmented({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex items-center rounded-full border border-line bg-card p-1">
      {children}
    </div>
  );
}

function SegLink({
  href,
  active,
  ariaLabel,
  children,
}: {
  href: string;
  active: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`flex h-8 items-center justify-center rounded-full px-3 font-mono text-[12px] font-medium transition ${
        active ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-dashed border-line px-6 py-20 text-center">
      <span className="font-serif text-[64px] italic leading-none text-accent">∅</span>
      <p className="mt-4 font-serif text-[34px] leading-none">
        {filtered ? "Nothing matches that." : "Nothing for sale yet."}
      </p>
      <p className="mt-3 max-w-sm text-[15px] text-ink-2">
        {filtered
          ? "Try a broader word, another category, or check back later. New things show up every day."
          : "Be the first. Snap a photo, set a price, and your neighbors will see it right away."}
      </p>
      <div className="mt-6 flex gap-2">
        {filtered && (
          <Link
            href="/"
            className="rounded-full border border-line bg-card px-5 py-2.5 text-[14px] font-semibold transition hover:border-ink"
          >
            See everything
          </Link>
        )}
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper transition hover:bg-accent"
        >
          Sell something <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
