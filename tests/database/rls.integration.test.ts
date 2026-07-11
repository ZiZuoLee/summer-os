import {
  generateFlexPlan,
  generateKiritoPlan,
  toSeedPlanRpcArgs,
} from "@/lib/seed";
import type { Database } from "@/types/database.generated";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const integrationEnabled =
  url.startsWith("http") &&
  anonKey.length > 20 &&
  serviceKey.length > 20 &&
  !anonKey.includes("placeholder") &&
  !serviceKey.includes("placeholder");

const integration = describe.skipIf(!integrationEnabled);

integration("Supabase ownership and transactional RPCs", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const password = `Summer-OS-Test-${crypto.randomUUID()}!A7`;
  const emails = [
    `rls-a-${suffix}@example.test`,
    `rls-b-${suffix}@example.test`,
  ];
  const userIds: string[] = [];
  let admin: SupabaseClient<Database>;
  let userA: SupabaseClient<Database>;
  let userB: SupabaseClient<Database>;
  let cycleId: string;
  let sourcePlanId: string;
  let sourceTaskId: string;

  beforeAll(async () => {
    admin = createClient<Database>(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    for (const email of emails) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          adult_acknowledged: true,
          health_disclaimer_accepted: true,
        },
      });
      if (error) throw error;
      userIds.push(data.user.id);
    }

    const createSignedInClient = async (email: string) => {
      const client = createClient<Database>(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return client;
    };
    [userA, userB] = await Promise.all(emails.map(createSignedInClient));

    const flexFixture = generateFlexPlan({
      startDate: "2030-01-07",
      endDate: "2030-01-20",
      timezone: "Asia/Singapore",
    });
    const payloadHash = flexFixture.payloadHash;
    const { data: cycle, error: cycleError } = await userA
      .from("plan_cycles")
      .insert({
        user_id: userIds[0],
        template_key: "summer-os-flex@1",
        template_version: 1,
        timezone: "Asia/Singapore",
        start_date: "2030-01-07",
        end_date: "2030-01-20",
        payload_hash: payloadHash,
        seed_payload: toSeedPlanRpcArgs(flexFixture, `fixture:${suffix}`)
          .p_days,
      })
      .select("id")
      .single();
    if (cycleError) throw cycleError;
    cycleId = cycle.id;

    const { data: plan, error: planError } = await userA
      .from("daily_plans")
      .insert({
        user_id: userIds[0],
        plan_cycle_id: cycleId,
        plan_date: "2030-01-07",
        day_category: "FLEX_DAY",
        intensity: "MODERATE",
        title: "Owned source plan",
        summary: "RLS fixture",
        minimum_mode_enabled: true,
      })
      .select("id")
      .single();
    if (planError) throw planError;
    sourcePlanId = plan.id;

    const { data: task, error: taskError } = await userA
      .from("plan_tasks")
      .insert({
        user_id: userIds[0],
        daily_plan_id: sourcePlanId,
        title: "Preserved custom task",
        category: "PERSONAL",
        estimated_minutes: 15,
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (taskError) throw taskError;
    sourceTaskId = task.id;
  }, 30_000);

  afterAll(async () => {
    await Promise.all(userIds.map((id) => admin.auth.admin.deleteUser(id)));
  });

  it("isolates select, insert, update, and delete across two real users", async () => {
    const ownLog = {
      user_id: userIds[0],
      log_date: "2030-01-07",
      weight_kg: 80,
      weight_skipped: false,
    };
    expect((await userA.from("daily_logs").insert(ownLog)).error).toBeNull();

    const crossInsert = await userB.from("daily_logs").insert({
      ...ownLog,
      log_date: "2030-01-08",
    });
    expect(crossInsert.error).not.toBeNull();

    const crossSelect = await userB
      .from("daily_logs")
      .select("id")
      .eq("user_id", userIds[0]);
    expect(crossSelect.error).toBeNull();
    expect(crossSelect.data).toEqual([]);

    const crossUpdate = await userB
      .from("daily_logs")
      .update({ notes: "forged" })
      .eq("user_id", userIds[0])
      .select("id");
    expect(crossUpdate.error).toBeNull();
    expect(crossUpdate.data).toEqual([]);

    const crossDelete = await userB
      .from("daily_logs")
      .delete()
      .eq("user_id", userIds[0])
      .select("id");
    expect(crossDelete.error).toBeNull();
    expect(crossDelete.data).toEqual([]);
  });

  it("rejects a forged parent even when the child carries the caller's user id", async () => {
    const forged = await userB.from("daily_plans").insert({
      user_id: userIds[1],
      plan_cycle_id: cycleId,
      plan_date: "2030-01-08",
      day_category: "FLEX_DAY",
      intensity: "LOW",
      title: "Forged parent",
    });
    expect(forged.error).not.toBeNull();
    expect(forged.error?.code).toBe("23503");
  });

  it("seeds exactly 50 days idempotently and hides them from the other user", async () => {
    const args = toSeedPlanRpcArgs(generateKiritoPlan(), crypto.randomUUID());
    const first = await userA.rpc("seed_plan_cycle", args);
    expect(first.error).toBeNull();
    expect(first.data).toEqual(
      expect.objectContaining({ inserted_plans: 50, replayed: false }),
    );

    const second = await userA.rpc("seed_plan_cycle", args);
    expect(second.error).toBeNull();
    expect(second.data).toEqual(
      expect.objectContaining({ inserted_plans: 50, replayed: true }),
    );

    const visibleA = await userA
      .from("daily_plans")
      .select("id", { count: "exact", head: true })
      .gte("plan_date", "2026-07-13")
      .lte("plan_date", "2026-08-31");
    const visibleB = await userB
      .from("daily_plans")
      .select("id", { count: "exact", head: true })
      .gte("plan_date", "2026-07-13")
      .lte("plan_date", "2026-08-31");
    expect(visibleA.count).toBe(50);
    expect(visibleB.count).toBe(0);
  }, 30_000);

  it("makes compound check-in retries replay-safe", async () => {
    const args = {
      p_idempotency_key: crypto.randomUUID(),
      p_log: {
        log_date: "2030-01-09",
        weight_kg: null,
        weight_skipped: true,
        calories_skipped: true,
        nutrition_quality_flags: ["REGULAR_MEALS"],
      },
      p_workout: { workout_type: "Walk", duration_minutes: 30, rpe: 3 },
      p_ielts: null,
    };
    const first = await userA.rpc("submit_daily_checkin", args);
    const second = await userA.rpc("submit_daily_checkin", args);
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(first.data).toEqual(expect.objectContaining({ replayed: false }));
    expect(second.data).toEqual(expect.objectContaining({ replayed: true }));
    const workouts = await userA
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("session_date", "2030-01-09");
    expect(workouts.count).toBe(1);
  });

  it("duplicates only owned sources, rejects occupied targets, and requires exact reset confirmation", async () => {
    const duplicate = await userA.rpc("duplicate_plan_day", {
      p_source_date: "2030-01-07",
      p_target_date: "2030-01-08",
    });
    expect(duplicate.error).toBeNull();
    expect(duplicate.data).toEqual(
      expect.objectContaining({ copied_tasks: 1 }),
    );

    expect(
      (
        await userA.rpc("duplicate_plan_day", {
          p_source_date: "2030-01-07",
          p_target_date: "2030-01-08",
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await userB.rpc("duplicate_plan_day", {
          p_source_date: "2030-01-07",
          p_target_date: "2030-01-10",
        })
      ).error,
    ).not.toBeNull();

    expect(
      (
        await userA.rpc("reset_plan_progress", {
          p_plan_cycle_id: cycleId,
          p_confirmation: "RESET",
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await userB.rpc("reset_plan_progress", {
          p_plan_cycle_id: cycleId,
          p_confirmation: `RESET ${cycleId}`,
        })
      ).error,
    ).not.toBeNull();

    const reset = await userA.rpc("reset_plan_progress", {
      p_plan_cycle_id: cycleId,
      p_confirmation: `RESET ${cycleId}`,
    });
    expect(reset.error).toBeNull();
    expect(reset.data).toEqual(
      expect.objectContaining({
        reset_tasks: 0,
        completions_preserved: true,
        tracking_history_preserved: true,
      }),
    );
    const task = await userA
      .from("plan_tasks")
      .select("status,title")
      .eq("id", sourceTaskId)
      .single();
    expect(task.data).toEqual({
      status: "COMPLETED",
      title: "Preserved custom task",
    });
    expect(
      (
        await userA
          .from("daily_logs")
          .select("id")
          .eq("log_date", "2030-01-07")
          .single()
      ).data,
    ).not.toBeNull();
  });
});
