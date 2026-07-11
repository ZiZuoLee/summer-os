import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskRow } from "@/components/task-row";
import { expectNoA11yViolations } from "@/tests/helpers/accessibility";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
  },
}));

describe("TaskRow optimistic mutations", () => {
  it("applies an optimistic completion and keeps it after a successful save", async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const onToggle = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(<TaskRow id="task-1" title="完成听力复盘" onToggle={onToggle} />);

    const toggle = screen.getByRole("checkbox", {
      name: "标记完成：完成听力复盘",
    });
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toBeDisabled();
    expect(onToggle).toHaveBeenCalledWith(true, "task-1");

    resolveSave();
    await waitFor(() => expect(toggle).not.toBeDisabled());
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveAccessibleName("取消完成：完成听力复盘");
  });

  it("rolls back after a failed save and announces the recovery toast", async () => {
    const user = userEvent.setup();
    const onToggle = vi
      .fn()
      .mockRejectedValue(new Error("network unavailable"));
    const { container } = render(
      <TaskRow
        id="task-2"
        title="记录步数"
        description="今天的最低完成项"
        optional
        onToggle={onToggle}
      />,
    );

    const toggle = screen.getByRole("checkbox", { name: "标记完成：记录步数" });
    await user.click(toggle);

    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-checked", "false"),
    );
    expect(toggle).not.toBeDisabled();
    expect(toastError).toHaveBeenCalledWith("更新失败，已恢复原状态");
    expect(screen.getByText("可选")).toBeVisible();
    await expectNoA11yViolations(container);
  });

  it("does not call the mutation while disabled", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TaskRow id="task-3" title="休息" disabled onToggle={onToggle} />);

    await user.click(screen.getByRole("checkbox", { name: "标记完成：休息" }));

    expect(onToggle).not.toHaveBeenCalled();
  });
});
