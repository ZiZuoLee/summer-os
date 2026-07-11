import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");
const schema = readFileSync(
  join(migrationDirectory, "202607110001_initial_schema.sql"),
  "utf8",
);
const security = readFileSync(
  join(migrationDirectory, "202607110002_security_and_triggers.sql"),
  "utf8",
);
const rpcs = readFileSync(
  join(migrationDirectory, "202607110003_transactional_rpcs.sql"),
  "utf8",
);
const helpers = readFileSync(
  join(migrationDirectory, "202607110004_safe_plan_helpers.sql"),
  "utf8",
);

const userTables = [
  "profiles",
  "app_preferences",
  "plan_cycles",
  "recurring_commitments",
  "daily_plans",
  "daily_commitments",
  "plan_tasks",
  "daily_logs",
  "workout_sessions",
  "ielts_sessions",
  "ielts_errors",
  "gre_programs",
  "gre_decisions",
  "gre_checklist_items",
  "weekly_reviews",
  "health_alerts",
  "alert_acknowledgements",
  "seed_runs",
] as const;

describe("database migrations", () => {
  it("creates the complete user-owned schema and enables forced RLS", () => {
    for (const table of userTables) {
      expect(schema).toMatch(
        new RegExp(`create table public\\.${table}\\s*\\(`, "i"),
      );
      expect(security).toContain(
        `alter table public.${table} enable row level security;`,
      );
      expect(security).toContain(
        `alter table public.${table} force row level security;`,
      );
    }
  });

  it("uses composite parent ownership constraints on every nested resource", () => {
    for (const constraint of [
      "recurring_commitments_cycle_owner_fk",
      "daily_plans_cycle_owner_fk",
      "daily_commitments_plan_owner_fk",
      "plan_tasks_plan_owner_fk",
      "ielts_errors_session_owner_fk",
      "gre_decisions_cycle_owner_fk",
      "gre_checklist_items_cycle_owner_fk",
      "weekly_reviews_cycle_owner_fk",
      "alert_acknowledgements_alert_owner_fk",
      "seed_runs_cycle_owner_fk",
    ]) {
      expect(schema).toContain(`constraint ${constraint}`);
    }
    expect(
      schema.match(/foreign key \([^)]*user_id[^)]*\)/g)?.length,
    ).toBeGreaterThanOrEqual(10);
  });

  it("derives RPC identity from auth.uid and exposes no user-id parameter", () => {
    for (const name of [
      "seed_plan_cycle",
      "submit_daily_checkin",
      "set_task_status",
    ]) {
      const start = rpcs.indexOf(`create or replace function public.${name}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const body = rpcs.slice(start, rpcs.indexOf("$$;", start) + 3);
      expect(body).toContain("auth.uid()");
      expect(body).not.toMatch(/p_user_id/i);
    }
  });

  it("implements idempotency, optimistic concurrency, beta capacity, and safe plan helpers", () => {
    expect(rpcs).toContain(
      "Idempotency key was already used with a different payload",
    );
    expect(rpcs).toContain("and row_version = p_expected_row_version");
    expect(security).toContain("hook_enforce_beta_capacity");
    expect(security).toContain("v_user_count >= v_max_users");
    expect(helpers).toContain(
      "create or replace function public.duplicate_plan_day",
    );
    expect(helpers).toContain(
      "create or replace function public.reset_plan_progress",
    );
    expect(helpers).toContain(
      "p_confirmation is distinct from ('RESET ' || p_plan_cycle_id::text)",
    );
    expect(helpers).toContain(
      "grant execute on function public.duplicate_plan_day(date, date) to authenticated",
    );
    expect(helpers).not.toMatch(/grant execute[^;]+\bto\s+(?:anon|public)\b/i);
  });

  it("stores explicit skipped state for every optional intake/check-in metric", () => {
    for (const column of [
      "weight_skipped",
      "waist_skipped",
      "sleep_skipped",
      "steps_skipped",
      "water_skipped",
      "protein_skipped",
      "calories_skipped",
    ]) {
      expect(schema).toContain(`${column} boolean not null default false`);
      expect(rpcs).toContain(column);
    }
  });
});
