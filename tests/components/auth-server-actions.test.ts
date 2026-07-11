import { beforeEach, describe, expect, it, vi } from "vitest";

const { authClient, createClient, redirect, turnstile } = vi.hoisted(() => {
  const authClient = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  };
  return {
    authClient,
    createClient: vi.fn(async () => ({ auth: authClient })),
    redirect: vi.fn(),
    turnstile: vi.fn(),
  };
});

vi.mock("@/lib/env", () => ({
  getSiteUrl: () => "https://summer-os.vercel.app",
  isSupabaseConfigured: () => true,
  publicEnv: { demoMode: false },
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstileToken: turnstile }));
vi.mock("next/navigation", () => ({ redirect }));

import {
  forgotPasswordAction,
  loginAction,
  signupAction,
} from "@/app/(auth)/actions";

const idle = { status: "idle" } as const;

function loginData() {
  const data = new FormData();
  data.set("email", "person@example.com");
  data.set("password", "any-password");
  return data;
}

function signupData() {
  const data = new FormData();
  data.set("displayName", "夏日用户");
  data.set("email", "person@example.com");
  data.set("password", "StrongPassword123");
  data.set("passwordConfirm", "StrongPassword123");
  data.set("ageConfirmed", "on");
  data.set("disclaimerAccepted", "on");
  data.set("turnstileToken", "verified-token");
  return data;
}

describe("authentication server action safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    turnstile.mockResolvedValue(true);
  });

  it("returns the same login error for different provider account states", async () => {
    authClient.signInWithPassword
      .mockResolvedValueOnce({ error: new Error("invalid login credentials") })
      .mockResolvedValueOnce({ error: new Error("email not confirmed") });

    const unknownAccount = await loginAction(idle, loginData());
    const unverifiedAccount = await loginAction(idle, loginData());

    expect(unknownAccount).toEqual(unverifiedAccount);
    expect(unknownAccount).toEqual({
      status: "error",
      message: "邮箱或密码不正确，请重试。",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("fails closed when signup Turnstile verification is rejected", async () => {
    turnstile.mockResolvedValue(false);

    const result = await signupAction(idle, signupData());

    expect(result).toEqual({
      status: "error",
      message: "安全验证未通过，请刷新后重试。",
    });
    expect(authClient.signUp).not.toHaveBeenCalled();
  });

  it("fails closed when password-reset Turnstile verification is missing", async () => {
    turnstile.mockResolvedValue(false);
    const data = new FormData();
    data.set("email", "person@example.com");

    const result = await forgotPasswordAction(idle, data);

    expect(turnstile).toHaveBeenCalledWith(null);
    expect(result).toEqual({
      status: "error",
      message: "安全验证未通过，请重试。",
    });
    expect(authClient.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("does not call providers when signup validation fails", async () => {
    const data = signupData();
    data.set("passwordConfirm", "different-password");
    data.delete("ageConfirmed");

    const result = await signupAction(idle, data);

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("passwordConfirm");
    expect(result.fieldErrors).toHaveProperty("ageConfirmed");
    expect(turnstile).not.toHaveBeenCalled();
    expect(authClient.signUp).not.toHaveBeenCalled();
  });

  it("turns the transactional beta-capacity rejection into clear public copy", async () => {
    authClient.signUp.mockResolvedValue({
      error: new Error("Beta capacity reached"),
    });

    const result = await signupAction(idle, signupData());

    expect(result).toEqual({
      status: "error",
      message: "公开测试名额已满，感谢你的关注。",
    });
  });

  it("keeps password-reset responses enumeration-safe", async () => {
    authClient.resetPasswordForEmail
      .mockResolvedValueOnce({ error: new Error("unknown email") })
      .mockResolvedValueOnce({ error: null });
    const first = new FormData();
    first.set("email", "unknown@example.com");
    first.set("turnstileToken", "one");
    const second = new FormData();
    second.set("email", "known@example.com");
    second.set("turnstileToken", "two");

    const unknownAccount = await forgotPasswordAction(idle, first);
    const knownAccount = await forgotPasswordAction(idle, second);

    expect(unknownAccount).toEqual(knownAccount);
    expect(knownAccount.status).toBe("success");
    expect(knownAccount.message).toMatch(/如果该邮箱存在/);
  });
});
