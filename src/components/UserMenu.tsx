"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, MessageCircle, Plus, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./ui";

export function UserMenu({ email, name }: { email: string; name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    setOpen(false);
    // Full navigation so every server component (navbar, pages) re-renders logged out.
    window.location.assign("/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="rounded-full ring-2 ring-transparent transition hover:ring-line"
      >
        <Avatar label={name || email} seed={email} size={36} />
      </button>
      {open && (
        <div className="animate-rise absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[var(--shadow-lift)]">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar label={name || email} seed={email} size={36} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{name || "Your account"}</p>
              <p className="truncate font-mono text-[11px] text-ink-3">{email}</p>
            </div>
          </div>
          <div className="my-1 border-t border-dashed border-line" />
          <MenuLink href="/create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Sell something
          </MenuLink>
          <MenuLink href="/selling" icon={<Tag className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Your listings
          </MenuLink>
          <MenuLink href="/inbox" icon={<MessageCircle className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Inbox
          </MenuLink>
          <div className="my-1 border-t border-dashed border-line" />
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-ink-2 transition hover:bg-paper hover:text-accent"
          >
            <LogOut className="h-4 w-4" />
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink transition hover:bg-paper"
    >
      <span className="text-ink-3">{icon}</span>
      {children}
    </Link>
  );
}
