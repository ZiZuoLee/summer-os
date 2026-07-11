import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app-shell";
import { expectNoA11yViolations } from "@/tests/helpers/accessibility";

const { navigationState } = vi.hoisted(() => ({
  navigationState: { pathname: "/today" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

vi.mock("@/components/service-worker-registration", () => ({
  ServiceWorkerRegistration: () => null,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => (
    <button type="button" aria-label="切换主题">
      主题
    </button>
  ),
}));

describe("responsive application navigation", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    navigationState.pathname = "/today";
  });

  it("exposes five mobile destinations and marks the current page", async () => {
    const { container } = render(
      <AppShell title="今日" displayName="林夏">
        <p>今天的内容</p>
      </AppShell>,
    );

    const mobileNavigation = screen.getByRole("navigation", {
      name: "主要导航",
    });
    expect(
      within(mobileNavigation).getByRole("link", { name: "今日" }),
    ).toHaveAttribute("aria-current", "page");
    expect(within(mobileNavigation).getAllByRole("link")).toHaveLength(4);
    expect(
      within(mobileNavigation).getByRole("button", { name: "更多" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "林夏的设置" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: "跳到主要内容" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    await expectNoA11yViolations(container);
  });

  it("opens a keyboard-dismissible mobile sheet and restores page scrolling", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <p>内容</p>
      </AppShell>,
    );

    const moreButton = within(
      screen.getByRole("navigation", { name: "主要导航" }),
    ).getByRole("button", { name: "更多" });
    await user.click(moreButton);

    const dialog = screen.getByRole("dialog", { name: "更多工具" });
    expect(dialog).toBeVisible();
    expect(document.body.style.overflow).toBe("hidden");
    expect(within(dialog).getByRole("link", { name: "IELTS" })).toHaveAttribute(
      "href",
      "/ielts",
    );
    expect(moreButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "更多工具" }),
      ).not.toBeInTheDocument(),
    );
    expect(document.body.style.overflow).toBe("");
    expect(moreButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the sheet when a destination is selected", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <p>内容</p>
      </AppShell>,
    );

    await user.click(
      within(screen.getByRole("navigation", { name: "主要导航" })).getByRole(
        "button",
        {
          name: "更多",
        },
      ),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: "每周复盘",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports an accessible desktop sidebar collapse control", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <p>内容</p>
      </AppShell>,
    );

    const collapse = screen.getByRole("button", { name: "收起侧边栏" });
    await user.click(collapse);

    expect(screen.getByRole("button", { name: "展开侧边栏" })).toBeVisible();
    const appNavigation = screen.getByRole("navigation", { name: "应用导航" });
    expect(within(appNavigation).getByTitle("今日")).toHaveAttribute(
      "href",
      "/today",
    );
  });

  it("marks a secondary route as active through the More destination", () => {
    navigationState.pathname = "/weekly-review";
    render(
      <AppShell>
        <p>内容</p>
      </AppShell>,
    );

    const moreButton = within(
      screen.getByRole("navigation", { name: "主要导航" }),
    ).getByRole("button", { name: "更多" });
    expect(moreButton).toHaveClass("text-primary-strong");
  });
});
