import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff, Mail, MapPin, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { getCategory } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ListingCard } from "@/components/ListingCard";
import { MessageSeller } from "@/components/MessageSeller";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { Avatar, PriceTag } from "@/components/ui";

type Params = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Listing not found" };
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("title").eq("id", id).maybeSingle();
  return { title: data ? `${data.title} · Wayne Market` : "Listing not found" };
}

export default async function ListingPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const [{ data, error }, { data: auth }] = await Promise.all([
    supabase.from("listings").select("*").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  // A failed request is an error (retryable), not a missing listing.
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const listing = data as Listing;
  const user = auth.user;
  const isOwner = user?.id === listing.user_id;
  const cat = getCategory(listing.category);

  const { data: relatedData } = await supabase
    .from("listings")
    .select("*")
    .eq("category", listing.category)
    .neq("id", listing.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const related = (relatedData ?? []) as Listing[];
  const posted = new Date(listing.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-5 sm:px-6">
      {/* breadcrumb */}
      <nav className="eyebrow flex items-center gap-2 text-ink-3">
        <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> All listings
        </Link>
        <span>/</span>
        <Link href={`/?category=${listing.category}`} className="transition hover:text-ink">
          {cat?.label}
        </Link>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        {/* Photo */}
        <div className="animate-rise">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[28px] bg-paper-2 ring-1 ring-ink/10 lg:aspect-auto lg:h-[calc(100vh-9rem)] lg:max-h-[760px]">
            {listing.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.image_url}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-3xl saturate-150"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  data-testid="listing-image"
                  className="relative h-full w-full object-contain p-4 drop-shadow-[0_20px_30px_rgba(23,20,15,0.25)] sm:p-8"
                />
              </>
            ) : (
              <ImageOff className="h-16 w-16 text-ink-3" />
            )}
            <span className="eyebrow absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1.5 text-ink-2 backdrop-blur">
              Listed {timeAgo(listing.created_at)}
            </span>
          </div>
        </div>

        {/* Details */}
        <aside className="animate-rise lg:sticky lg:top-24 lg:self-start" style={{ animationDelay: "80ms" }}>
          <Link
            href={`/?category=${listing.category}`}
            className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium text-ink-2 transition hover:text-ink"
            style={{ backgroundColor: cat?.tint }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card/70">
              {cat && <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" />}
            </span>
            {cat?.label}
          </Link>

          <h1
            className="mt-4 font-serif text-[44px] leading-[0.95] tracking-[-0.01em] sm:text-[56px]"
            data-testid="listing-title"
          >
            {listing.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PriceTag price={listing.price} size="lg" className="-rotate-2" testId="listing-price" />
            {listing.location && (
              <span className="inline-flex items-center gap-1.5 text-[14px] text-ink-2">
                <MapPin className="h-4 w-4 text-accent" />
                {listing.location}
              </span>
            )}
          </div>

          <div className="mt-6">
            {isOwner ? (
              <div className="rounded-[22px] border border-line bg-card p-5">
                <p className="eyebrow text-accent">Your listing</p>
                <p className="mt-1.5 text-[15px] text-ink-2">
                  Buyers&apos; messages land in your inbox. You can reply to them by email.
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/inbox"
                    className="flex-1 rounded-full bg-ink py-3 text-center text-[15px] font-semibold text-paper transition hover:bg-accent"
                  >
                    Open inbox
                  </Link>
                  <DeleteListingButton id={listing.id} imagePath={listing.image_path} />
                </div>
              </div>
            ) : (
              <MessageSeller
                listingId={listing.id}
                listingTitle={listing.title}
                sellerEmail={listing.email}
                user={
                  user
                    ? { email: user.email ?? "", name: (user.user_metadata?.full_name as string) ?? "" }
                    : null
                }
              />
            )}
          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="eyebrow text-ink-3">About this item</h2>
            <p
              className="mt-2 whitespace-pre-wrap text-[16px] leading-relaxed text-ink"
              data-testid="listing-description"
            >
              {listing.description}
            </p>
          </section>

          {/* Spec sheet */}
          <dl className="mt-6 divide-y divide-dashed divide-line border-y border-dashed border-line text-[14px]">
            <Spec label="Category">{cat?.label}</Spec>
            <Spec label="Location">{listing.location || "Ask the seller"}</Spec>
            <Spec label="Posted">{posted}</Spec>
            <Spec label="Ref">
              <span className="font-mono text-[12px] text-ink-3">#{listing.id.slice(0, 8)}</span>
            </Spec>
          </dl>

          {/* Seller */}
          <section className="mt-6 flex items-center gap-3 rounded-[22px] bg-paper-2/70 p-4">
            <Avatar label={listing.email} size={44} />
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-ink-3">Seller</p>
              <a
                href={`mailto:${listing.email}`}
                className="mt-0.5 flex items-center gap-1.5 truncate text-[15px] font-medium text-ink hover:text-accent"
                data-testid="seller-email"
              >
                <Mail className="h-4 w-4 shrink-0 text-ink-3" />
                <span className="truncate">{listing.email}</span>
              </a>
            </div>
          </section>
          <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-ink-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Meet in a public place, check the item before paying, and never send money in advance.
          </p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-10">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-serif text-[34px] leading-none tracking-tight">
              More in <em>{cat?.label}</em>
            </h2>
            <Link href={`/?category=${listing.category}`} className="eyebrow text-ink-3 transition hover:text-accent">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="eyebrow text-ink-3">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}
