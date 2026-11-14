"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MessageCircle, Plus, Tag, UserRound, type LucideIcon } from "lucide-react";

type Tab = { href: string; label: string; icon: LucideIcon; active: boolean; primary?: boolean };

export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const tabs: Tab[] = [
    { href: "/", label: "Browse", icon: Compass, active: path === "/" || path.startsWith("/listing") },
    { href: "/inbox", label: "Inbox", icon: MessageCircle, active: path.startsWith("/inbox") },
    { href: "/create", label: "Sell", icon: Plus, active: path.startsWith("/create"), primary: true },
    { href: "/selling", label: "Listings", icon: Tag, active: path.startsWith("/selling") },
  ];
  if (!signedIn) {
    tabs.push({ href: "/login", label: "Log in", icon: UserRound, active: path === "/login" || path === "/signup" });
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon, active, primary }) => (
          <li key={label} className="flex-1">
            <Link href={href} className="flex flex-col items-center gap-1 py-2" aria-current={active ? "page" : undefined}>
              {primary ? (
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-lift)] ring-4 ring-paper">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <Icon className={`h-5 w-5 ${active ? "text-ink" : "text-ink-3"}`} />
              )}
              <span className={`text-[11px] font-medium ${active ? "text-ink" : "text-ink-3"}`}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
