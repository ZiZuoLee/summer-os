import { expect, test } from "@playwright/test";

test.describe("每日打卡", () => {
  test("本机草稿按用户和日期保存、恢复，并在成功提交后清除", async ({
    page,
  }) => {
    await page.goto("/check-in");
    await page.getByLabel("体重（kg）").fill("82.4");
    await page.getByLabel("睡眠时长（小时）").fill("7.5");
    await page.locator('input[name="steps"]').fill("9300");
    await page
      .getByLabel("今天的备注（可选）")
      .fill("只用于浏览器自动化的合成记录");

    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(localStorage).some((key) =>
            key.startsWith("summer-os:checkin-draft:v1:demo:"),
          ),
        ),
      )
      .toBe(true);

    await page.reload();
    await expect(page.getByLabel("体重（kg）")).toHaveValue("82.4");
    await expect(page.getByLabel("睡眠时长（小时）")).toHaveValue("7.5");
    await expect(page.getByLabel("今天的备注（可选）")).toHaveValue(
      "只用于浏览器自动化的合成记录",
    );

    await page.getByRole("button", { name: "完成今日打卡" }).click();
    await expect(page.getByRole("status")).toContainText(
      "演示打卡已在当前页面预览",
    );
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(localStorage).some((key) =>
            key.startsWith("summer-os:checkin-draft:v1:demo:"),
          ),
        ),
      )
      .toBe(false);
  });

  test("明确跳过、安全信号和快捷学习记录均可键盘操作", async ({ page }) => {
    await page.goto("/check-in");

    await page.getByLabel("体重", { exact: true }).check();
    await page.getByLabel("有蔬菜").check();
    await page.getByLabel(/今天有眩晕或晕厥/).check();
    await page.getByLabel("运动类型").selectOption("WALK");
    await page.getByLabel("运动时长（分钟）").fill("20");
    await page.getByLabel("IELTS 技能").selectOption("READING");
    await page.getByLabel("IELTS 分钟").fill("25");

    await expect(page.getByLabel("体重", { exact: true })).toBeChecked();
    await expect(page.getByLabel(/今天有眩晕或晕厥/)).toBeChecked();
    await expect(page.getByLabel("IELTS 技能")).toHaveValue("READING");
  });

  test("浏览器离线事件显示全局提示且不丢失草稿", async ({ page, context }) => {
    await page.goto("/check-in");
    await page.locator('input[name="steps"]').fill("6000");
    await context.setOffline(true);
    try {
      await expect(page.getByRole("status")).toContainText("当前离线");
      await expect(page.locator('input[name="steps"]')).toHaveValue("6000");
    } finally {
      await context.setOffline(false);
    }
  });
});
