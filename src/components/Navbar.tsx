import Link from "next/link";
import { MessageCircle, Plus, Search, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./UserMenu";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="flex h-full items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Wayne Marketplace home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
            <Store className="h-5 w-5" />
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-brand sm:block">
            wayne<span className="font-semibold text-zinc-800">market</span>
          </span>
        </Link>

        <form action="/" className="ml-2 flex max-w-xs flex-1 lg:hidden">
          <label className="flex w-full items-center gap-2 rounded-full bg-[#F0F2F5] px-3 py-2">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              name="q"
              placeholder="Search Marketplace"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-zinc-500"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/create"
                className="hidden items-center gap-1.5 rounded-full bg-brand-soft px-4 py-2 text-[15px] font-semibold text-brand transition hover:bg-[#DBE7F2] sm:flex"
              >
                <Plus className="h-4 w-4" />
                Create listing
              </Link>
              <Link
                href="/inbox"
                aria-label="Inbox"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4E6EB] text-zinc-900 transition hover:bg-[#D8DADF]"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <UserMenu email={user.email ?? ""} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-[15px] font-semibold text-brand transition hover:bg-brand-soft"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand px-4 py-2 text-[15px] font-semibold text-white transition hover:bg-brand-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
