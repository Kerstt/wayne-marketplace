import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

/** Split-screen auth layout: a fanned set of real listing "polaroids" on the left, the form on the right. */
export async function AuthShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("id,title,price,image_url")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(3);
  const picks = data ?? [];
  const fan = ["-rotate-[8deg] translate-y-4", "rotate-[3deg] -translate-y-2 z-10", "-rotate-[2deg] translate-y-6"];

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-ink p-12 text-paper lg:flex">
        <p className="eyebrow text-paper/60">Wayne Market · Est. 2026</p>

        {picks.length > 0 && (
          <div className="flex justify-center pt-2" aria-hidden>
            {picks.map((p, i) => (
              <figure
                key={p.id}
                className={`relative -mx-4 w-[200px] shrink-0 rounded-[4px] bg-card p-2.5 pb-11 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] xl:w-[220px] ${fan[i]}`}
              >
                <span className="absolute -top-2 left-1/2 h-5 w-14 -translate-x-1/2 rotate-2 bg-sun/80" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url!} alt="" className="aspect-square w-full rounded-[2px] object-cover" />
                <figcaption className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="truncate font-serif text-[17px] italic text-ink">{p.title}</span>
                  <span className="shrink-0 rounded-full bg-sun px-2 py-0.5 font-mono text-[11px] font-semibold text-ink">
                    {formatPrice(p.price)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div>
          <h2 className="font-serif text-[64px] leading-[0.88] tracking-[-0.02em] xl:text-[80px]">
            Buy it. Sell it.
            <br />
            <em className="text-accent">Down the street.</em>
          </h2>
          <div className="mt-6 flex items-end justify-between gap-6">
            <p className="max-w-sm text-[15px] leading-relaxed text-paper/70">
              The neighborhood&apos;s secondhand shop. No fees, no shipping labels. Just neighbors.
            </p>
            <p className="eyebrow shrink-0 text-paper/40">No fees · No shipping</p>
          </div>
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-12">{children}</section>
    </div>
  );
}
