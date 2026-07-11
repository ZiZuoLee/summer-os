"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import {
  addIeltsSessionAction,
  type MutationState,
} from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

const initial: MutationState = { status: "idle" };

export function IeltsSessionForm() {
  const [state, action, pending] = useActionState(
    addIeltsSessionAction,
    initial,
  );
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="form-field">
        日期
        <input
          name="sessionDate"
          type="date"
          defaultValue="2026-07-13"
          required
        />
      </label>
      <label className="form-field">
        技能
        <select name="skill" defaultValue="LISTENING">
          <option value="LISTENING">听力</option>
          <option value="READING">阅读</option>
          <option value="WRITING_TASK_1">写作 Task 1</option>
          <option value="WRITING_TASK_2">写作 Task 2</option>
          <option value="SPEAKING">口语</option>
          <option value="VOCABULARY">词汇</option>
          <option value="MOCK">模考</option>
        </select>
      </label>
      <label className="form-field sm:col-span-2">
        材料 / 来源
        <input
          name="sourceMaterial"
          placeholder="Cambridge IELTS、课程材料或链接标题"
        />
      </label>
      <label className="form-field">
        计划分钟
        <input
          name="plannedMinutes"
          type="number"
          min="1"
          max="600"
          defaultValue="30"
        />
      </label>
      <label className="form-field">
        实际分钟
        <input
          name="actualMinutes"
          type="number"
          min="1"
          max="600"
          defaultValue="30"
          required
        />
      </label>
      <label className="form-field">
        原始分数（可选）
        <input name="rawScore" type="number" min="0" step="0.5" />
      </label>
      <label className="form-field">
        估算 Band（可选）
        <input name="estimatedBand" type="number" min="0" max="9" step="0.5" />
      </label>
      <label className="form-field sm:col-span-2">
        主要错误
        <textarea
          name="mainErrors"
          rows={3}
          placeholder="记录最值得复盘的错误模式"
        />
      </label>
      <label className="form-field sm:col-span-2">
        下一步
        <input name="nextAction" placeholder="下次练什么，以及如何练" />
      </label>
      <label className="form-field sm:col-span-2">
        HTTPS 参考链接（可选）
        <input name="attachmentUrl" type="url" placeholder="https://…" />
      </label>
      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "auth-message-success sm:col-span-2"
              : "auth-message-error sm:col-span-2"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="sm:col-span-2" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {pending ? "保存中…" : "记录 IELTS 练习"}
      </Button>
    </form>
  );
}
