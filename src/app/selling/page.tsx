import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import { formatPrice, timeAgo } from "@/lib/format";
import { getCategory } from "@/lib/categories";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { PriceTag } from "@/components/ui";

export const metadata = { title: "Your listings · Wayne Market" };
export const dynamic = "force-dynamic";

type Row = Listing & { messages: { count: number }[] };

export default async function SellingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/selling");

  const { data } = await supabase
    .from("listings")
    .select("*, messages(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const listings = (data ?? []) as Row[];
  const total = listings.reduce((s, l) => s + Number(l.price), 0);
  const inquiries = listings.reduce((s, l) => s + (l.messages?.[0]?.count ?? 0), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Your shop</p>
          <h1 className="mt-2 font-serif text-[56px] leading-none tracking-tight">Your listings</h1>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition hover:bg-accent"
        >
          <Plus className="h-4 w-4" /> New listing
        </Link>
      </header>

      <dl className="mt-8 grid grid-cols-3 divide-x divide-dashed divide-line rounded-[22px] border border-line bg-card">
        <Stat label="Active" value={String(listings.length)} />
        <Stat label="Inquiries" value={String(inquiries)} />
        <Stat label="Total value" value={formatPrice(total)} />
      </dl>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-dashed border-line px-6 py-16 text-center">
          <p className="font-serif text-[34px] leading-none">Your shelf is empty.</p>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-ink-2">
            Snap a photo, set a price, and your first listing goes live in a minute.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-dashed divide-line overflow-hidden rounded-[22px] border border-line bg-card">
          {listings.map((l) => {
            const cat = getCategory(l.category);
            const msgs = l.messages?.[0]?.count ?? 0;
            return (
              <li key={l.id} className="flex items-center gap-4 p-3 transition hover:bg-paper/60 sm:p-4">
                <Link href={`/listing/${l.id}`} className="shrink-0">
                  {l.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-paper-2" />
                  )}
                </Link>
                <Link href={`/listing/${l.id}`} className="group min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold group-hover:text-accent">{l.title}</p>
                  <p className="eyebrow mt-1 flex items-center gap-1.5 text-ink-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: cat?.tint }} />
                    {cat?.label} · {timeAgo(l.created_at)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <PriceTag price={l.price} size="sm" />
                    {msgs > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-medium text-accent">
                        <MessageCircle className="h-3 w-3" /> {msgs} {msgs === 1 ? "message" : "messages"}
                      </span>
                    )}
                  </div>
                </Link>
                <DeleteListingButton id={l.id} imagePath={l.image_path} compact />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 sm:px-6">
      <dt className="eyebrow text-ink-3">{label}</dt>
      <dd className="mt-1 truncate font-serif text-[30px] leading-none sm:text-[36px]">{value}</dd>
    </div>
  );
}
