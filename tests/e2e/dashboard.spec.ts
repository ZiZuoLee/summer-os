import { expect, test } from "@playwright/test";

test.describe("今日和应用导航", () => {
  test("今日展示确定性演示数据并支持乐观任务更新", async ({ page }) => {
    await page.goto("/today");

    await expect(
      page.getByText("你正在查看独立演示数据", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /早上好，Kirito/ }),
    ).toBeVisible();
    await expect(
      page.getByText("基线日 · 稳稳启动", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("实习 09:00–17:30", { exact: true }),
    ).toBeVisible();

    const task = page.getByRole("checkbox", {
      name: "标记完成：实习 09:00–17:30",
    });
    await expect(task).toHaveAttribute("aria-checked", "false");
    await task.click();
    await expect(
      page.getByRole("checkbox", { name: "取消完成：实习 09:00–17:30" }),
    ).toHaveAttribute("aria-checked", "true");

    // Demo actions intentionally do not persist sensitive records.
    await page.reload();
    await expect(
      page.getByRole("checkbox", { name: "标记完成：实习 09:00–17:30" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  test("快速打卡入口和桌面侧栏导航保持当前页语义", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "桌面侧栏仅在桌面项目验证",
    );
    await page.goto("/today");

    await expect(
      page.getByRole("navigation", { name: "应用导航" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "应用导航" })
        .getByRole("link", { name: "今日" }),
    ).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "快速打卡" }).click();
    await expect(page).toHaveURL(/\/check-in$/);
    await expect(
      page.getByRole("heading", { name: "今天，真实地记录就好" }),
    ).toBeVisible();
  });

  test("移动端五项底部导航和更多工具表单可用", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/today");

    const navigation = page.getByRole("navigation", { name: "主要导航" });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link")).toHaveCount(4);
    await expect(
      navigation.getByRole("button", { name: "更多" }),
    ).toBeVisible();
    await navigation.getByRole("button", { name: "更多" }).click();
    const dialog = page.getByRole("dialog", { name: "更多工具" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "IELTS" }).click();
    await expect(page).toHaveURL(/\/ielts$/);
  });
});
