"use server";

import { redirect } from "next/navigation";
import { getSiteUrl, isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
  updatePasswordSchema,
} from "@/lib/auth/validation";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function fields(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function safeNextPath(value: FormDataEntryValue | null, fallback = "/today") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }
  return value;
}

function configError(): AuthActionState {
  return {
    status: "error",
    message: publicEnv.demoMode
      ? "本地演示模式不创建账号。请直接进入演示仪表盘。"
      : "账号服务尚未配置，请稍后再试。",
  };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return configError();
  const parsed = loginSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: "邮箱或密码不正确，请重试。" };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return configError();
  const parsed = signupSchema.safeParse(fields(formData));
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const password = formData.get("password");
    const passwordConfirm = formData.get("passwordConfirm");
    if (
      typeof password === "string" &&
      typeof passwordConfirm === "string" &&
      password !== passwordConfirm
    ) {
      fieldErrors.passwordConfirm = ["两次输入的密码不一致"];
    }
    return { status: "error", fieldErrors };
  }

  const turnstileOk = await verifyTurnstileToken(
    parsed.data.turnstileToken ?? null,
  );
  if (!turnstileOk) {
    return { status: "error", message: "安全验证未通过，请刷新后重试。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/onboarding`,
      data: {
        display_name: parsed.data.displayName,
        age_confirmed: true,
        health_disclaimer_accepted: true,
      },
    },
  });
  if (error?.message.toLowerCase().includes("beta capacity")) {
    return { status: "error", message: "公开测试名额已满，感谢你的关注。" };
  }
  if (error) {
    return { status: "error", message: "暂时无法创建账号，请稍后再试。" };
  }
  return {
    status: "success",
    message: "如果该邮箱可以注册，我们已发送确认邮件。请检查收件箱和垃圾邮件。",
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return configError();
  const parsed = forgotPasswordSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const turnstileOk = await verifyTurnstileToken(
    parsed.data.turnstileToken ?? null,
  );
  if (!turnstileOk)
    return { status: "error", message: "安全验证未通过，请重试。" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/update-password`,
  });
  return {
    status: "success",
    message: "如果该邮箱存在，我们已发送密码重置邮件。",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return configError();
  const parsed = updatePasswordSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return { status: "error", message: "重置链接已失效，请重新申请。" };
  return { status: "success", message: "密码已更新，现在可以返回登录。" };
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
