import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { signupAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "创建账号" };

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="100 人公开测试"
      title="创建你的 Summer OS"
      description="用邮箱注册。确认邮件由 Brevo 免费服务发送，可能带有服务商标识。"
      footer={
        <p>
          已有账号？ <Link href="/login">直接登录</Link>
        </p>
      }
    >
      <AuthForm
        action={signupAction}
        submitLabel="创建账号"
        turnstile
        signupConsent
        fields={[
          {
            name: "displayName",
            label: "昵称",
            autoComplete: "nickname",
            placeholder: "怎么称呼你",
          },
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
            autoComplete: "new-password",
            placeholder: "至少 12 位，含大小写字母和数字",
          },
          {
            name: "passwordConfirm",
            label: "确认密码",
            type: "password",
            autoComplete: "new-password",
            placeholder: "再次输入密码",
          },
        ]}
      />
    </AuthShell>
  );
}
