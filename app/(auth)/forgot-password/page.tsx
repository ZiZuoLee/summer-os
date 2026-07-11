import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { forgotPasswordAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "找回密码" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="账号恢复"
      title="找回密码"
      description="输入注册邮箱。如果账号存在，我们会发送安全的重置链接。"
      footer={<Link href="/login">返回登录</Link>}
    >
      <AuthForm
        action={forgotPasswordAction}
        submitLabel="发送重置邮件"
        turnstile
        fields={[
          {
            name: "email",
            label: "邮箱",
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          },
        ]}
      />
    </AuthShell>
  );
}
