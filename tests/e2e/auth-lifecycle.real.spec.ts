import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const realAuthEnabled = process.env.E2E_REAL_AUTH === "true";
const mailpitUrl = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

type MailpitMessageSummary = {
  ID: string;
  To: Array<{ Address: string }>;
};
type MailpitMessage = {
  ID: string;
  body?: { html?: string; text?: string };
  html?: string;
  text?: string;
  HTML?: string;
  Text?: string;
};

async function waitForTurnstile(page: Page) {
  await expect(
    page.locator('input[name="turnstileToken"]'),
    "Cloudflare test widget did not issue a token",
  ).not.toHaveValue("", { timeout: 30_000 });
}

async function waitForNewMessage(
  request: APIRequestContext,
  mailbox: string,
  seenIds: Set<string>,
) {
  let messageId = "";
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpitUrl}/api/v1/messages`);
        if (!response.ok()) return false;
        const payload = (await response.json()) as {
          messages?: MailpitMessageSummary[];
        };
        const recipient = `${mailbox}@example.test`;
        messageId =
          payload.messages?.find(
            (message) =>
              !seenIds.has(message.ID) &&
              message.To.some((address) => address.Address === recipient),
          )?.ID ?? "";
        return Boolean(messageId);
      },
      {
        message: "Supabase Auth email did not arrive in Mailpit",
        timeout: 45_000,
        intervals: [500, 1_000, 2_000],
      },
    )
    .toBe(true);

  seenIds.add(messageId);
  const response = await request.get(
    `${mailpitUrl}/api/v1/message/${encodeURIComponent(messageId)}`,
  );
  expect(response.ok()).toBe(true);
  return (await response.json()) as MailpitMessage;
}

function emailActionUrl(message: MailpitMessage) {
  const source = [
    message.body?.html,
    message.body?.text,
    message.html,
    message.text,
    message.HTML,
    message.Text,
    JSON.stringify(message),
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/=\r?\n/g, "")
    .replace(/=3D/gi, "=")
    .replace(/&amp;|&#38;/gi, "&")
    .replace(/&#x3D;|&#61;/gi, "=");
  const url = source
    .match(/https?:\/\/[^\s"'<>]+/g)
    ?.map((candidate) => candidate.replace(/[),.;]+$/, ""))
    .find((candidate) => candidate.includes("/auth/v1/verify"));
  expect(
    url,
    "Mailpit message did not contain a Supabase verification URL",
  ).toBeTruthy();
  return url!;
}

async function removeTestUser(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !adminKey) return;

  const admin = createSupabaseClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  for (let pageNumber = 1; pageNumber <= 5; pageNumber += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: pageNumber,
      perPage: 100,
    });
    if (error) return;
    const user = data.users.find((candidate) => candidate.email === email);
    if (user) {
      await admin.auth.admin.deleteUser(user.id, false);
      return;
    }
    if (data.users.length < 100) return;
  }
}

test.describe("真实 Supabase 与 Mailpit 认证生命周期", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    !realAuthEnabled,
    "需要 E2E_REAL_AUTH=true、本地 Supabase、Mailpit 和 Cloudflare Turnstile 测试密钥。",
  );

  test("注册、验证、引导、持久化、重置密码、导出和删除", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    expect(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL is required",
    ).toBeTruthy();
    expect(
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY must use Cloudflare's local test key",
    ).toBeTruthy();
    expect(
      process.env.TURNSTILE_SECRET_KEY,
      "TURNSTILE_SECRET_KEY must use Cloudflare's local test secret",
    ).toBeTruthy();

    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const mailbox = `summer-os-e2e-${runId}`;
    const email = `${mailbox}@example.test`;
    const originalPassword = "Summer-OS-E2E-2026!aA";
    const resetPassword = "Summer-OS-E2E-2026!bB";
    const seenMessageIds = new Set<string>();

    try {
      await test.step("register a unique adult beta user", async () => {
        await page.goto("/signup");
        await page.getByLabel("昵称").fill("E2E 合成用户");
        await page.getByLabel("邮箱").fill(email);
        await page.getByLabel("密码", { exact: true }).fill(originalPassword);
        await page.getByLabel("确认密码").fill(originalPassword);
        await page.getByLabel("我确认已满 18 周岁。").check();
        await page.getByLabel(/我已阅读健康提示/).check();
        await waitForTurnstile(page);
        await page.getByRole("button", { name: "创建账号" }).click();
        await expect(page.getByRole("status")).toContainText(
          "我们已发送确认邮件",
          { timeout: 20_000 },
        );
      });

      const confirmationMessage = await waitForNewMessage(
        request,
        mailbox,
        seenMessageIds,
      );
      const confirmationUrl = emailActionUrl(confirmationMessage);

      await test.step("reject login until the email is confirmed", async () => {
        await page.goto("/login");
        await page.getByLabel("邮箱").fill(email);
        await page.getByLabel("密码").fill(originalPassword);
        await page.getByRole("button", { name: "登录" }).click();
        await expect(
          page.getByText("邮箱或密码不正确，请重试。", { exact: true }),
        ).toBeVisible();
        await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
      });

      await test.step("follow confirmation and seed exactly 50 dates", async () => {
        await page.goto(confirmationUrl);
        await expect(page).toHaveURL(/\/onboarding$/, { timeout: 20_000 });
        await page.getByRole("button", { name: "创建我的 Summer OS" }).click();
        await expect(page).toHaveURL(/\/today$/, { timeout: 45_000 });

        await page.goto("/calendar");
        const julyLinks = await page
          .locator('a[href^="/plan?date="]')
          .evaluateAll((links) =>
            links.map(
              (link) =>
                `${(link as HTMLAnchorElement).pathname}${(link as HTMLAnchorElement).search}`,
            ),
          );
        expect(new Set(julyLinks).size).toBe(19);
        await page.getByRole("button", { name: "下个月" }).click();
        const augustLinks = await page
          .locator('a[href^="/plan?date="]')
          .evaluateAll((links) =>
            links.map(
              (link) =>
                `${(link as HTMLAnchorElement).pathname}${(link as HTMLAnchorElement).search}`,
            ),
          );
        expect(new Set([...julyLinks, ...augustLinks]).size).toBe(50);
      });

      await test.step("persist a task update and atomic daily check-in", async () => {
        await page.goto("/today");
        const pendingTask = page
          .locator('[role="checkbox"][aria-checked="false"]')
          .first();
        const pendingLabel = await pendingTask.getAttribute("aria-label");
        expect(pendingLabel).toMatch(/^标记完成：/);
        await pendingTask.click();
        const completedLabel = pendingLabel!.replace(
          /^标记完成：/,
          "取消完成：",
        );
        await expect(
          page.getByRole("checkbox", { name: completedLabel }),
        ).toHaveAttribute("aria-checked", "true");
        await page.reload();
        await expect(
          page.getByRole("checkbox", { name: completedLabel }),
        ).toHaveAttribute("aria-checked", "true");

        await page.goto("/check-in");
        await page.getByLabel("体重（kg）").fill("82.4");
        await page.getByLabel("睡眠时长（小时）").fill("7.5");
        await page.locator('input[name="steps"]').fill("9300");
        await page
          .getByLabel("今天的备注（可选）")
          .fill("E2E synthetic check-in");
        await page.getByRole("button", { name: "完成今日打卡" }).click();
        await expect(page.getByRole("status")).toContainText(
          "今天的打卡已安全保存",
          { timeout: 20_000 },
        );
        await page.goto("/today");
        await expect(page.getByText("82.4 kg", { exact: true })).toBeVisible();
      });

      await test.step("export only this user's complete seeded data", async () => {
        const response = await page.request.get("/api/export?format=json");
        expect(response.ok()).toBe(true);
        expect(response.headers()["cache-control"]).toContain(
          "private, no-store",
        );
        const body = await response.json();
        expect(body.schemaVersion).toBe("summer-os-export@1");
        expect(body.datasets.daily_plans).toHaveLength(50);
        expect(body.datasets.daily_logs).toHaveLength(1);
        expect(body.datasets.daily_logs[0].weight_kg).toBe(82.4);
      });

      await test.step("log out and log back in with email and password", async () => {
        await page.getByRole("button", { name: "退出登录" }).click();
        await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
        await page.getByLabel("邮箱").fill(email);
        await page.getByLabel("密码").fill(originalPassword);
        await page.getByRole("button", { name: "登录" }).click();
        await expect(page).toHaveURL(/\/today$/, { timeout: 20_000 });
        await page.getByRole("button", { name: "退出登录" }).click();
        await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
      });

      await test.step("reset through Mailpit and use the new password", async () => {
        await page.goto("/forgot-password");
        await page.getByLabel("邮箱").fill(email);
        await waitForTurnstile(page);
        await page.getByRole("button", { name: "发送重置邮件" }).click();
        await expect(page.getByRole("status")).toContainText("如果该邮箱存在", {
          timeout: 20_000,
        });

        const resetMessage = await waitForNewMessage(
          request,
          mailbox,
          seenMessageIds,
        );
        await page.goto(emailActionUrl(resetMessage));
        await expect(page).toHaveURL(/\/update-password$/, {
          timeout: 20_000,
        });
        await page.getByLabel("新密码", { exact: true }).fill(resetPassword);
        await page.getByLabel("确认新密码").fill(resetPassword);
        await page.getByRole("button", { name: "更新密码" }).click();
        await expect(page.getByRole("status")).toContainText("密码已更新", {
          timeout: 20_000,
        });

        await page.goto("/today");
        await page.getByRole("button", { name: "退出登录" }).click();
        await page.getByLabel("邮箱").fill(email);
        await page.getByLabel("密码").fill(resetPassword);
        await page.getByRole("button", { name: "登录" }).click();
        await expect(page).toHaveURL(/\/today$/, { timeout: 20_000 });
      });

      await test.step("reauthenticate and delete the disposable account", async () => {
        await page.goto("/settings");
        await page.getByLabel("确认邮箱").fill(email);
        await page.getByLabel("当前密码").fill(resetPassword);
        await page.getByLabel("输入 DELETE").fill("DELETE");
        await page.getByRole("button", { name: "永久删除我的账户" }).click();
        await expect(page).toHaveURL(/\/\?deleted=1$/, { timeout: 30_000 });

        await page.goto("/login");
        await page.getByLabel("邮箱").fill(email);
        await page.getByLabel("密码").fill(resetPassword);
        await page.getByRole("button", { name: "登录" }).click();
        await expect(
          page.getByText("邮箱或密码不正确，请重试。", { exact: true }),
        ).toBeVisible();
      });
    } finally {
      await removeTestUser(email);
    }
  });
});
