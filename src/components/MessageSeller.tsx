"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, Loader2, Mail, MessageCircle, PenLine, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputCls } from "./ui";

const QUICK = ["Is this still available?", "Would you take less?", "When can I pick it up?"];

export function MessageSeller({
  listingId,
  listingTitle,
  sellerEmail,
  user,
}: {
  listingId: string;
  listingTitle: string;
  sellerEmail: string;
  user: { email: string; name: string } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [body, setBody] = useState("Hi! Is this still available?");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mailto = `mailto:${sellerEmail}?subject=${encodeURIComponent(`Wayne Market: ${listingTitle}`)}`;

  if (!user) {
    return (
      <div className="rounded-[22px] border border-line bg-card p-5">
        <p className="font-serif text-[26px] leading-none">Interested?</p>
        <p className="mt-2 text-[14px] text-ink-2">Log in to send the seller a message. It only takes a minute.</p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-paper transition hover:bg-accent"
        >
          <MessageCircle className="h-4 w-4" /> Message Seller
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div
        className="animate-rise rounded-[22px] border border-leaf/30 bg-leaf/[0.07] p-5"
        role="status"
        data-testid="message-sent"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-white">
            <Check className="h-5 w-5" />
          </span>
          <div>
            <p className="font-serif text-[24px] leading-none">Message sent</p>
            <p className="mt-1 text-[13px] text-ink-2">
              The seller will reply to <strong className="font-semibold text-ink">{email}</strong>.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-[14px] text-paper">{body}</div>
        <div className="mt-4 flex gap-4 text-[13px] font-semibold">
          <Link href="/inbox?tab=sent" className="inline-flex items-center gap-1 text-ink hover:text-accent">
            View sent messages <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setBody("");
            }}
            className="text-ink-3 hover:text-ink"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-paper transition hover:bg-accent active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" /> Message Seller
        </button>
        <a
          href={mailto}
          aria-label="Email seller"
          title="Email seller"
          className="flex w-[52px] items-center justify-center rounded-full border border-line bg-card text-ink transition hover:border-ink"
        >
          <Mail className="h-5 w-5" />
        </a>
      </div>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return setError("Write a message first.");
    setSending(true);
    const { error } = await createClient().from("messages").insert({
      listing_id: listingId,
      sender_name: name.trim(),
      sender_email: email.trim(),
      body: body.trim(),
    });
    setSending(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <form
      onSubmit={send}
      className="animate-rise overflow-hidden rounded-[22px] border border-ink bg-card shadow-[var(--shadow-lift)]"
      data-testid="message-form"
    >
      <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
        <p className="eyebrow text-ink">Message the seller</p>
        <button type="button" onClick={() => setOpen(false)} className="eyebrow text-ink-3 hover:text-accent">
          Cancel
        </button>
      </div>
      <div className="p-5">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setBody(q)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] transition ${
                body === q ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink hover:text-ink"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <textarea
          aria-label="Message"
          rows={3}
          required
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${inputCls} mt-3 resize-none`}
        />
        <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-3">
          <span>
            Replies go to <span className="text-ink-2">{email || "—"}</span>{" "}
            <button
              type="button"
              onClick={() => setEditContact((v) => !v)}
              className="inline-flex items-center gap-0.5 text-ink underline decoration-dotted underline-offset-2 hover:text-accent"
            >
              <PenLine className="h-3 w-3" /> edit
            </button>
          </span>
          <span>{body.length}/2000</span>
        </div>
        {editContact && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              aria-label="Your name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className={inputCls}
            />
            <input
              aria-label="Your email"
              placeholder="Your email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-[13px] text-accent-dark">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[15px] font-semibold text-white transition hover:bg-accent-dark active:scale-[0.98] disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send message
        </button>
      </div>
    </form>
  );
}
