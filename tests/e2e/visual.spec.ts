import { expect, test } from "@playwright/test";
import { useTheme, waitForUi } from "./support";

const visualRoutes = [
  ["today", "/today", "早上好，Kirito"],
  ["check-in", "/check-in", "今天，真实地记录就好"],
  ["calendar", "/calendar", "每一天都有自己的节奏"],
  ["analytics", "/analytics", "看见长期变化"],
] as const;

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} 主题视觉回归`, () => {
    for (const [name, path, heading] of visualRoutes) {
      test(`${name} 页面`, async ({ page }) => {
        await useTheme(page, theme);
        await page.goto(path);
        await expect(
          page.getByRole("heading", { name: new RegExp(heading) }),
        ).toBeVisible();
        await waitForUi(page);
        await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
          animations: "disabled",
          caret: "hide",
          fullPage: true,
        });
      });
    }
  });
}
