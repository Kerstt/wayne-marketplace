import Link from "next/link";
import { MessageCircle, Plus, Search, Store, Tag } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";

export function Sidebar({ q, category }: { q?: string; category?: string }) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[360px] shrink-0 overflow-y-auto border-r border-black/5 bg-white px-2 pb-6 pt-4 lg:block">
      <h1 className="px-2 text-2xl font-bold text-zinc-900">Marketplace</h1>

      <form action="/" className="px-2 pt-3">
        {category && <input type="hidden" name="category" value={category} />}
        <label className="flex items-center gap-2 rounded-full bg-[#F0F2F5] px-3 py-2.5">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search Marketplace"
            aria-label="Search Marketplace"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-zinc-500"
          />
        </label>
      </form>

      <nav className="mt-3 space-y-0.5">
        <SideLink href="/" active={!category && !q} icon={<Store className="h-5 w-5" />}>
          Browse all
        </SideLink>
        <SideLink href="/inbox" icon={<MessageCircle className="h-5 w-5" />}>
          Inbox
        </SideLink>
        <SideLink href="/selling" icon={<Tag className="h-5 w-5" />}>
          Selling
        </SideLink>
      </nav>

      <div className="px-2 pt-3">
        <Link
          href="/create"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft py-2 text-[15px] font-semibold text-brand transition hover:bg-[#DBE7F2]"
        >
          <Plus className="h-4 w-4" />
          Create new listing
        </Link>
      </div>

      <hr className="mx-2 my-4 border-zinc-200" />
      <h2 className="px-2 pb-1 text-[17px] font-semibold text-zinc-900">Categories</h2>
      <nav className="space-y-0.5">
        {CATEGORIES.map((c) => (
          <SideLink
            key={c.slug}
            href={`/?category=${c.slug}`}
            active={category === c.slug}
            icon={<CategoryIcon name={c.icon} className="h-5 w-5" />}
          >
            {c.label}
          </SideLink>
        ))}
      </nav>
    </aside>
  );
}

function SideLink({
  href,
  icon,
  active,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-[15px] font-medium transition ${
        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-900 hover:bg-zinc-100"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-brand text-white" : "bg-[#E4E6EB] text-zinc-900"
        }`}
      >
        {icon}
      </span>
      {children}
    </Link>
  );
}
