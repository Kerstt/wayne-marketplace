import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="-rotate-3 rounded-full bg-sun px-4 py-1.5 font-mono text-[14px] font-semibold shadow-[var(--shadow-sticker)]">
        SOLD · 404
      </span>
      <h1 className="mt-6 font-serif text-[64px] leading-[0.9] tracking-tight">
        Someone got <em className="text-accent">here first.</em>
      </h1>
      <p className="mt-4 text-[16px] text-ink-2">This listing was sold, removed, or never existed.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition hover:bg-accent"
      >
        Keep browsing
      </Link>
    </main>
  );
}
