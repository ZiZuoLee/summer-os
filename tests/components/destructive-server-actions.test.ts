import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  adminClient,
  createAdminClient,
  createClient,
  revalidatePath,
  redirect,
  userClient,
} = vi.hoisted(() => {
  const userClient = {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
  };
  const adminClient = {
    auth: { admin: { deleteUser: vi.fn() } },
  };
  return {
    adminClient,
    createAdminClient: vi.fn(() => adminClient),
    createClient: vi.fn(async () => userClient),
    revalidatePath: vi.fn(),
    redirect: vi.fn(),
    userClient,
  };
});

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: () => true,
  publicEnv: { demoMode: false },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import {
  deleteAccountAction,
  resetPlanProgressAction,
} from "@/app/(dashboard)/actions";

const idle = { status: "idle" } as const;
const cycleId = "e76ab2bf-7221-4810-b875-ebeb62fe6312";

describe("destructive server action validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "8afdb0d5-4cbd-4a68-8327-d0de88cd75e4",
          email: "person@example.com",
        },
      },
    });
  });

  it("rejects an account deletion before reauthentication when typed identity does not match", async () => {
    const data = new FormData();
    data.set("email", "other@example.com");
    data.set("password", "StrongPassword123");
    data.set("confirmation", "DELETE");

    const result = await deleteAccountAction(idle, data);

    expect(result).toEqual({
      status: "error",
      message: "邮箱或确认文字不匹配。",
    });
    expect(userClient.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("requires recent password reauthentication before invoking the admin client", async () => {
    userClient.auth.signInWithPassword.mockResolvedValue({
      error: new Error("invalid password"),
    });
    const data = new FormData();
    data.set("email", "person@example.com");
    data.set("password", "wrong-password");
    data.set("confirmation", "DELETE");

    const result = await deleteAccountAction(idle, data);

    expect(result).toEqual({
      status: "error",
      message: "密码不正确，账号未删除。",
    });
    expect(userClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "wrong-password",
    });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(adminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects an inexact plan-reset phrase before any database call", async () => {
    const data = new FormData();
    data.set("cycleId", cycleId);
    data.set("confirmation", "RESET");

    const result = await resetPlanProgressAction(idle, data);

    expect(result).toEqual({
      status: "error",
      message: "确认文字不匹配，未进行重置。",
    });
    expect(createClient).not.toHaveBeenCalled();
    expect(userClient.rpc).not.toHaveBeenCalled();
  });

  it("accepts only the exact cycle-bound reset phrase", async () => {
    userClient.rpc.mockResolvedValue({ error: null });
    const data = new FormData();
    data.set("cycleId", cycleId);
    data.set("confirmation", `RESET ${cycleId}`);

    const result = await resetPlanProgressAction(idle, data);

    expect(userClient.rpc).toHaveBeenCalledWith("reset_plan_progress", {
      p_plan_cycle_id: cycleId,
      p_confirmation: `RESET ${cycleId}`,
    });
    expect(result.status).toBe("success");
  });
});
