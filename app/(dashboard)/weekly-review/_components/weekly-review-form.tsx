"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import {
  saveWeeklyReviewAction,
  type MutationState,
} from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import type { WeeklyReviewData } from "@/lib/data/sections";

const initial: MutationState = { status: "idle" };

export function WeeklyReviewForm({ review }: { review: WeeklyReviewData }) {
  const [state, action, pending] = useActionState(
    saveWeeklyReviewAction,
    initial,
  );
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="weekStartDate" value={review.weekStartDate} />
      <label className="form-field">
        本周最值得肯定的事
        <textarea
          name="wins"
          defaultValue={review.wins}
          rows={4}
          required
          maxLength={3000}
          placeholder="不只记录结果，也记录你采取了什么行动。"
        />
      </label>
      <label className="form-field">
        遇到的阻力
        <textarea
          name="challenges"
          defaultValue={review.challenges}
          rows={3}
          maxLength={3000}
          placeholder="时间、精力、环境或计划本身的问题。"
        />
      </label>
      <label className="form-field">
        下周要调整什么
        <textarea
          name="adjustments"
          defaultValue={review.adjustments}
          rows={3}
          maxLength={3000}
          placeholder="尽量写成一个可执行的小变化。"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="form-field">
          恢复感受
          <select
            name="recoveryRating"
            defaultValue={String(review.recoveryRating ?? "")}
          >
            <option value="">待评估</option>
            <option value="1">1 · 很疲惫</option>
            <option value="2">2 · 偏疲惫</option>
            <option value="3">3 · 一般</option>
            <option value="4">4 · 不错</option>
            <option value="5">5 · 精力充足</option>
          </select>
        </label>
        <label className="form-field">
          倦怠程度
          <select
            name="burnoutRating"
            defaultValue={String(review.burnoutRating ?? "")}
          >
            <option value="">待评估</option>
            <option value="1">1 · 很低</option>
            <option value="2">2 · 偏低</option>
            <option value="3">3 · 中等</option>
            <option value="4">4 · 偏高</option>
            <option value="5">5 · 很高</option>
          </select>
        </label>
      </div>
      <label className="form-field">
        下周停止做的一件事
        <input
          name="stopCommitment"
          defaultValue={review.stopCommitment}
          maxLength={1000}
          placeholder="停止一个消耗大、收益低的行为。"
        />
      </label>
      <label className="form-field">
        下周唯一焦点
        <input
          name="nextWeekFocus"
          defaultValue={review.nextWeekFocus}
          maxLength={1000}
          placeholder="如果只推进一件事，会是什么？"
        />
      </label>
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
        <Sparkles className="size-4" />
        保存本周复盘
      </Button>
    </form>
  );
}
