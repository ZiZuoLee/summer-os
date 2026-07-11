"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  CloudOff,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  submitCheckinAction,
  type MutationState,
} from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: MutationState = { status: "idle" };
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;

type Draft = { savedAt: number; entries: [string, string][] };

function RangeField({
  name,
  label,
  min = 1,
  max = 10,
  defaultValue = 5,
}: {
  name: string;
  label: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}) {
  return (
    <label className="checkin-range">
      <span>{label}</span>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        defaultValue={defaultValue}
      />
      <span className="text-xs text-muted-foreground">
        {min}–{max}
      </span>
    </label>
  );
}

export function CheckInForm({
  date,
  userKey,
}: {
  date: string;
  userKey: string;
}) {
  const [state, action, pending] = useActionState(
    submitCheckinAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyRef = useRef<HTMLInputElement>(null);
  const draftKey = `summer-os:checkin-draft:v1:${userKey}:${date}`;

  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (!raw || !formRef.current) return;
    try {
      const draft = JSON.parse(raw) as Draft;
      if (Date.now() - draft.savedAt > DRAFT_TTL) {
        localStorage.removeItem(draftKey);
        return;
      }
      for (const [name, value] of draft.entries) {
        const elements = formRef.current.elements.namedItem(name);
        if (!elements) continue;
        const candidates =
          elements instanceof RadioNodeList ? Array.from(elements) : [elements];
        candidates.forEach((candidate) => {
          if (
            candidate instanceof HTMLInputElement &&
            ["checkbox", "radio"].includes(candidate.type)
          ) {
            candidate.checked =
              candidate.value === value ||
              (candidate.value === "on" && value === "on");
          } else if (
            candidate instanceof HTMLInputElement ||
            candidate instanceof HTMLTextAreaElement ||
            candidate instanceof HTMLSelectElement
          ) {
            candidate.value = value;
          }
        });
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    if (state.status === "success") {
      localStorage.removeItem(draftKey);
      if (idempotencyRef.current) idempotencyRef.current.value = "";
    }
  }, [draftKey, state.status]);

  function ensureIdempotencyKey() {
    if (!idempotencyRef.current || idempotencyRef.current.value) return;
    idempotencyRef.current.value =
      globalThis.crypto?.randomUUID?.() ?? `${date}:${userKey}:checkin`;
  }

  function saveDraft() {
    ensureIdempotencyKey();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const entries = Array.from(formData.entries())
      .filter(([name]) => !["idempotencyKey", "logDate"].includes(name))
      .map(([name, value]) => [name, String(value)] as [string, string]);
    localStorage.setItem(
      draftKey,
      JSON.stringify({ savedAt: Date.now(), entries } satisfies Draft),
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      onInput={saveDraft}
      onSubmit={ensureIdempotencyKey}
      className="space-y-5"
    >
      <input type="hidden" name="logDate" value={date} />
      <input
        ref={idempotencyRef}
        type="hidden"
        name="idempotencyKey"
        defaultValue=""
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>身体基线</CardTitle>
            <CardDescription>
              可以跳过不想记录的指标；空白与“跳过”会被区别保存。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="form-field">
            体重（kg）
            <input
              name="weightKg"
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="例如 82.4"
            />
          </label>
          <label className="form-field">
            腰围（cm，可选）
            <input
              name="waistCm"
              type="number"
              step="0.1"
              inputMode="decimal"
            />
          </label>
          <label className="form-field">
            睡眠时长（小时）
            <input
              name="sleepHours"
              type="number"
              step="0.1"
              min="0"
              max="24"
              placeholder="7.5"
            />
          </label>
          <label className="form-field">
            睡眠质量
            <select name="sleepQuality" defaultValue="">
              <option value="">待记录</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option value={value} key={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            步数
            <input name="steps" type="number" min="0" inputMode="numeric" />
          </label>
          <label className="form-field">
            饮水（ml）
            <input
              name="waterMl"
              type="number"
              min="0"
              step="100"
              inputMode="numeric"
            />
          </label>
          <label className="form-field">
            蛋白质估算（g）
            <input name="proteinG" type="number" min="0" inputMode="numeric" />
          </label>
          <label className="form-field">
            热量估算（可选）
            <input name="calories" type="number" min="0" inputMode="numeric" />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">明确跳过</legend>
            <p className="mb-2 text-xs text-muted-foreground">
              没有记录某项时可明确标记；已填写的项目不要同时勾选。
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ["weight", "体重"],
                ["waist", "腰围"],
                ["sleep", "睡眠"],
                ["steps", "步数"],
                ["water", "饮水"],
                ["protein", "蛋白质"],
                ["calories", "热量"],
              ].map(([value, label]) => (
                <label className="check-chip" key={value}>
                  <input type="checkbox" name="skippedMetrics" value={value} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>营养与状态</CardTitle>
            <CardDescription>
              不需要精确计算，也不要因为一次记录惩罚自己。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              今天做到的餐食习惯
            </legend>
            <div className="flex flex-wrap gap-2">
              {[
                ["protein_forward", "优先蛋白质"],
                ["vegetables", "有蔬菜"],
                ["mindful_portion", "留意份量"],
                ["regular_meals", "规律进餐"],
              ].map(([value, label]) => (
                <label className="check-chip" key={value}>
                  <input
                    type="checkbox"
                    name="mealQualityFlags"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <RangeField name="mood" label="心情" max={5} defaultValue={3} />
            <RangeField name="energy" label="精力" max={5} defaultValue={3} />
            <RangeField name="hunger" label="饥饿感" max={5} defaultValue={3} />
            <RangeField
              name="painLevel"
              label="疼痛程度"
              min={0}
              max={10}
              defaultValue={0}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="safety-check">
              <input type="checkbox" name="dizzinessOrFainting" />
              <span>
                <strong>今天有眩晕或晕厥</strong>
                <small>保存后会显示安全提醒</small>
              </span>
            </label>
            <label className="safety-check">
              <input type="checkbox" name="intakeConcern" />
              <span>
                <strong>我担心今天摄入过少</strong>
                <small>这是自我报告，不依据热量推断</small>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>训练与 IELTS</CardTitle>
            <CardDescription>
              快速记录会同步到各自的完整页面，不会重复统计。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="form-field">
            运动类型
            <select name="workoutType" defaultValue="">
              <option value="">今天没有 / 稍后记录</option>
              <option value="STRENGTH_A">力量 A</option>
              <option value="STRENGTH_B">力量 B</option>
              <option value="STRENGTH_C">轻量全身</option>
              <option value="ZONE_2">Zone 2</option>
              <option value="WALK">步行 / 恢复</option>
              <option value="MOBILITY">灵活性</option>
            </select>
          </label>
          <label className="form-field">
            运动时长（分钟）
            <input name="workoutMinutes" type="number" min="0" />
          </label>
          <label className="form-field">
            主观强度 RPE
            <select name="workoutRpe" defaultValue="">
              <option value="">待记录</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map(
                (value) => (
                  <option key={value} value={value}>
                    {value} / 10
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="form-field">
            IELTS 技能
            <select name="ieltsSkill" defaultValue="VOCABULARY">
              <option value="LISTENING">听力</option>
              <option value="READING">阅读</option>
              <option value="WRITING_TASK_1">写作 Task 1</option>
              <option value="WRITING_TASK_2">写作 Task 2</option>
              <option value="SPEAKING">口语</option>
              <option value="VOCABULARY">词汇</option>
              <option value="MOCK">模考</option>
            </select>
          </label>
          <label className="form-field">
            IELTS 分钟
            <input name="ieltsMinutes" type="number" min="0" />
          </label>
          <label className="form-field">
            IELTS 下一步
            <input
              name="ieltsNextAction"
              placeholder="例如：复盘地图题干扰项"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <label className="form-field">
            今天的备注（可选）
            <textarea
              name="notes"
              rows={4}
              maxLength={2000}
              placeholder="记录真正有帮助的信息，不必写得完整。"
            />
          </label>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            草稿仅保存在当前设备，7 天后自动失效；提交后存入你的私有数据库记录。
          </div>
        </CardContent>
      </Card>

      {state.message ? (
        <div
          className={
            state.status === "success"
              ? "auth-message-success"
              : "auth-message-error"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <CloudOff className="size-4" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}
      <div className="shadow-raised sticky bottom-20 z-20 rounded-2xl border border-border bg-background/92 p-3 backdrop-blur-xl lg:bottom-4">
        <Button type="submit" size="lg" width="full" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}
          {pending ? "正在安全保存…" : "完成今日打卡"}
        </Button>
      </div>
    </form>
  );
}
