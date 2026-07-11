import { expect, test } from "@playwright/test";

test.describe("日历、计划与数据", () => {
  test("日历可在月历和议程间切换并打开指定日期", async ({ page }) => {
    await page.goto("/calendar");

    await expect(
      page.getByRole("heading", { name: "每一天都有自己的节奏" }),
    ).toBeVisible();
    await expect(page.getByText("2026 年 7 月", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "议程" }).click();
    await expect(page.getByText(/BASELINE · \d+ 项任务/)).toBeVisible();
    await page.getByRole("button", { name: "月历" }).click();
    await page.getByRole("button", { name: "下个月" }).click();
    await expect(page.getByText("2026 年 8 月", { exact: true })).toBeVisible();

    const dayLink = page.locator('a[href^="/plan?date=2026-08-"]').first();
    await dayLink.click();
    await expect(page).toHaveURL(/\/plan\?date=2026-08-/);
    await expect(
      page.getByRole("heading", { name: "计划编辑器" }),
    ).toBeVisible();
  });

  test("计划编辑器在演示模式预览安全修改而不声称持久化", async ({ page }) => {
    await page.goto("/plan?date=2026-07-13");

    await expect(page.getByText("2026-07-13 · 编辑当天")).toBeVisible();
    await page.getByLabel("当天标题").fill("合成的自动化计划标题");
    await page.getByRole("button", { name: "保存当天计划" }).click();
    await expect(page.getByRole("status")).toContainText("演示计划修改已预览");

    await page.getByLabel("新任务").fill("合成的浏览器任务");
    await page.getByRole("button", { name: "添加自定义任务" }).click();
    await expect(page.getByText("演示任务已预览。")).toBeVisible();
    await expect(page.getByText("演示模式不执行真实重置")).toBeVisible();
  });

  test("分析页面包含可访问的图表摘要和安全预测说明", async ({ page }) => {
    await page.goto("/analytics");

    await expect(
      page.getByRole("heading", { name: "看见长期变化" }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: /体重：从/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /步数：从/ })).toBeVisible();
    await expect(page.getByText(/所有相关性都只是描述性的/)).toBeVisible();
    await expect(
      page.getByText(/把展示的减重速度限制在最新平均体重的每周 1%/),
    ).toBeVisible();

    await page.getByText("查看图表数据").first().click();
    await expect(page.getByRole("list").first()).toBeVisible();
  });
});

test.describe("IELTS、GRE 与周复盘", () => {
  test("IELTS 练习表单接受 HTTPS 参考并返回演示反馈", async ({ page }) => {
    await page.goto("/ielts");
    await expect(
      page.getByRole("heading", { name: "把 7.5 找回来，再稳稳向前" }),
    ).toBeVisible();

    await page.getByLabel("技能").selectOption("READING");
    await page.getByLabel("材料 / 来源").fill("Cambridge IELTS 合成练习");
    await page.getByLabel("实际分钟").fill("35");
    await page.getByLabel("下一步").fill("复盘定位题证据句");
    await page
      .getByLabel("HTTPS 参考链接（可选）")
      .fill("https://example.com/ielts");
    await page.getByRole("button", { name: "记录 IELTS 练习" }).click();
    await expect(page.getByRole("status")).toContainText(
      "演示 IELTS 记录已预览",
    );
  });

  test("GRE 项目和决定只预览用户提供的证据", async ({ page }) => {
    await page.goto("/gre");
    await expect(
      page.getByRole("heading", { name: "GRE 是否值得准备？" }),
    ).toBeVisible();

    await page.getByLabel("大学", { exact: true }).fill("Example University");
    await page.getByLabel("项目", { exact: true }).fill("Synthetic Programme");
    await page
      .getByLabel("官方要求 HTTPS 链接")
      .fill("https://example.com/programme");
    await page.getByRole("button", { name: "添加项目要求" }).click();
    await expect(page.getByText("演示项目已预览，不会保存。")).toBeVisible();

    await page.getByLabel("当前决定").selectOption("DEFER_PENDING_SCHOOL_LIST");
    await page
      .getByLabel("证据与取舍")
      .fill(
        "这是至少二十个字符的合成依据，只验证用户自己录入的官方要求和机会成本。 ",
      );
    await page.getByRole("button", { name: "保存 GRE 决策" }).click();
    await expect(page.getByText("演示 GRE 决策已预览。")).toBeVisible();
  });

  test("每周复盘可填写温和调整并获得演示反馈", async ({ page }) => {
    await page.goto("/weekly-review");
    await expect(page.getByRole("heading", { name: "每周复盘" })).toBeVisible();

    await page
      .getByLabel("本周最值得肯定的事")
      .fill("按计划完成了三次短学习记录。");
    await page.getByLabel("遇到的阻力").fill("工作日晚间精力不足。");
    await page.getByLabel("下周要调整什么").fill("把最难的学习任务移到午间。");
    await page.getByLabel("恢复感受").selectOption("3");
    await page.getByLabel("下周唯一焦点").fill("稳定完成短练习");
    await page.getByRole("button", { name: "保存本周复盘" }).click();
    await expect(page.getByRole("status")).toContainText("演示周复盘已预览");
  });
});

test.describe("设置和破坏性确认", () => {
  test("设置可在演示界面预览，删除账户必须完整确认", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "设置与数据" }),
    ).toBeVisible();

    await page.getByLabel("显示名称").fill("自动化演示用户");
    await page.getByRole("button", { name: "保存设置" }).click();
    await expect(page.getByRole("status")).toContainText(
      "演示设置已应用到当前界面",
    );

    await page.getByLabel("确认邮箱").fill("demo@summer-os.local");
    await page.getByLabel("当前密码").fill("not-a-real-password");
    await page.getByLabel("输入 DELETE").fill("DELETE");
    await page.getByRole("button", { name: "永久删除我的账户" }).click();
    await expect(page.getByText("演示模式没有可删除的账号。")).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);
  });
});
