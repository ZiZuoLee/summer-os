import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { loginAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell
      eyebrow="欢迎回来"
      title="继续你的夏日节奏"
      description="登录后即可查看今天的计划、快速打卡和趋势变化。"
      footer={
        <p>
          还没有账号？ <Link href="/signup">加入公开测试</Link>
        </p>
      }
    >
      <AuthForm
        action={loginAction}
        submitLabel="登录"
        next={next}
        fields={[
          {
            name: "email",
            label: "邮箱",
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          },
          {
            name: "password",
            label: "密码",
            type: "password",
            autoComplete: "current-password",
            placeholder: "输入密码",
          },
        ]}
      />
      <div className="mt-4 text-right text-sm">
        <Link className="text-cyan-300 hover:underline" href="/forgot-password">
          忘记密码？
        </Link>
      </div>
    </AuthShell>
  );
}
