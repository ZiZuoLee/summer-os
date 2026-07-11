import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TodayTaskList } from "@/app/(dashboard)/today/_components/today-task-list";
import type { DashboardTask } from "@/lib/data/types";

const { setTaskStatusAction } = vi.hoisted(() => ({
  setTaskStatusAction: vi.fn(),
}));

vi.mock("@/app/(dashboard)/actions", () => ({ setTaskStatusAction }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const tasks: DashboardTask[] = [
  {
    id: "09c1924d-d094-44dc-a2ba-b26c184b62c1",
    title: "完成核心听力复盘",
    description: "最低完成版保留",
    category: "IELTS",
    timeBlock: "evening",
    plannedStart: "20:00",
    required: true,
    minimumDayEligible: true,
    status: "pending",
    rowVersion: 7,
  },
  {
    id: "2eb0b8e9-f5f6-4c64-8192-606e8af3cae2",
    title: "可选整理",
    category: "PERSONAL",
    timeBlock: "anytime",
    required: false,
    minimumDayEligible: false,
    status: "pending",
    rowVersion: 2,
  },
];

describe("TodayTaskList mutation integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends explicit target state plus expected row version and rolls back a rejection", async () => {
    setTaskStatusAction.mockResolvedValue({ ok: false, code: "SAVE_FAILED" });
    const user = userEvent.setup();
    render(<TodayTaskList tasks={tasks} minimumMode={false} />);

    const toggle = screen.getByRole("checkbox", {
      name: "标记完成：完成核心听力复盘",
    });
    await user.click(toggle);

    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-checked", "false"),
    );
    const payload = setTaskStatusAction.mock.calls[0]?.[0] as FormData;
    expect(Object.fromEntries(payload.entries())).toEqual({
      taskId: tasks[0].id,
      status: "completed",
      rowVersion: "7",
    });
  });

  it("keeps the original plan while showing only minimum-day eligible tasks", () => {
    render(<TodayTaskList tasks={tasks} minimumMode />);

    expect(screen.getByRole("heading", { name: "最低完成版" })).toBeVisible();
    expect(screen.getByText("完成核心听力复盘")).toBeVisible();
    expect(screen.queryByText("可选整理")).not.toBeInTheDocument();
    expect(
      screen.getByText("原计划仍然保留，今天只聚焦最重要的几件事。"),
    ).toBeVisible();
  });
});
