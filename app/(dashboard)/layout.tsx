import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { signOutAction } from "@/app/(auth)/actions";
import { DraftPrivacyGuard } from "@/components/draft-privacy";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName = "Kirito";
  const user = await getCurrentUser();

  if (isSupabaseConfigured() && !publicEnv.demoMode) {
    if (!user) redirect("/login");
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name,onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarding_completed) redirect("/onboarding");
    userName =
      profile.display_name ||
      String(user.user_metadata.display_name ?? "夏日用户");
  }

  return (
    <>
      <DraftPrivacyGuard userId={user?.id} />
      <AppShell
        userName={userName}
        signOutAction={
          isSupabaseConfigured() && !publicEnv.demoMode
            ? signOutAction
            : undefined
        }
        demoMode={publicEnv.demoMode || !isSupabaseConfigured()}
        title="Summer OS"
        eyebrow="非商业公开测试"
      >
        {children}
      </AppShell>
    </>
  );
}
