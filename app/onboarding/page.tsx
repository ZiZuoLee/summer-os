import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { OnboardingForm } from "@/app/onboarding/_components/onboarding-form";

export const metadata: Metadata = { title: "开始设置" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) redirect("/login?next=/onboarding");
  return (
    <main className="onboarding-page">
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <div className="auth-eyebrow mx-auto w-fit">约 2 分钟完成</div>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
          把你的夏天装进一个清晰的系统
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
          确认目标、日程和记录偏好。生成过程是确定性的，任何计划都可以安全编辑或重置。
        </p>
        {publicEnv.demoMode ? (
          <p className="mt-3 text-sm text-cyan-300">
            演示模式：提交后进入独立演示仪表盘，不会写入真实数据。
          </p>
        ) : null}
      </header>
      <div className="mx-auto max-w-4xl">
        <OnboardingForm
          defaultName={String(user?.user_metadata.display_name ?? "Kirito")}
        />
      </div>
    </main>
  );
}
