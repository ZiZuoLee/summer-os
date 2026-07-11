"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import {
  completeOnboardingAction,
  type OnboardingState,
} from "@/app/onboarding/actions";

const initialState: OnboardingState = { status: "idle" };
const weekdays = [
  [1, "一"],
  [2, "二"],
  [3, "三"],
  [4, "四"],
  [5, "五"],
] as const;

function ErrorText({ messages }: { messages?: string[] }) {
  return messages?.[0] ? (
    <p className="mt-1 text-xs text-rose-400">{messages[0]}</p>
  ) : null;
}

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState(
    completeOnboardingAction,
    initialState,
  );
  const [template, setTemplate] = useState("kirito-summer-2026");

  return (
    <form action={action} className="space-y-8">
      <section className="onboarding-section">
        <div className="onboarding-section-heading">
          <span>01</span>
          <div>
            <h2>先认识你</h2>
            <p>这些信息只用于个性化趋势和计划。</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-field sm:col-span-2">
            昵称
            <input name="displayName" defaultValue={defaultName} />
            <ErrorText messages={state.fieldErrors?.displayName} />
          </label>
          <label className="form-field">
            身高（cm）
            <input
              name="heightCm"
              type="number"
              defaultValue="180"
              min="100"
              max="250"
            />
          </label>
          <label className="form-field">
            当前体重（kg）
            <input
              name="startingWeightKg"
              type="number"
              step="0.1"
              defaultValue="83"
            />
          </label>
          <label className="form-field">
            愿望目标（kg）
            <input
              name="targetWeightKg"
              type="number"
              step="0.1"
              defaultValue="75"
            />
          </label>
          <label className="form-field">
            伸展目标（可选）
            <input
              name="stretchTargetWeightKg"
              type="number"
              step="0.1"
              defaultValue="73"
            />
          </label>
          <label className="form-field">
            之前 IELTS 成绩
            <input
              name="previousIeltsBand"
              type="number"
              step="0.5"
              min="0"
              max="9"
              defaultValue="7.5"
            />
          </label>
          <label className="form-field">
            时区
            <input
              name="timezone"
              defaultValue="Asia/Shanghai"
              placeholder="Asia/Shanghai"
            />
          </label>
        </div>
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
          83 kg 到 75 kg 在 50 天内意味着超过每周 1%
          的下降速度。我们会保留愿望目标，但只显示更保守的趋势，不提供极端饮食建议。
        </div>
      </section>

      <section className="onboarding-section">
        <div className="onboarding-section-heading">
          <span>02</span>
          <div>
            <h2>选择计划方式</h2>
            <p>可以使用完整 Kirito 模板，也可以从自己的日程开始。</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              id: "kirito-summer-2026",
              icon: Sparkles,
              title: "Kirito 2026",
              description:
                "固定 2026-07-13 至 08-31，包含 50 个经过测试的独特计划日。",
              badge: "推荐体验",
            },
            {
              id: "summer-os-flex",
              icon: CalendarDays,
              title: "自定义 Summer OS",
              description:
                "选择 7–120 天，并根据自己的工作、课程和考试安排生成。",
              badge: "灵活",
            },
          ].map((option) => {
            const Icon = option.icon;
            const selected = template === option.id;
            return (
              <label
                className={`template-option ${selected ? "template-option-selected" : ""}`}
                key={option.id}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="templateKey"
                  value={option.id}
                  checked={selected}
                  onChange={() => setTemplate(option.id)}
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="template-icon">
                    <Icon className="size-5" />
                  </span>
                  {selected ? <Check className="size-5 text-cyan-300" /> : null}
                </div>
                <strong>{option.title}</strong>
                <p>{option.description}</p>
                <small>{option.badge}</small>
              </label>
            );
          })}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="form-field">
            开始日期
            <input
              name="startDate"
              type="date"
              defaultValue="2026-07-13"
              disabled={template === "kirito-summer-2026"}
            />
            <input
              type="hidden"
              name={
                template === "kirito-summer-2026"
                  ? "startDate"
                  : "_canonicalStart"
              }
              value="2026-07-13"
            />
          </label>
          <label className="form-field">
            结束日期
            <input
              name="endDate"
              type="date"
              defaultValue="2026-08-31"
              disabled={template === "kirito-summer-2026"}
            />
            <input
              type="hidden"
              name={
                template === "kirito-summer-2026" ? "endDate" : "_canonicalEnd"
              }
              value="2026-08-31"
            />
          </label>
          <label className="form-field">
            IELTS 考试日期（可编辑）
            <input name="ieltsExamDate" type="date" defaultValue="2026-08-29" />
          </label>
        </div>
        {template === "summer-os-flex" ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <fieldset className="weekday-fieldset">
              <legend>实习 / 工作日</legend>
              <div>
                {weekdays.map(([day, label]) => (
                  <label key={day}>
                    <input type="checkbox" name="internshipDays" value={day} />
                    <span>周{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="weekday-fieldset">
              <legend>课程日</legend>
              <div>
                {weekdays.map(([day, label]) => (
                  <label key={day}>
                    <input type="checkbox" name="courseDays" value={day} />
                    <span>周{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}
      </section>

      <section className="onboarding-section">
        <div className="onboarding-section-heading">
          <span>03</span>
          <div>
            <h2>设置温和目标</h2>
            <p>以后随时可以在设置中调整。</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-field">
            营养记录方式
            <select name="nutritionMode" defaultValue="BALANCED">
              <option value="BALANCED">均衡记录（推荐）</option>
              <option value="PLATE_METHOD">餐盘法</option>
              <option value="MINDFUL">正念记录</option>
              <option value="CUSTOM">自定义</option>
            </select>
          </label>
          <label className="form-field">
            每日步数
            <input name="stepTarget" type="number" defaultValue="10000" />
          </label>
          <label className="form-field">
            饮水目标（ml）
            <input name="waterTargetMl" type="number" defaultValue="2500" />
          </label>
          <label className="form-field">
            蛋白质目标（g）
            <input name="proteinTargetG" type="number" defaultValue="130" />
          </label>
          <label className="form-field">
            睡眠目标（分钟）
            <input name="sleepTargetMinutes" type="number" defaultValue="450" />
          </label>
        </div>
      </section>

      {state.message ? (
        <p
          className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="auth-submit sticky bottom-4 shadow-2xl shadow-cyan-500/10"
        type="submit"
        disabled={pending}
      >
        {pending ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {pending ? "正在生成计划…" : "创建我的 Summer OS"}
        <ArrowRight className="size-5" />
      </button>
    </form>
  );
}
