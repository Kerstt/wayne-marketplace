import Link from "next/link";
import { ImageOff, MapPin } from "lucide-react";
import type { Listing } from "@/lib/types";
import { formatPrice, timeAgo } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

function Thumb({ listing, className }: { listing: Listing; className: string }) {
  return listing.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={listing.image_url}
      alt={listing.title}
      loading="lazy"
      className={`${className} object-cover transition duration-300 group-hover:scale-[1.03]`}
    />
  ) : (
    <div className={`${className} flex items-center justify-center bg-zinc-200 text-zinc-400`}>
      <ImageOff className="h-8 w-8" />
    </div>
  );
}

export function ListingCard({ listing, view = "grid" }: { listing: Listing; view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <Link
        href={`/listing/${listing.id}`}
        data-testid="listing-card"
        className="group flex gap-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
      >
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg sm:h-36 sm:w-36">
          <Thumb listing={listing} className="h-full w-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <p className="text-lg font-bold text-zinc-900">{formatPrice(listing.price)}</p>
          <h3 className="truncate text-[15px] font-medium text-zinc-900">{listing.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{listing.description}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
              {categoryLabel(listing.category)}
            </span>
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </span>
            )}
            <span>{timeAgo(listing.created_at)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/listing/${listing.id}`} data-testid="listing-card" className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-zinc-200">
        <Thumb listing={listing} className="h-full w-full" />
      </div>
      <div className="px-0.5 pt-2">
        <p className="text-[17px] font-bold leading-tight text-zinc-900">{formatPrice(listing.price)}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] leading-snug text-zinc-900">{listing.title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-zinc-500">
          {listing.location || categoryLabel(listing.category)}
        </p>
      </div>
    </Link>
  );
}
