import Link from "next/link";
import { ArrowUpRight, ImageOff } from "lucide-react";
import type { Listing } from "@/lib/types";
import { shortAgo, timeAgo } from "@/lib/format";
import { categoryLabel, getCategory } from "@/lib/categories";
import { PriceTag } from "./ui";

function Photo({ listing, className = "" }: { listing: Listing; className?: string }) {
  return listing.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={listing.image_url}
      alt={listing.title}
      loading="lazy"
      className={`h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] ${className}`}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-ink-3">
      <ImageOff className="h-8 w-8" />
    </div>
  );
}

function Meta({ listing }: { listing: Listing }) {
  return (
    <p className="eyebrow mt-1.5 truncate text-ink-3">
      {listing.location || categoryLabel(listing.category)} · {shortAgo(listing.created_at)}
    </p>
  );
}

/** Standard grid card: photo with price sticker, title, meta line. */
export function ListingCard({
  listing,
  index = 0,
  square = false,
}: {
  listing: Listing;
  index?: number;
  square?: boolean;
}) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      data-testid="listing-card"
      className="animate-rise group block"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <div
        className={`relative overflow-hidden rounded-[18px] bg-paper-2 ring-1 ring-ink/5 ${square ? "aspect-square" : "aspect-[4/5]"}`}
      >
        <Photo listing={listing} />
        <PriceTag price={listing.price} size="sm" className="absolute bottom-3 left-3 -rotate-2 transition group-hover:rotate-0" />
      </div>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug text-ink decoration-accent decoration-2 underline-offset-4 group-hover:underline">
        {listing.title}
      </h3>
      <Meta listing={listing} />
    </Link>
  );
}

/** Large editorial card used for the newest listing on the home page. */
export function FeaturedCard({ listing }: { listing: Listing }) {
  const cat = getCategory(listing.category);
  return (
    <Link
      href={`/listing/${listing.id}`}
      data-testid="listing-card"
      className="animate-rise group relative block min-h-[420px] overflow-hidden rounded-[24px] bg-ink lg:min-h-full"
    >
      <Photo listing={listing} className="absolute inset-0 opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <span className="eyebrow absolute left-5 top-5 rounded-full bg-accent px-2.5 py-1 text-[10px] text-white">
        Just listed
      </span>
      <div className="absolute inset-x-0 bottom-0 p-6 text-paper">
        <p className="eyebrow text-paper/70">
          {cat?.label} {listing.location && `· ${listing.location}`}
        </p>
        <h3 className="mt-2 max-w-md font-serif text-[40px] leading-[0.95] tracking-tight sm:text-[52px]">{listing.title}</h3>
        <div className="mt-4 flex items-center gap-3">
          <PriceTag price={listing.price} size="md" className="-rotate-2" />
          <span className="inline-flex items-center gap-1 text-[14px] font-medium text-paper/80 transition group-hover:text-paper">
            View item <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Classifieds-style ledger row used by list view. */
export function ListingRow({ listing }: { listing: Listing }) {
  const cat = getCategory(listing.category);
  return (
    <Link
      href={`/listing/${listing.id}`}
      data-testid="listing-card"
      className="group grid grid-cols-[72px_1fr_auto] items-center gap-4 border-b border-dashed border-line px-2 py-4 transition last:border-b-0 hover:bg-card sm:grid-cols-[96px_1fr_140px_120px_auto] sm:px-4"
    >
      <div className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-paper-2 sm:h-24 sm:w-24">
        <Photo listing={listing} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-[16px] font-semibold text-ink group-hover:text-accent">{listing.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[14px] text-ink-2">{listing.description}</p>
        <p className="eyebrow mt-1.5 text-ink-3 sm:hidden">
          {cat?.label} · {shortAgo(listing.created_at)}
        </p>
      </div>
      <span className="hidden items-center gap-2 text-[13px] text-ink-2 sm:flex">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat?.tint }} />
        {cat?.label}
      </span>
      <span className="eyebrow hidden truncate text-ink-3 sm:block">
        {listing.location || "—"}
        <br />
        {timeAgo(listing.created_at)}
      </span>
      <PriceTag price={listing.price} size="sm" />
    </Link>
  );
}
