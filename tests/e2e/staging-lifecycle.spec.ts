import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const stagingEnabled = process.env.E2E_STAGING === "true";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const adminKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  "";

test.describe("hosted staging release lifecycle", () => {
  test.skip(
    !stagingEnabled,
    "Requires E2E_STAGING=true and hosted staging Supabase credentials.",
  );

  test("onboarding and all primary workflows persist against hosted staging", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    expect(supabaseUrl).toMatch(/^https:\/\/[a-z]+\.supabase\.co$/);
    expect(adminKey.length).toBeGreaterThan(20);

    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `staging-smoke-${runId}@example.test`;
    const password = `Summer-OS-Staging-${runId}!Aa7`;
    const admin = createSupabaseClient(supabaseUrl, adminKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    let userId = "";

    try {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: "Staging Smoke",
            age_confirmed: true,
            health_disclaimer_accepted: true,
          },
        });
      if (createError) throw createError;
      userId = created.user.id;

      await test.step("login and seed the canonical 50-day plan", async () => {
        await page.goto("/login");
        await page.getByLabel("邮箱").fill(email);
        await page.getByLabel("密码").fill(password);
        await page.getByRole("button", { name: "登录" }).click();
        await expect(page).toHaveURL(/\/onboarding$/, { timeout: 20_000 });
        await page.getByRole("button", { name: "创建我的 Summer OS" }).click();
        await expect(page).toHaveURL(/\/today$/, { timeout: 45_000 });

        await page.goto("/calendar");
        const julyDates = await page
          .locator('a[href^="/plan?date="]')
          .evaluateAll((links) =>
            links.map((link) => (link as HTMLAnchorElement).href),
          );
        await page.getByRole("button", { name: "下个月" }).click();
        const augustDates = await page
          .locator('a[href^="/plan?date="]')
          .evaluateAll((links) =>
            links.map((link) => (link as HTMLAnchorElement).href),
          );
        expect(new Set([...julyDates, ...augustDates]).size).toBe(50);
      });

      await test.step("persist Today task and atomic check-in", async () => {
        await page.goto("/today");
        const pendingTask = page.locator(
          '[role="checkbox"][aria-checked="false"]',
        );
        expect(await pendingTask.count()).toBeGreaterThan(0);
        const task = pendingTask.first();
        const label = await task.getAttribute("aria-label");
        await task.click();
        await expect(
          page.getByRole("checkbox", {
            name: label!.replace(/^标记完成：/, "取消完成："),
          }),
        ).toHaveAttribute("aria-checked", "true");

        await page.goto("/check-in");
        await page.getByLabel("体重（kg）").fill("82.2");
        await page.getByLabel("睡眠时长（小时）").fill("7.6");
        await page.locator('input[name="steps"]').fill("9100");
        await page
          .getByLabel("今天的备注（可选）")
          .fill("Hosted staging synthetic smoke record");
        await page.getByRole("button", { name: "完成今日打卡" }).click();
        await expect(page.getByRole("status")).toContainText(
          "今天的打卡已安全保存",
          { timeout: 20_000 },
        );
      });

      await test.step("persist IELTS, GRE, weekly review, and plan edit", async () => {
        await page.goto("/ielts");
        await page.getByLabel("技能").selectOption("READING");
        await page.getByLabel("材料 / 来源").fill("Hosted staging smoke");
        await page.getByLabel("实际分钟").fill("28");
        await page.getByLabel("下一步").fill("Review evidence mapping");
        const ieltsSubmit = page.getByRole("button", {
          name: "记录 IELTS 练习",
        });
        await ieltsSubmit.click();
        await expect(
          ieltsSubmit.locator("xpath=ancestor::form").getByRole("status"),
        ).toContainText("IELTS 练习已记录");

        await page.goto("/gre");
        await page
          .getByLabel("大学", { exact: true })
          .fill("Synthetic University");
        await page
          .getByLabel("项目", { exact: true })
          .fill("Synthetic Programme");
        await page
          .getByLabel("官方要求 HTTPS 链接")
          .fill("https://example.com/staging-smoke");
        const greSubmit = page.getByRole("button", { name: "添加项目要求" });
        await greSubmit.click();
        await expect(
          greSubmit.locator("xpath=ancestor::form").getByText(/项目要求已记录/),
        ).toBeVisible();

        await page.goto("/weekly-review");
        await page
          .getByLabel("本周最值得肯定的事")
          .fill("Hosted workflow verification completed.");
        await page.getByLabel("遇到的阻力").fill("Synthetic test friction.");
        await page
          .getByLabel("下周要调整什么")
          .fill("Keep the smallest useful step.");
        await page.getByLabel("恢复感受").selectOption("3");
        await page.getByLabel("下周唯一焦点").fill("Stable daily check-in");
        const reviewSubmit = page.getByRole("button", {
          name: "保存本周复盘",
        });
        await reviewSubmit.click();
        await expect(
          reviewSubmit.locator("xpath=ancestor::form").getByRole("status"),
        ).toContainText("周复盘已保存");

        await page.goto("/plan?date=2026-07-13");
        await page.getByLabel("当天标题").fill("Hosted staging edited title");
        const planSubmit = page.getByRole("button", { name: "保存当天计划" });
        await planSubmit.click();
        await expect(
          planSubmit.locator("xpath=ancestor::form").getByRole("status"),
        ).toContainText("当天计划已保存");
      });

      await test.step("analytics, export, persistence, and deletion", async () => {
        await page.goto("/analytics");
        await expect(
          page.getByRole("heading", { name: "看见长期变化" }),
        ).toBeVisible();

        const exportResponse = await page.evaluate(async () => {
          const response = await fetch("/api/export?format=json", {
            credentials: "same-origin",
          });
          return {
            ok: response.ok,
            cacheControl: response.headers.get("cache-control"),
            body: await response.json(),
          };
        });
        expect(exportResponse.ok).toBe(true);
        expect(exportResponse.cacheControl).toContain("private, no-store");
        const exported = exportResponse.body;
        expect(exported.datasets.daily_plans).toHaveLength(50);
        expect(exported.datasets.daily_logs[0].weight_kg).toBe(82.2);

        await page.goto("/settings");
        await page.getByLabel("确认邮箱").fill(email);
        await page.getByLabel("当前密码").fill(password);
        await page.getByLabel("输入 DELETE").fill("DELETE");
        await page.getByRole("button", { name: "永久删除我的账户" }).click();
        await expect(page).toHaveURL(/\/\?deleted=1$/, { timeout: 30_000 });
        userId = "";
      });
    } finally {
      if (userId) await admin.auth.admin.deleteUser(userId, false);
    }
  });
});
