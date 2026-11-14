import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateListingForm } from "@/components/CreateListingForm";

export const metadata = { title: "Sell something · Wayne Market" };

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/create");

  return (
    <CreateListingForm
      userId={user.id}
      defaultEmail={user.email ?? ""}
      sellerName={(user.user_metadata?.full_name as string) || user.email || "You"}
    />
  );
}
