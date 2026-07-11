"use client";

import { useActionState } from "react";
import { Scale } from "lucide-react";
import {
  saveGreDecisionAction,
  type MutationState,
} from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import type { GreDecisionView } from "@/lib/data/sections";

const initial: MutationState = { status: "idle" };
const questions = [
  ["TARGET_PROGRAMS_LISTED", "已列出目标大学和项目"],
  ["GRE_REQUIRED", "已核验每个项目官网的 GRE 要求"],
  ["COST_AND_AVAILABILITY_CHECKED", "已确认考试时间、地点与费用"],
  ["ENOUGH_PREP_TIME", "已评估 IELTS 后可用备考时间"],
  ["OPPORTUNITY_COST_ACCEPTABLE", "已比较其他申请任务的机会成本"],
  ["QUANT_SCORE_VALUE", "已判断目标分数能否实质提升申请"],
] as const;

export function GreDecisionForm({ value }: { value: GreDecisionView }) {
  const [state, action, pending] = useActionState(
    saveGreDecisionAction,
    initial,
  );
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {questions.map(([key, label]) => (
          <label className="check-chip justify-start" key={key}>
            <input
              type="checkbox"
              name="checklist"
              value={key}
              defaultChecked={value.completedChecks.includes(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(13rem,.55fr)_1fr]">
        <label className="form-field">
          当前决定
          <select name="decision" defaultValue={value.decision}>
            <option value="PREPARE">PREPARE · 准备</option>
            <option value="DO_NOT_PREPARE">DO NOT PREPARE · 不准备</option>
            <option value="DEFER_PENDING_SCHOOL_LIST">
              DEFER · 等学校清单完整
            </option>
          </select>
        </label>
        <label className="form-field">
          证据与取舍
          <textarea
            name="rationale"
            rows={4}
            minLength={20}
            maxLength={4000}
            defaultValue={value.rationale}
            required
            placeholder="至少 20 字：哪些官网要求、时间成本和机会成本支持这个决定？"
          />
        </label>
      </div>
      {state.message ? (
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
      ) : null}
      <Button type="submit" loading={pending}>
        <Scale className="size-4" />
        保存 GRE 决策
      </Button>
    </form>
  );
}
