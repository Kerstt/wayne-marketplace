import Link from "next/link";
import { LayoutGrid, List, PackageSearch, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import type { Listing } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { ListingCard } from "@/components/ListingCard";
import { CategoryIcon } from "@/components/CategoryIcon";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string; view?: string; sort?: string }>;

const SORTS: Record<string, { label: string; column: string; ascending: boolean }> = {
  newest: { label: "Newest first", column: "created_at", ascending: false },
  "price-asc": { label: "Price: low to high", column: "price", ascending: true },
  "price-desc": { label: "Price: high to low", column: "price", ascending: false },
};

function buildHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const category = CATEGORIES.some((c) => c.slug === sp.category) ? sp.category : undefined;
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
    const safe = q.replace(/[%,()*\\]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  const listings = (data ?? []) as Listing[];
  const keep = { q, category, view: view === "list" ? "list" : undefined, sort: sortKey === "newest" ? undefined : sortKey };

  const heading = q
    ? `Results for “${q}”`
    : category
      ? categoryLabel(category)
      : "Today's picks";

  return (
    <div className="flex">
      <Sidebar q={q} category={category} />

      <main className="min-w-0 flex-1 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        {/* Category tabs */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Tab href={buildHref({ ...keep, category: undefined })} active={!category}>
            All
          </Tab>
          {CATEGORIES.map((c) => (
            <Tab key={c.slug} href={buildHref({ ...keep, category: c.slug })} active={category === c.slug}>
              <CategoryIcon name={c.icon} className="h-4 w-4" />
              {c.label}
            </Tab>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="text-xl font-bold text-zinc-900" data-testid="results-heading">
              {heading}
            </h2>
            <p className="text-sm text-zinc-500">
              {listings.length} {listings.length === 1 ? "listing" : "listings"}
              {q && category ? ` in ${categoryLabel(category)}` : ""}
            </p>
          </div>

          {(q || category) && (
            <Link
              href="/"
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-black/10 hover:bg-zinc-50"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </Link>
          )}

          <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-black/10">
            {Object.entries(SORTS).map(([key, s]) => (
              <Link
                key={key}
                href={buildHref({ ...keep, sort: key === "newest" ? undefined : key })}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  sortKey === key ? "bg-brand-soft text-brand" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>

          <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-black/10" role="group" aria-label="View">
            <Link
              href={buildHref({ ...keep, view: undefined })}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={`rounded-md p-2 transition ${view === "grid" ? "bg-brand-soft text-brand" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Link>
            <Link
              href={buildHref({ ...keep, view: "list" })}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={`rounded-md p-2 transition ${view === "list" ? "bg-brand-soft text-brand" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              <List className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Couldn&apos;t load listings: {error.message}
          </p>
        )}

        {!error && listings.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white ring-1 ring-black/5">
              <PackageSearch className="h-8 w-8 text-zinc-400" />
            </span>
            <p className="mt-4 text-lg font-semibold text-zinc-900">No listings found</p>
            <p className="mt-1 text-sm text-zinc-500">Try a different search or category — or be the first to sell something.</p>
            <Link
              href="/create"
              className="mt-5 rounded-lg bg-brand px-5 py-2 text-[15px] font-semibold text-white hover:bg-brand-dark"
            >
              Create new listing
            </Link>
          </div>
        )}

        {listings.length > 0 &&
          (view === "grid" ? (
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex max-w-4xl flex-col gap-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} view="list" />
              ))}
            </div>
          ))}
      </main>
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition ${
        active ? "bg-brand text-white shadow-sm" : "bg-white text-zinc-800 ring-1 ring-black/10 hover:bg-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}
