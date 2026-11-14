import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Reply } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";
import { shortAgo } from "@/lib/format";
import { Avatar, PriceTag } from "@/components/ui";

export const metadata = { title: "Inbox · Wayne Market" };
export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "sent" ? "sent" : "received";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inbox");

  const [{ data, error }, { count: receivedCount }, { count: sentCount }] = await Promise.all([
    supabase
      .from("messages")
      .select("*, listings(id, title, image_url, price)")
      .eq(tab === "sent" ? "sender_id" : "seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", user.id),
  ]);
  const messages = (data ?? []) as Message[];

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <header className="animate-rise">
        <p className="eyebrow text-accent">Messages</p>
        <h1 className="mt-2 font-serif text-[56px] leading-none tracking-tight">Inbox</h1>
      </header>

      <div role="tablist" className="mt-6 flex gap-6 border-b border-line">
        <TabLink href="/inbox" active={tab === "received"} count={receivedCount ?? 0}>
          Selling · received
        </TabLink>
        <TabLink href="/inbox?tab=sent" active={tab === "sent"} count={sentCount ?? 0}>
          Buying · sent
        </TabLink>
      </div>

      {error && <p className="mt-4 rounded-xl bg-accent/10 p-3 text-[14px] text-accent-dark">{error.message}</p>}

      {messages.length === 0 ? (
        <div className="mt-10 rounded-[24px] border border-dashed border-line px-6 py-16 text-center">
          <p className="font-serif text-[34px] leading-none">All quiet.</p>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-ink-2">
            {tab === "received"
              ? "When someone messages you about one of your listings, it'll show up here."
              : "Find something you like and hit “Message Seller”. Your messages will show up here."}
          </p>
          <Link
            href={tab === "received" ? "/create" : "/"}
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper transition hover:bg-accent"
          >
            {tab === "received" ? "List an item" : "Browse listings"}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4" data-testid="message-list">
          {messages.map((m, i) => (
            <li
              key={m.id}
              className="animate-rise overflow-hidden rounded-[22px] border border-line bg-card"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* listing strip */}
              <Link
                href={m.listings ? `/listing/${m.listings.id}` : "#"}
                className="group flex items-center gap-3 border-b border-dashed border-line bg-paper/60 px-4 py-3 transition hover:bg-paper"
              >
                {m.listings?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.listings.image_url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                ) : (
                  <div className="h-11 w-11 rounded-lg bg-paper-2" />
                )}
                <p className="min-w-0 flex-1 truncate text-[14px] font-semibold group-hover:text-accent">
                  {m.listings?.title ?? "Deleted listing"}
                </p>
                {m.listings && <PriceTag price={m.listings.price} size="sm" />}
                <ArrowUpRight className="h-4 w-4 text-ink-3 group-hover:text-accent" />
              </Link>

              {/* message */}
              <div className="p-4">
                <div className={`flex items-end gap-3 ${tab === "sent" ? "flex-row-reverse" : ""}`}>
                  {tab === "received" && <Avatar label={m.sender_name || m.sender_email} seed={m.sender_email} size={36} />}
                  <div className={`max-w-[85%] ${tab === "sent" ? "text-right" : ""}`}>
                    <p className="eyebrow mb-1.5 text-ink-3">
                      {tab === "received" ? m.sender_name || "A buyer" : "You"} · {shortAgo(m.created_at)}
                    </p>
                    <p
                      className={`inline-block whitespace-pre-wrap px-4 py-2.5 text-left text-[15px] leading-relaxed ${
                        tab === "sent"
                          ? "rounded-2xl rounded-br-md bg-ink text-paper"
                          : "rounded-2xl rounded-bl-md bg-paper-2 text-ink"
                      }`}
                    >
                      {m.body}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line pt-3">
                  <span className="font-mono text-[12px] text-ink-3">
                    {tab === "received" ? m.sender_email : `Seller replies to ${m.sender_email}`}
                  </span>
                  {tab === "received" && (
                    <a
                      href={`mailto:${m.sender_email}?subject=${encodeURIComponent(`Re: ${m.listings?.title ?? "your message"}`)}&body=${encodeURIComponent(`\n\n> ${m.body}`)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition hover:bg-accent"
                    >
                      <Reply className="h-4 w-4" /> Reply by email
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function TabLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-[15px] font-medium transition ${
        active ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${active ? "bg-accent text-white" : "bg-paper-2 text-ink-3"}`}
      >
        {count}
      </span>
    </Link>
  );
}
