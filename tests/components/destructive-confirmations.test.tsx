import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PlanEditor } from "@/app/(dashboard)/plan/_components/plan-editor";
import { SettingsForms } from "@/app/(dashboard)/settings/_components/settings-forms";
import { expectNoA11yViolations } from "@/tests/helpers/accessibility";

const { idleResult } = vi.hoisted(() => ({
  idleResult: async () => ({ status: "idle" as const }),
}));

vi.mock("@/app/(dashboard)/actions", () => ({
  addPlanCommitmentAction: idleResult,
  addPlanTaskAction: idleResult,
  deleteAccountAction: idleResult,
  duplicatePlanDayAction: idleResult,
  resetPlanProgressAction: idleResult,
  restorePlanDayAction: idleResult,
  updatePlanCommitmentAction: idleResult,
  updatePlanDayAction: idleResult,
  updatePlanTaskAction: idleResult,
  updateSettingsAction: idleResult,
}));

vi.mock("@/components/install-prompt", () => ({ InstallPrompt: () => null }));
vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">切换主题</button>,
}));

const profile = {
  displayName: "林夏",
  timezone: "Asia/Shanghai",
  targetWeightKg: 75,
  stretchTargetWeightKg: 73,
  stepTarget: 10_000,
  waterTargetMl: 2_500,
  proteinTargetG: 130,
  sleepTargetMinutes: 450,
  ieltsExamDate: "2026-08-29",
  email: "person@example.com",
};

const selectedDay = {
  id: "a4d4b19b-afc9-4dd3-ae14-a35099b35451",
  planCycleId: "e76ab2bf-7221-4810-b875-ebeb62fe6312",
  date: "2026-07-13",
  title: "基线日",
  summary: "建立基线",
  category: "BASELINE",
  intensity: "MODERATE",
  completion: 0,
  taskCount: 1,
};

describe("destructive confirmation interfaces", () => {
  it("requires email, recent password, and the exact DELETE phrase", async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsForms profile={profile} />);

    const email = screen.getByLabelText("确认邮箱");
    const password = screen.getByLabelText("当前密码");
    const confirmation = screen.getByLabelText("输入 DELETE");
    const deletionForm = screen
      .getByRole("button", { name: "永久删除我的账户" })
      .closest("form");

    expect(email).toBeRequired();
    expect(password).toBeRequired();
    expect(confirmation).toBeRequired();
    expect(confirmation).toHaveAttribute("pattern", "DELETE");
    expect(deletionForm).not.toBeNull();
    expect(deletionForm?.checkValidity()).toBe(false);

    await user.type(email, "person@example.com");
    await user.type(password, "StrongPassword123");
    await user.type(confirmation, "delete");
    expect(confirmation).toBeInvalid();
    expect(deletionForm?.checkValidity()).toBe(false);

    await user.clear(confirmation);
    await user.type(confirmation, "DELETE");
    expect(confirmation).toBeValid();
    expect(deletionForm?.checkValidity()).toBe(true);
    expect(screen.getByText(/提供商级备份/)).toBeVisible();
    await expectNoA11yViolations(container);
  }, 15_000);

  it("renders the cycle-specific reset phrase and preserves-history warning", () => {
    render(
      <PlanEditor days={[selectedDay]} selected={selectedDay} tasks={[]} />,
    );

    const phrase = `RESET ${selectedDay.planCycleId}`;
    expect(screen.getByText(phrase)).toBeVisible();
    expect(screen.getByLabelText(`输入 ${phrase}`)).toBeRequired();
    expect(
      screen.getByText(
        /用户编辑、完成状态、自定义任务、打卡、运动、IELTS、GRE 或复盘/,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "安全重新应用模板" }),
    ).toBeVisible();
  });
});
