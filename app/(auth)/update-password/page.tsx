import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { updatePasswordAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "设置新密码" };

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      eyebrow="设置新密码"
      title="保护你的账号"
      description="新密码至少 12 位，并包含大小写字母和数字。"
      footer={<Link href="/login">返回登录</Link>}
    >
      <AuthForm
        action={updatePasswordAction}
        submitLabel="更新密码"
        fields={[
          {
            name: "password",
            label: "新密码",
            type: "password",
            autoComplete: "new-password",
            placeholder: "输入新密码",
          },
          {
            name: "passwordConfirm",
            label: "确认新密码",
            type: "password",
            autoComplete: "new-password",
            placeholder: "再次输入新密码",
          },
        ]}
      />
    </AuthShell>
  );
}
