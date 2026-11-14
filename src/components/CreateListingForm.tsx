"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, RefreshCw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";
import { Avatar, PriceTag, inputCls } from "./ui";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function CreateListingForm({
  userId,
  defaultEmail,
  sellerName,
}: {
  userId: string;
  defaultEmail: string;
  sellerName: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setError("Please choose a JPG, PNG, WebP or GIF image.");
    if (f.size > MAX_BYTES) return setError("Image must be 5 MB or smaller.");
    setFile(f);
  }

  const steps = [!!file, !!(title && price && category), !!description, !!email];
  const done = steps.filter(Boolean).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Add a photo of your item.");
    if (!category) return setError("Pick a category.");
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Enter a valid price.");
    if (priceNum > 9_999_999_999) return setError("That price is too high. The max is $9,999,999,999.");

    const supabase = createClient();
    setStatus("uploading");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (upErr) {
      setStatus("idle");
      return setError(`Photo upload failed: ${upErr.message}`);
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("listing-images").getPublicUrl(path);

    setStatus("saving");
    const { data, error: insErr } = await supabase
      .from("listings")
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        email: email.trim(),
        category,
        location: location.trim(),
        image_url: publicUrl,
        image_path: path,
      })
      .select("id")
      .single();

    if (insErr || !data) {
      await supabase.storage.from("listing-images").remove([path]);
      setStatus("idle");
      return setError(`Couldn't publish listing: ${insErr?.message ?? "unknown error"}`);
    }

    router.push(`/listing/${data.id}`);
    router.refresh();
  }

  const busy = status !== "idle";
  const cat = getCategory(category);

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow text-accent">New listing</p>
          <h1 className="mt-2 font-serif text-[48px] leading-[0.95] tracking-tight sm:text-[64px]">
            What are you <em>selling?</em>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="eyebrow text-ink-3">{done}/4 done</span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 w-8 rounded-full transition ${i < done ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} className="space-y-10">
          {/* 01 Photo */}
          <Section n="01" title="Photo" hint="Good light, plain background. One photo is all you need.">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              data-testid="photo-input"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {preview ? (
              <div className="group relative overflow-hidden rounded-[22px] bg-paper-2 ring-1 ring-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected photo" className="h-72 w-full object-cover sm:h-80" />
                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-2 text-[13px] font-semibold shadow backdrop-blur hover:bg-card"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    aria-label="Remove photo"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-card/95 shadow backdrop-blur hover:bg-accent hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex h-72 w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed transition sm:h-80 ${
                  dragging ? "border-accent bg-accent/5" : "border-line bg-card hover:border-ink"
                }`}
              >
                <span className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-sun text-ink shadow-[var(--shadow-sticker)]">
                  <Camera className="h-7 w-7" />
                </span>
                <span className="mt-5 font-serif text-[28px] leading-none">Add a photo</span>
                <span className="eyebrow mt-2 text-ink-3">Click or drop · JPG, PNG, WebP · 5 MB max</span>
              </button>
            )}
          </Section>

          {/* 02 Basics */}
          <Section n="02" title="The basics">
            <Field label="Title" htmlFor="title" counter={`${title.length}/120`}>
              <input
                id="title"
                required
                maxLength={120}
                placeholder="e.g. Vintage road bike, 54cm frame"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Price" htmlFor="price" hint="Enter 0 to give it away for free.">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[15px] text-ink-3">
                  $
                </span>
                <input
                  id="price"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`${inputCls} pl-8 font-mono`}
                />
              </div>
            </Field>
            <div>
              <p className="mb-2 text-[14px] font-medium text-ink">Category</p>
              <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const active = category === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={c.label}
                      onClick={() => setCategory(c.slug)}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[13px] font-medium transition ${
                        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-ink hover:text-ink"
                      }`}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink"
                        style={{ backgroundColor: c.tint }}
                      >
                        <CategoryIcon name={c.icon} className="h-4 w-4" />
                      </span>
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* 03 Details */}
          <Section n="03" title="Details">
            <Field label="Description" htmlFor="description" counter={`${description.length}/5000`}>
              <textarea
                id="description"
                required
                rows={5}
                maxLength={5000}
                placeholder="Condition, age, what's included, why you're selling…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputCls} resize-y`}
              />
            </Field>
            <Field label="Location" htmlFor="location" hint="Optional. A neighborhood or city is plenty.">
              <input
                id="location"
                maxLength={120}
                placeholder="e.g. Palo Alto, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputCls}
              />
            </Field>
          </Section>

          {/* 04 Contact */}
          <Section n="04" title="Contact" hint="Buyers' messages come to your inbox; you reply from this email.">
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </Field>
          </Section>

          {error && (
            <p role="alert" className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[14px] text-accent-dark">
              {error}
            </p>
          )}

          <div className="sticky bottom-20 z-10 flex items-center gap-3 rounded-full border border-line bg-card/95 p-2 pl-5 shadow-[var(--shadow-lift)] backdrop-blur md:bottom-4">
            <span className="hidden text-[13px] text-ink-3 sm:block">
              {done === 4 ? "Looks good. Ready when you are." : "Fill in the steps above to publish."}
            </span>
            <button
              type="submit"
              disabled={busy}
              className="ml-auto flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-[15px] font-semibold text-white transition hover:bg-accent-dark active:scale-[0.98] disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "uploading" ? "Uploading photo…" : status === "saving" ? "Publishing…" : "Publish listing"}
            </button>
          </div>
        </form>

        {/* Live preview */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="eyebrow text-ink-3">Live preview</p>
            <div className="mt-3 rotate-1 rounded-[26px] border border-line bg-card p-3 shadow-[var(--shadow-lift)] transition hover:rotate-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-paper-2">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-ink-3">
                    <Camera className="h-8 w-8" />
                    <span className="eyebrow mt-2">Your photo</span>
                  </div>
                )}
                {price === "" ? (
                  <span className="absolute bottom-3 left-3 -rotate-2 rounded-full border border-dashed border-ink-3 bg-card/80 px-2.5 py-0.5 font-mono text-[12px] text-ink-3">
                    $ price
                  </span>
                ) : (
                  <PriceTag price={Number(price) || 0} size="sm" className="absolute bottom-3 left-3 -rotate-2" />
                )}
              </div>
              <div className="px-1 pb-1 pt-3">
                <p className={`line-clamp-2 text-[15px] font-medium leading-snug ${title ? "text-ink" : "text-ink-3"}`}>
                  {title || "Your item's title"}
                </p>
                <p className="eyebrow mt-1.5 text-ink-3">
                  {location || cat?.label || "Location"} · now
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-paper-2/70 p-3">
              <Avatar label={sellerName} seed={defaultEmail} size={36} />
              <div className="min-w-0 text-[13px]">
                <p className="font-semibold">{sellerName}</p>
                <p className="text-ink-3">Listing publicly to Wayne Market</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Section({
  n,
  title,
  hint,
  children,
}: {
  n: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 sm:grid-cols-[140px_1fr]">
      <div>
        <p className="font-mono text-[13px] text-accent">{n}</p>
        <h2 className="mt-1 font-serif text-[28px] leading-none">{title}</h2>
        {hint && <p className="mt-2 text-[13px] leading-snug text-ink-3">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="text-[14px] font-medium text-ink">
          {label}
        </label>
        {counter && <span className="font-mono text-[11px] text-ink-3">{counter}</span>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}
