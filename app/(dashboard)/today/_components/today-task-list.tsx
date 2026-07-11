"use client";

import { TaskList } from "@/components/dashboard/task-list";
import type { DashboardTask } from "@/lib/data/types";
import { setTaskStatusAction } from "@/app/(dashboard)/actions";

export function TodayTaskList({
  tasks,
  minimumMode,
}: {
  tasks: DashboardTask[];
  minimumMode: boolean;
}) {
  const visible = minimumMode
    ? tasks.filter((task) => task.minimumDayEligible)
    : tasks;
  return (
    <TaskList
      title={minimumMode ? "最低完成版" : "今日任务"}
      description={
        minimumMode
          ? "原计划仍然保留，今天只聚焦最重要的几件事。"
          : `${visible.length} 项任务 · 必做任务权重更高`
      }
      tasks={visible.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description ?? undefined,
        time: task.plannedStart ?? undefined,
        optional: !task.required,
        completed: task.status === "completed",
        onToggle: async (completed) => {
          const formData = new FormData();
          formData.set("taskId", task.id);
          formData.set("status", completed ? "completed" : "pending");
          formData.set("rowVersion", String(task.rowVersion));
          const result = await setTaskStatusAction(formData);
          if (!result.ok) throw new Error(result.code);
        },
      }))}
    />
  );
}
