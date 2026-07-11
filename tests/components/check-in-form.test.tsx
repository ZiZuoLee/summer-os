import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CheckInForm as RoutedCheckInForm } from "@/app/(dashboard)/check-in/_components/check-in-form";
import {
  CheckInForm as ValidatedCheckInForm,
  type CheckInFormData,
} from "@/components/forms/check-in-form";

const { routedAction, toastError, toastSuccess } = vi.hoisted(() => ({
  routedAction: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/app/(dashboard)/actions", () => ({
  submitCheckinAction: routedAction,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}));

describe("check-in validation and local drafts", () => {
  beforeEach(() => {
    localStorage.clear();
    routedAction.mockReset();
    routedAction.mockResolvedValue({ status: "idle" });
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("namespaces the production form draft by user and local date", async () => {
    const user = userEvent.setup();
    render(<RoutedCheckInForm userKey="user-a" date="2026-07-13" />);

    await user.type(screen.getByLabelText("体重（kg）"), "82.4");

    const currentKey = "summer-os:checkin-draft:v1:user-a:2026-07-13";
    await waitFor(() =>
      expect(localStorage.getItem(currentKey)).not.toBeNull(),
    );
    const draft = JSON.parse(localStorage.getItem(currentKey) ?? "{}") as {
      entries: [string, string][];
    };
    expect(draft.entries).toContainEqual(["weightKg", "82.4"]);
    expect(
      localStorage.getItem("summer-os:checkin-draft:v1:user-b:2026-07-13"),
    ).toBeNull();
    expect(
      localStorage.getItem("summer-os:checkin-draft:v1:user-a:2026-07-14"),
    ).toBeNull();
  });

  it("restores only the matching fresh draft and removes an expired one", async () => {
    const currentKey = "summer-os:checkin-draft:v1:user-a:2026-07-13";
    const otherKey = "summer-os:checkin-draft:v1:user-b:2026-07-13";
    localStorage.setItem(
      currentKey,
      JSON.stringify({ savedAt: Date.now(), entries: [["weightKg", "81.2"]] }),
    );
    localStorage.setItem(
      otherKey,
      JSON.stringify({ savedAt: Date.now(), entries: [["weightKg", "96.0"]] }),
    );

    const firstRender = render(
      <RoutedCheckInForm userKey="user-a" date="2026-07-13" />,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("体重（kg）")).toHaveValue(81.2),
    );
    firstRender.unmount();

    const expiredKey = "summer-os:checkin-draft:v1:user-a:2026-07-14";
    localStorage.setItem(
      expiredKey,
      JSON.stringify({
        savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        entries: [["weightKg", "77.0"]],
      }),
    );
    render(<RoutedCheckInForm userKey="user-a" date="2026-07-14" />);

    await waitFor(() => expect(localStorage.getItem(expiredKey)).toBeNull());
    expect(screen.getByLabelText("体重（kg）")).toHaveValue(null);
    expect(localStorage.getItem(otherKey)).not.toBeNull();
  });

  it("rejects invalid wellness values before calling the validated submit action", async () => {
    const user = userEvent.setup();
    const submitAction = vi.fn<(data: CheckInFormData) => Promise<void>>();
    render(
      <ValidatedCheckInForm
        userId="user-a"
        date="2026-07-13"
        submitAction={submitAction}
      />,
    );

    await user.type(screen.getByLabelText("体重（kg）"), "10");
    await user.click(screen.getByText("IELTS"));
    await user.type(
      screen.getByLabelText("资料链接"),
      "http://example.com/file",
    );
    await user.click(screen.getByRole("button", { name: "保存今日打卡" }));

    expect(await screen.findByText("请检查体重数值")).toBeVisible();
    expect(screen.getByText("仅支持 HTTPS 链接")).toBeVisible();
    expect(screen.getByLabelText("体重（kg）")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(submitAction).not.toHaveBeenCalled();
  });

  it("keeps a user-scoped draft when a validated save fails", async () => {
    const user = userEvent.setup();
    const submitAction = vi.fn().mockRejectedValue(new Error("offline"));
    const key = "summer-os:check-in-draft:v1:user-a:2026-07-13";
    render(
      <ValidatedCheckInForm
        userId="user-a"
        date="2026-07-13"
        submitAction={submitAction}
      />,
    );

    await user.type(
      screen.getByLabelText("给今天的备注"),
      "今天按计划完成了复盘",
    );
    await waitFor(() => expect(localStorage.getItem(key)).not.toBeNull());
    await user.click(screen.getByRole("button", { name: "保存今日打卡" }));

    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem(key)).not.toBeNull();
    expect(toastError).toHaveBeenCalledWith("保存失败，草稿仍保留在此设备");
  });

  it("clears the matching draft and announces a successful save", async () => {
    const user = userEvent.setup();
    const submitAction = vi.fn().mockResolvedValue(undefined);
    const key = "summer-os:check-in-draft:v1:user-a:2026-07-13";
    render(
      <ValidatedCheckInForm
        userId="user-a"
        date="2026-07-13"
        submitAction={submitAction}
      />,
    );

    await user.type(screen.getByLabelText("体重（kg）"), "82.4");
    await waitFor(() => expect(localStorage.getItem(key)).not.toBeNull());
    await user.click(screen.getByRole("button", { name: "保存今日打卡" }));

    expect(await screen.findByText("今天的记录已经安全提交。")).toBeVisible();
    expect(localStorage.getItem(key)).toBeNull();
    expect(toastSuccess).toHaveBeenCalledWith("今日打卡已保存");
  });
});
