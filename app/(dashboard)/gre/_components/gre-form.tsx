"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import {
  addGreProgramAction,
  type MutationState,
} from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

const initial: MutationState = { status: "idle" };

export function GreProgramForm() {
  const [state, action, pending] = useActionState(addGreProgramAction, initial);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="form-field">
        大学
        <input name="university" required />
      </label>
      <label className="form-field">
        项目
        <input name="program" required />
      </label>
      <label className="form-field">
        入学季
        <input name="intake" placeholder="2027 Fall" />
      </label>
      <label className="form-field">
        要求状态
        <select name="requirementStatus" defaultValue="UNKNOWN">
          <option value="REQUIRED">必须</option>
          <option value="OPTIONAL">可选</option>
          <option value="NOT_REQUIRED">不要求</option>
          <option value="NOT_ACCEPTED">不接受 / 不考虑</option>
          <option value="UNKNOWN">待核验</option>
        </select>
      </label>
      <label className="form-field sm:col-span-2">
        官方要求 HTTPS 链接
        <input
          type="url"
          name="officialRequirementUrl"
          placeholder="https://…"
        />
      </label>
      <label className="form-field">
        申请截止日期
        <input type="date" name="applicationDeadline" />
      </label>
      <label className="form-field">
        核验日期
        <input type="date" name="verifiedDate" />
      </label>
      <label className="form-field sm:col-span-2">
        奖学金相关性
        <input name="scholarshipRelevance" />
      </label>
      <label className="form-field sm:col-span-2">
        备注
        <textarea name="notes" rows={3} />
      </label>
      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "auth-message-success sm:col-span-2"
              : "auth-message-error sm:col-span-2"
          }
        >
          {state.message}
        </p>
      ) : null}
      <Button className="sm:col-span-2" type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {pending ? "保存中…" : "添加项目要求"}
      </Button>
    </form>
  );
}
