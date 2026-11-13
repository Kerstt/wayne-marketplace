"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MessageCircle, Plus, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[15px] font-bold text-white ring-2 ring-white transition hover:opacity-90"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5">
          <div className="px-3 py-2">
            <p className="text-xs text-zinc-500">Signed in as</p>
            <p className="truncate text-sm font-semibold text-zinc-900">{email}</p>
          </div>
          <hr className="my-1 border-zinc-200" />
          <MenuLink href="/create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Create listing
          </MenuLink>
          <MenuLink href="/selling" icon={<Tag className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Your listings
          </MenuLink>
          <MenuLink href="/inbox" icon={<MessageCircle className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Inbox
          </MenuLink>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] font-medium text-zinc-900 hover:bg-zinc-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200">
              <LogOut className="h-4 w-4" />
            </span>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium text-zinc-900 hover:bg-zinc-100"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200">{icon}</span>
      {children}
    </Link>
  );
}
