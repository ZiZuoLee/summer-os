import { expect, test } from "@playwright/test";

test.describe("数据导出", () => {
  test("JSON 导出具有版本、演示数据和私有不缓存响应头", async ({ request }) => {
    const response = await request.get("/api/export?format=json");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["content-disposition"]).toContain("attachment");
    expect(response.headers()["cache-control"]).toContain("private");
    expect(response.headers()["cache-control"]).toContain("no-store");

    const body = await response.json();
    expect(body.schemaVersion).toBe("summer-os-export@1");
    expect(body.infrastructure).toBe("best-effort-public-beta");
    expect(body.datasets.daily_logs).toHaveLength(2);
  });

  test("CSV 导出带 UTF-8 内容并转义电子表格公式", async ({ request }) => {
    const response = await request.get("/api/export?format=csv");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["content-disposition"]).toContain("daily-logs");
    expect(response.headers()["cache-control"]).toContain("private, no-store");

    const body = await response.text();
    expect(body).toContain("日期,体重_kg");
    expect(body).toContain("演示数据");
    expect(body).toContain("'=此值会被安全转义");
  });

  test("导出页面清楚说明可携带性和缓存策略", async ({ page }) => {
    await page.goto("/export");
    await expect(
      page.getByRole("heading", { name: "导出你的数据" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "下载完整备份" }),
    ).toHaveAttribute("href", "/api/export?format=json");
    await expect(
      page.getByRole("link", { name: "下载打卡表格" }),
    ).toHaveAttribute("href", "/api/export?format=csv");
    await expect(page.getByText("私有、即时、不缓存")).toBeVisible();
  });
});

test.describe("PWA 离线回退", () => {
  test("公开离线页解释草稿和敏感数据缓存边界", async ({ page }) => {
    await page.goto("/offline");
    await expect(
      page.getByRole("heading", { name: "网络暂时离开了" }),
    ).toBeVisible();
    await expect(page.getByText("打卡草稿可保留")).toBeVisible();
    await expect(page.getByText("敏感数据不缓存")).toBeVisible();
  });

  test("service worker 在导航失败时返回公开离线页，且不缓存已认证页面", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      await navigator.serviceWorker.ready;
      if (!registration.active) {
        await new Promise<void>((resolve) => {
          const worker = registration.installing ?? registration.waiting;
          if (!worker) return resolve();
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") resolve();
          });
        });
      }
    });
    await page.reload();
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true);

    await page.goto("/today");
    const cachedUrls = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const requests = await Promise.all(
        cacheNames.map(async (name) => (await caches.open(name)).keys()),
      );
      return requests.flat().map((request) => new URL(request.url).pathname);
    });
    expect(cachedUrls).not.toContain("/today");
    expect(cachedUrls).not.toContain("/api/export");

    await context.setOffline(true);
    try {
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: "网络暂时离开了" }),
      ).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
