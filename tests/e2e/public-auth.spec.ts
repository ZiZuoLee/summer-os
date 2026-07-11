import { expect, test } from "@playwright/test";

test.describe("公开页面与演示认证", () => {
  test("首页使用正确的中文文案并链接登录、注册和隐私页面", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "让这个夏天，有节奏地向前。",
      }),
    ).toBeVisible();
    await expect(page.getByText("计划不再散落", { exact: true })).toBeVisible();
    await expect(
      page.getByText("两分钟轻量打卡", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "隐私说明", exact: true }),
    ).toHaveAttribute("href", "/privacy");

    await page.getByRole("link", { name: "我已有账号" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "继续你的夏日节奏" }),
    ).toBeVisible();
  });

  test("登录表单在演示模式下不会伪造账号会话", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("邮箱").fill("demo@example.com");
    await page.getByLabel("密码").fill("Correct-Horse-123");
    await page.getByRole("button", { name: "登录" }).click();

    await expect(
      page.getByText("本地演示模式不创建账号。请直接进入演示仪表盘。"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("link", { name: "忘记密码？" }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  test("注册表单包含成人、健康和安全验证确认", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByRole("heading", { name: "创建你的 Summer OS" }),
    ).toBeVisible();
    await expect(
      page.getByText("本地环境：安全验证将在部署后启用"),
    ).toBeVisible();
    await page.getByLabel("昵称").fill("演示用户");
    await page.getByLabel("邮箱").fill("new-user@example.com");
    await page.getByLabel("密码", { exact: true }).fill("Correct-Horse-123");
    await page.getByLabel("确认密码").fill("Correct-Horse-123");
    await page.getByLabel("我确认已满 18 周岁。").check();
    await page.getByLabel(/我已阅读健康提示/).check();
    await page.getByRole("button", { name: "创建账号" }).click();

    await expect(
      page.getByText("本地演示模式不创建账号。请直接进入演示仪表盘。"),
    ).toBeVisible();
  });

  test("引导可在两种模板间切换并进入演示仪表盘", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "把你的夏天装进一个清晰的系统" }),
    ).toBeVisible();
    await expect(
      page.getByText(/演示模式：提交后进入独立演示仪表盘/),
    ).toBeVisible();
    await page.getByText("自定义 Summer OS", { exact: true }).click();
    await expect(page.getByLabel("开始日期")).toBeEnabled();
    await expect(
      page.getByRole("group", { name: "实习 / 工作日" }),
    ).toBeVisible();
    await page.getByText("Kirito 2026", { exact: true }).click();
    await expect(page.getByLabel("开始日期")).toBeDisabled();

    await page.getByRole("button", { name: "创建我的 Summer OS" }).click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(
      page.getByRole("heading", { name: /早上好，Kirito/ }),
    ).toBeVisible();
  });
});
