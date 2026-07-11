import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectNoSeriousAccessibilityViolations,
  useTheme,
} from "./support";

const responsiveRoutes = [
  ["首页", "/"],
  ["今日", "/today"],
  ["打卡", "/check-in"],
  ["日历", "/calendar"],
  ["数据", "/analytics"],
  ["计划", "/plan"],
  ["设置", "/settings"],
] as const;

test.describe("360px 响应式布局", () => {
  for (const [name, path] of responsiveRoutes) {
    test(`${name}在 360px 下没有横向溢出`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("移动底部导航触控目标至少 44px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/today");
    const targets = page
      .getByRole("navigation", { name: "主要导航" })
      .locator(":scope > a, :scope > button");
    await expect(targets).toHaveCount(5);

    for (const target of await targets.all()) {
      const box = await target.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("主题、键盘和无障碍", () => {
  test("主题切换会持久化浅色和深色选择", async ({ page }) => {
    await useTheme(page, "light");
    await page.goto("/today");
    await expect(page.locator("html")).toHaveClass(/light/);

    await page
      .getByRole("button", { name: /当前为浅色主题，切换主题/ })
      .click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("theme")))
      .toBe("dark");
  });

  test("跳转链接和焦点样式支持键盘用户", async ({ page }) => {
    await page.goto("/today");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "跳到主要内容" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("减少动态效果偏好被尊重", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
    const duration = await page
      .getByText("免费 · 非商业公开测试版")
      .evaluate((element) => getComputedStyle(element).animationDuration);
    expect(["0s", "0.001s", "0.01ms", "1e-05s"]).toContain(duration);
  });

  test("公开首页没有严重或关键 WCAG 违规", async ({ page }) => {
    await page.goto("/");
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("今日和打卡没有严重或关键 WCAG 违规", async ({ page }) => {
    await page.goto("/today");
    await expectNoSeriousAccessibilityViolations(page, "#main-content");
    await page.goto("/check-in");
    await expectNoSeriousAccessibilityViolations(page, "#main-content");
  });
});
