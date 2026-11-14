"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DeleteListingButton({
  id,
  imagePath,
  redirectTo = "/selling",
  compact,
}: {
  id: string;
  imagePath: string | null;
  redirectTo?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      setBusy(false);
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    if (imagePath) await supabase.storage.from("listing-images").remove([imagePath]);
    // Full navigation so a prefetched copy of the target page (still showing this listing) isn't reused.
    window.location.assign(redirectTo);
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      aria-label="Delete listing"
      title="Delete listing"
      className={`flex items-center justify-center gap-1.5 rounded-full border border-line bg-card font-semibold text-ink-2 transition hover:border-accent hover:bg-accent hover:text-white disabled:opacity-60 ${
        compact ? "h-10 w-10" : "px-5 py-3 text-[15px]"
      }`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {!compact && "Delete"}
    </button>
  );
}
