"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Copy, Plus, RotateCcw, Save } from "lucide-react";
import {
  addPlanTaskAction,
  addPlanCommitmentAction,
  duplicatePlanDayAction,
  restorePlanDayAction,
  resetPlanProgressAction,
  updatePlanDayAction,
  updatePlanCommitmentAction,
  updatePlanTaskAction,
  type MutationState,
} from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/lib/data/sections";

const initial: MutationState = { status: "idle" };

type TaskRow = Record<string, unknown>;

function Message({ state }: { state: MutationState }) {
  return state.message ? (
    <p
      className={
        state.status === "success"
          ? "auth-message-success"
          : "auth-message-error"
      }
      role="status"
    >
      {state.message}
    </p>
  ) : null;
}

function taskValue(task: TaskRow, snake: string, camel: string) {
  return task[snake] ?? task[camel];
}

function EditableTask({ task }: { task: TaskRow }) {
  const [state, action, pending] = useActionState(
    updatePlanTaskAction,
    initial,
  );
  const required = Boolean(taskValue(task, "required", "required"));
  const minimum = Boolean(
    taskValue(task, "minimum_day_eligible", "minimumDayEligible"),
  );
  return (
    <details className="max-w-full min-w-0 overflow-hidden rounded-xl border border-border bg-surface px-4 py-3">
      <summary className="flex min-h-11 min-w-0 cursor-pointer list-none items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {String(task.title ?? "未命名任务")}
          </p>
          <p className="text-xs text-muted-foreground">
            {String(task.category ?? "PERSONAL")} ·{" "}
            {String(
              taskValue(task, "estimated_minutes", "estimatedMinutes") ?? 0,
            )}{" "}
            分钟
          </p>
        </div>
        <Badge
          tone={
            String(task.status ?? "PENDING").toUpperCase() === "COMPLETED"
              ? "success"
              : "secondary"
          }
        >
          {String(task.status ?? "PENDING").toLowerCase()}
        </Badge>
      </summary>
      <form
        action={action}
        className="mt-3 grid min-w-0 gap-3 border-t border-border pt-3 sm:grid-cols-2"
      >
        <input
          type="hidden"
          name="taskId"
          value={String(task.id ?? task.seedKey ?? "")}
        />
        <label className="form-field sm:col-span-2">
          任务标题
          <input
            name="title"
            defaultValue={String(task.title ?? "")}
            required
          />
        </label>
        <label className="form-field">
          类别
          <select
            name="category"
            defaultValue={String(task.category ?? "PERSONAL")}
          >
            {[
              "FIXED_COMMITMENT",
              "FITNESS",
              "NUTRITION",
              "IELTS",
              "GRE",
              "RECOVERY",
              "PLANNING",
              "COURSE",
              "INTERNSHIP",
              "PERSONAL",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          预计分钟
          <input
            name="minutes"
            type="number"
            min="1"
            max="1440"
            defaultValue={String(
              taskValue(task, "estimated_minutes", "estimatedMinutes") ?? 30,
            )}
          />
        </label>
        <label className="check-chip">
          <input name="required" type="checkbox" defaultChecked={required} />
          必做
        </label>
        <label className="check-chip">
          <input
            name="minimumDayEligible"
            type="checkbox"
            defaultChecked={minimum}
          />
          最低完成版
        </label>
        <div className="sm:col-span-2">
          <Message state={state} />
        </div>
        <Button
          type="submit"
          loading={pending}
          variant="secondary"
          className="sm:col-span-2"
        >
          <Save className="size-4" />
          保存任务修改
        </Button>
      </form>
    </details>
  );
}

function EditableCommitment({ commitment }: { commitment: TaskRow }) {
  const [state, action, pending] = useActionState(
    updatePlanCommitmentAction,
    initial,
  );
  const allDay = Boolean(taskValue(commitment, "is_all_day", "isAllDay"));
  const start = String(
    taskValue(commitment, "local_start_time", "startTime") ?? "",
  ).slice(0, 5);
  const end = String(
    taskValue(commitment, "local_end_time", "endTime") ?? "",
  ).slice(0, 5);
  return (
    <details className="max-w-full min-w-0 overflow-hidden rounded-xl border border-border bg-surface px-4 py-3">
      <summary className="flex min-h-11 min-w-0 cursor-pointer list-none items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {String(commitment.title ?? "未命名安排")}
          </p>
          <p className="text-xs text-muted-foreground">
            {allDay ? "全天" : `${start || "—"}–${end || "—"}`} ·{" "}
            {String(commitment.kind ?? "PERSONAL")}
          </p>
        </div>
        <Badge tone="secondary">固定</Badge>
      </summary>
      <form
        action={action}
        className="mt-3 grid min-w-0 gap-3 border-t border-border pt-3 sm:grid-cols-2"
      >
        <input
          type="hidden"
          name="commitmentId"
          value={String(commitment.id ?? commitment.seedKey ?? "")}
        />
        <label className="form-field sm:col-span-2">
          标题
          <input
            name="title"
            defaultValue={String(commitment.title ?? "")}
            required
          />
        </label>
        <label className="form-field">
          类型
          <select
            name="kind"
            defaultValue={String(commitment.kind ?? "PERSONAL")}
          >
            {["INTERNSHIP", "COURSE", "EXAM", "PERSONAL"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="check-chip self-end">
          <input name="isAllDay" type="checkbox" defaultChecked={allDay} />
          全天
        </label>
        <label className="form-field">
          开始
          <input name="startTime" type="time" defaultValue={start} />
        </label>
        <label className="form-field">
          结束
          <input name="endTime" type="time" defaultValue={end} />
        </label>
        <div className="sm:col-span-2">
          <Message state={state} />
        </div>
        <Button
          type="submit"
          loading={pending}
          variant="secondary"
          className="sm:col-span-2"
        >
          <Save className="size-4" />
          保存安排修改
        </Button>
      </form>
    </details>
  );
}

export function PlanEditor({
  days,
  selected,
  tasks,
  commitments = [],
}: {
  days: CalendarDay[];
  selected: CalendarDay;
  tasks: TaskRow[];
  commitments?: TaskRow[];
}) {
  const [editState, editAction, editPending] = useActionState(
    updatePlanDayAction,
    initial,
  );
  const [taskState, taskAction, taskPending] = useActionState(
    addPlanTaskAction,
    initial,
  );
  const [commitmentState, commitmentAction, commitmentPending] = useActionState(
    addPlanCommitmentAction,
    initial,
  );
  const [copyState, copyAction, copyPending] = useActionState(
    duplicatePlanDayAction,
    initial,
  );
  const [restoreState, restoreAction, restorePending] = useActionState(
    restorePlanDayAction,
    initial,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetPlanProgressAction,
    initial,
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle>计划日期</CardTitle>
          <CardDescription>选择一天进行安全编辑。</CardDescription>
        </CardHeader>
        <CardContent className="grid max-h-[32rem] gap-1 overflow-y-auto">
          {days.map((day) => (
            <Link
              key={day.date}
              href={`/plan?date=${day.date}`}
              className={cn(
                "flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 text-sm transition-colors",
                day.date === selected.date
                  ? "bg-primary-soft text-primary-strong"
                  : "hover:bg-muted",
              )}
            >
              <span>
                <strong className="block font-semibold">
                  {day.date.slice(5)}
                </strong>
                <span className="text-xs text-muted-foreground">
                  {day.title}
                </span>
              </span>
              <span className="text-xs tabular-nums">{day.completion}%</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{selected.date} · 编辑当天</CardTitle>
                <CardDescription>
                  用户修改会被标记，模板升级不会覆盖。
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge tone="secondary">{selected.category}</Badge>
                <Badge>{selected.intensity}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={editAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="planId" value={selected.id} />
              <label className="form-field sm:col-span-2">
                当天标题
                <input
                  name="title"
                  defaultValue={selected.title}
                  required
                  maxLength={240}
                />
              </label>
              <label className="form-field sm:col-span-2">
                说明
                <textarea
                  name="summary"
                  defaultValue={selected.summary}
                  rows={3}
                  maxLength={2000}
                />
              </label>
              <label className="form-field">
                类别
                <select name="category" defaultValue={selected.category}>
                  {[
                    "BASELINE",
                    "INTERNSHIP_PART_TIME",
                    "COURSE_DAY",
                    "WEEKEND_INTENSIVE",
                    "WEEKEND_RECOVERY",
                    "INTERNSHIP_FULL_TIME",
                    "IELTS_TAPER",
                    "EXAM_DAY",
                    "FINAL_REVIEW",
                    "FLEX_DAY",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                强度
                <select name="intensity" defaultValue={selected.intensity}>
                  <option>LOW</option>
                  <option>MODERATE</option>
                  <option>HIGH</option>
                </select>
              </label>
              <div className="sm:col-span-2">
                <Message state={editState} />
              </div>
              <Button
                type="submit"
                loading={editPending}
                className="sm:col-span-2"
              >
                <Save className="size-4" />
                保存当天计划
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>固定安排</CardTitle>
            <CardDescription>
              实习、课程与考试等时间块；展开即可编辑。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {commitments.length ? (
              commitments.map((commitment, index) => (
                <EditableCommitment
                  key={String(commitment.id ?? commitment.seedKey ?? index)}
                  commitment={commitment}
                />
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                当天还没有固定安排。
              </p>
            )}
            <form
              action={commitmentAction}
              className="mt-2 grid gap-4 rounded-2xl bg-muted/60 p-4 sm:grid-cols-2"
            >
              <input type="hidden" name="planId" value={selected.id} />
              <label className="form-field sm:col-span-2">
                新固定安排
                <input
                  name="commitmentTitle"
                  required
                  placeholder="例如：实习 / 课程"
                />
              </label>
              <label className="form-field">
                类型
                <select name="commitmentKind" defaultValue="PERSONAL">
                  {["INTERNSHIP", "COURSE", "EXAM", "PERSONAL"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="check-chip self-end">
                <input name="commitmentAllDay" type="checkbox" />
                全天
              </label>
              <label className="form-field">
                开始
                <input name="commitmentStart" type="time" />
              </label>
              <label className="form-field">
                结束
                <input name="commitmentEnd" type="time" />
              </label>
              <div className="sm:col-span-2">
                <Message state={commitmentState} />
              </div>
              <Button
                type="submit"
                loading={commitmentPending}
                variant="secondary"
                className="sm:col-span-2"
              >
                <Plus className="size-4" />
                添加固定安排
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>任务清单</CardTitle>
            <CardDescription>
              模板任务和自定义任务并存；完成记录不会因编辑而丢失。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tasks.length ? (
              tasks.map((task, index) => (
                <EditableTask
                  key={String(task.id ?? task.seedKey ?? index)}
                  task={task}
                />
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                当天还没有任务。
              </p>
            )}

            <form
              action={taskAction}
              className="mt-2 grid gap-4 rounded-2xl bg-muted/60 p-4 sm:grid-cols-2"
            >
              <input type="hidden" name="planId" value={selected.id} />
              <label className="form-field sm:col-span-2">
                新任务
                <input
                  name="taskTitle"
                  placeholder="例如：30 分钟听力复盘"
                  required
                />
              </label>
              <label className="form-field">
                类别
                <select name="taskCategory" defaultValue="PERSONAL">
                  {[
                    "FITNESS",
                    "NUTRITION",
                    "IELTS",
                    "GRE",
                    "RECOVERY",
                    "PLANNING",
                    "COURSE",
                    "INTERNSHIP",
                    "PERSONAL",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                预计分钟
                <input
                  name="taskMinutes"
                  type="number"
                  min="1"
                  max="1440"
                  defaultValue="30"
                  required
                />
              </label>
              <label className="check-chip sm:col-span-2">
                <input name="taskRequired" type="checkbox" />
                设为必做，并加入最低完成版
              </label>
              <div className="sm:col-span-2">
                <Message state={taskState} />
              </div>
              <Button
                type="submit"
                loading={taskPending}
                variant="secondary"
                className="sm:col-span-2"
              >
                <Plus className="size-4" />
                添加自定义任务
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>复制当天</CardTitle>
              <CardDescription>
                复制为用户计划；目标日必须为空，完成状态不会被复制。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={copyAction} className="grid gap-3">
                <input type="hidden" name="sourceDate" value={selected.date} />
                <label className="form-field">
                  目标日期
                  <input name="targetDate" type="date" required />
                </label>
                <Message state={copyState} />
                <Button type="submit" loading={copyPending} variant="secondary">
                  <Copy className="size-4" />
                  复制计划
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>恢复当天模板</CardTitle>
              <CardDescription>
                仅补回缺失的种子内容，绝不覆盖编辑、完成状态或自定义任务。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={restoreAction} className="grid gap-3">
                <input type="hidden" name="planDate" value={selected.date} />
                <label className="form-field">
                  输入 <code>RESTORE {selected.date}</code>
                  <input name="confirmation" autoComplete="off" required />
                </label>
                <Message state={restoreState} />
                <Button
                  type="submit"
                  loading={restorePending}
                  variant="secondary"
                >
                  <RotateCcw className="size-4" />
                  恢复当天缺失内容
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>安全重新应用模板</CardTitle>
              <CardDescription>
                补回缺失的模板内容，但绝不覆盖用户编辑、完成状态、自定义任务、打卡、运动、IELTS、GRE
                或复盘。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selected.planCycleId ? (
                <form action={resetAction} className="grid gap-3">
                  <input
                    type="hidden"
                    name="cycleId"
                    value={selected.planCycleId}
                  />
                  <label className="form-field">
                    输入 <code>RESET {selected.planCycleId}</code>
                    <input name="confirmation" autoComplete="off" required />
                  </label>
                  <Message state={resetState} />
                  <Button type="submit" loading={resetPending} variant="danger">
                    <RotateCcw className="size-4" />
                    安全重新应用模板
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  演示模式不执行真实重置。连接 Supabase 后可用。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <Link href="/calendar" className={buttonVariants({ variant: "ghost" })}>
          返回日历
        </Link>
      </div>
    </div>
  );
}
