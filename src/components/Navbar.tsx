import Link from "next/link";
import { MessageCircle, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./UserMenu";
import { MobileTabBar } from "./MobileTabBar";
import { Logo } from "./ui";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.full_name as string) || user?.email || "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Logo />

          <form action="/" role="search" className="ml-4 hidden max-w-md flex-1 md:flex">
            <label className="group flex w-full items-center gap-2.5 rounded-full border border-line bg-card px-4 py-2 transition focus-within:border-ink focus-within:ring-4 focus-within:ring-accent/15">
              <Search className="h-4 w-4 text-ink-3 group-focus-within:text-ink" />
              <input
                name="q"
                placeholder="Search bikes, sofas, guitars…"
                aria-label="Search listings"
                className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-3"
              />
              <kbd className="eyebrow hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-3 lg:block">Enter</kbd>
            </label>
          </form>

          <nav className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/inbox"
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-[14px] font-medium text-ink-2 transition hover:bg-paper-2 hover:text-ink md:flex"
                >
                  <MessageCircle className="h-4 w-4" /> Inbox
                </Link>
                <Link
                  href="/create"
                  className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-paper transition hover:bg-accent md:flex"
                >
                  <Plus className="h-4 w-4" /> Sell something
                </Link>
                <UserMenu email={user.email ?? ""} name={name} />
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-full px-3 py-2 text-[14px] font-medium text-ink-2 transition hover:text-ink">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-paper transition hover:bg-accent"
                >
                  Start selling
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <MobileTabBar signedIn={!!user} />
    </>
  );
}
