"use client";

import { TaskRow, type TaskRowProps } from "../task-row";
import { EmptyState } from "../empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export interface TaskListProps {
  title?: string;
  description?: string;
  tasks: TaskRowProps[];
  emptyMessage?: string;
  className?: string;
}

export function TaskList({
  title = "今日任务",
  description,
  tasks,
  emptyMessage = "今天还没有任务，给自己留一点空间吧。",
  className,
}: TaskListProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {tasks.length ? (
          <div className="grid gap-1">
            {tasks.map((task) => (
              <TaskRow key={task.id} {...task} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="暂时清空"
            description={emptyMessage}
            className="min-h-48"
          />
        )}
      </CardContent>
    </Card>
  );
}
