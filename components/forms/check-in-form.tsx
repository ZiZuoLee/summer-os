"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  BookOpenCheck,
  Check,
  Dumbbell,
  HeartPulse,
  Save,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert } from "../ui/primitives";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Field, Input, Select, Textarea } from "../ui/field";
import { cn } from "../ui/cn";

const httpsUrl = z
  .string()
  .trim()
  .max(500, "链接过长")
  .refine(
    (value) => !value || value.startsWith("https://"),
    "仅支持 HTTPS 链接",
  );

export const checkInSchema = z.object({
  weightKg: z
    .number()
    .min(25, "请检查体重数值")
    .max(350, "请检查体重数值")
    .optional(),
  waistCm: z
    .number()
    .min(30, "请检查腰围数值")
    .max(300, "请检查腰围数值")
    .optional(),
  sleepHours: z
    .number()
    .min(0, "不能小于 0")
    .max(24, "不能超过 24 小时")
    .optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  steps: z.number().int().min(0).max(200000, "请检查步数").optional(),
  waterMl: z.number().int().min(0).max(10000, "请检查饮水量").optional(),
  proteinGrams: z.number().min(0).max(500, "请检查蛋白质数值").optional(),
  calories: z.number().int().min(0).max(10000, "请检查热量数值").optional(),
  regularMeals: z.boolean(),
  vegetables: z.boolean(),
  intakeConcern: z.boolean(),
  workoutType: z.string().trim().max(80, "最多 80 个字符"),
  workoutMinutes: z.number().int().min(0).max(600, "请检查训练时长").optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  ieltsMinutes: z.number().int().min(0).max(720, "请检查学习时长").optional(),
  ieltsLink: httpsUrl,
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  hunger: z.number().int().min(1).max(5).optional(),
  pain: z.number().int().min(0).max(10).optional(),
  dizziness: z.boolean(),
  note: z.string().trim().max(1000, "最多 1000 个字符"),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

const emptyValues: CheckInFormData = {
  regularMeals: false,
  vegetables: false,
  intakeConcern: false,
  workoutType: "",
  ieltsLink: "",
  dizziness: false,
  note: "",
};

const optionalNumber = {
  setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
};

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = false,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen || undefined}
      className="group shadow-soft rounded-[1.15rem] border border-border bg-surface"
    >
      <summary className="flex min-h-18 cursor-pointer list-none items-center gap-3 rounded-[1.15rem] px-4 py-3 marker:hidden hover:bg-surface-subtle sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
          <Icon aria-hidden="true" className="size-[1.125rem]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {description}
          </span>
        </span>
        <span
          className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-transform group-open:rotate-45"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 sm:p-5">
        {children}
      </div>
    </details>
  );
}

export interface CheckInFormProps {
  userId: string;
  date: string;
  initialValues?: Partial<CheckInFormData>;
  submitAction?: (data: CheckInFormData) => Promise<void> | void;
  submitLabel?: string;
}

export function CheckInForm({
  userId,
  date,
  initialValues,
  submitAction,
  submitLabel = "保存今日打卡",
}: CheckInFormProps) {
  const draftKey = useMemo(
    () => `summer-os:check-in-draft:v1:${userId}:${date}`,
    [userId, date],
  );
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    subscribe,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: { ...emptyValues, ...initialValues },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as {
          savedAt: number;
          data: Partial<CheckInFormData>;
        };
        const isFresh = Date.now() - draft.savedAt < 7 * 24 * 60 * 60 * 1000;
        if (isFresh) reset({ ...emptyValues, ...initialValues, ...draft.data });
        else localStorage.removeItem(draftKey);
      }
    } catch {
      localStorage.removeItem(draftKey);
    }

    return subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              schemaVersion: 1,
              savedAt: Date.now(),
              data: values,
            }),
          );
        } catch {
          // Private browsing or a full storage quota should not block the form.
        }
      },
    });
  }, [draftKey, initialValues, reset, subscribe]);

  async function submit(data: CheckInFormData) {
    try {
      await submitAction?.(data);
      setSubmitted(true);
      reset(data);
      localStorage.removeItem(draftKey);
      toast.success("今日打卡已保存");
    } catch {
      toast.error("保存失败，草稿仍保留在此设备");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
      {submitted ? (
        <Alert tone="success" title="打卡已保存">
          今天的记录已经安全提交。
        </Alert>
      ) : null}
      <Alert tone="primary" title="不必填满每一项">
        只记录你愿意记录的内容。所有空白指标都会明确保存为“未记录”，而不是 0。
      </Alert>

      <FormSection
        icon={HeartPulse}
        title="身体与睡眠"
        description="体重、睡眠和当下感受"
        defaultOpen
      >
        <Field
          label="体重（kg）"
          htmlFor="weightKg"
          optional
          error={errors.weightKg?.message}
        >
          <Input
            id="weightKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="例如 82.4"
            aria-invalid={Boolean(errors.weightKg)}
            {...register("weightKg", optionalNumber)}
          />
        </Field>
        <Field
          label="腰围（cm）"
          htmlFor="waistCm"
          optional
          error={errors.waistCm?.message}
        >
          <Input
            id="waistCm"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="可跳过"
            aria-invalid={Boolean(errors.waistCm)}
            {...register("waistCm", optionalNumber)}
          />
        </Field>
        <Field
          label="睡眠时长"
          htmlFor="sleepHours"
          optional
          error={errors.sleepHours?.message}
        >
          <Input
            id="sleepHours"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="小时"
            aria-invalid={Boolean(errors.sleepHours)}
            {...register("sleepHours", optionalNumber)}
          />
        </Field>
        <Field label="睡眠质量" htmlFor="sleepQuality" optional>
          <Select
            id="sleepQuality"
            {...register("sleepQuality", optionalNumber)}
          >
            <option value="">未记录</option>
            <option value="1">1 · 很差</option>
            <option value="2">2 · 较差</option>
            <option value="3">3 · 一般</option>
            <option value="4">4 · 良好</option>
            <option value="5">5 · 很好</option>
          </Select>
        </Field>
        <Field label="情绪" htmlFor="mood" optional>
          <Select id="mood" {...register("mood", optionalNumber)}>
            <option value="">未记录</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </Select>
        </Field>
        <Field label="精力" htmlFor="energy" optional>
          <Select id="energy" {...register("energy", optionalNumber)}>
            <option value="">未记录</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </Select>
        </Field>
        <Field label="饥饿感" htmlFor="hunger" optional>
          <Select id="hunger" {...register("hunger", optionalNumber)}>
            <option value="">未记录</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </Select>
        </Field>
        <Field label="疼痛程度" htmlFor="pain" optional>
          <Select id="pain" {...register("pain", optionalNumber)}>
            <option value="">未记录</option>
            {Array.from({ length: 11 }, (_, value) => (
              <option key={value} value={value}>
                {value} / 10
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex min-h-12 items-start gap-3 rounded-xl border border-border bg-surface-subtle px-3.5 py-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            {...register("dizziness")}
          />
          <span>
            <span className="font-medium text-foreground">
              今天出现过头晕或接近昏厥
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
              若正在发生或情况严重，请停止活动并寻求及时帮助。
            </span>
          </span>
        </label>
      </FormSection>

      <FormSection
        icon={Sparkles}
        title="日常与饮食"
        description="步数、饮水和饮食质量"
      >
        <Field
          label="步数"
          htmlFor="steps"
          optional
          error={errors.steps?.message}
        >
          <Input
            id="steps"
            type="number"
            inputMode="numeric"
            placeholder="例如 8000"
            {...register("steps", optionalNumber)}
          />
        </Field>
        <Field
          label="饮水（ml）"
          htmlFor="waterMl"
          optional
          error={errors.waterMl?.message}
        >
          <Input
            id="waterMl"
            type="number"
            inputMode="numeric"
            step="100"
            placeholder="例如 2000"
            {...register("waterMl", optionalNumber)}
          />
        </Field>
        <Field
          label="蛋白质估计（g）"
          htmlFor="proteinGrams"
          optional
          error={errors.proteinGrams?.message}
        >
          <Input
            id="proteinGrams"
            type="number"
            inputMode="decimal"
            placeholder="不确定可跳过"
            {...register("proteinGrams", optionalNumber)}
          />
        </Field>
        <Field
          label="热量估计（kcal）"
          htmlFor="calories"
          optional
          hint="仅用于自愿记录，不会据此生成处方。"
          error={errors.calories?.message}
        >
          <Input
            id="calories"
            type="number"
            inputMode="numeric"
            placeholder="可跳过"
            {...register("calories", optionalNumber)}
          />
        </Field>
        <div className="grid gap-2 sm:col-span-2">
          {[
            ["regularMeals", "今天大致规律进餐"],
            ["vegetables", "今天有蔬菜或完整食物"],
            ["intakeConcern", "我担心今天吃得太少"],
          ].map(([name, label]) => (
            <label
              key={name}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3.5 text-sm text-foreground hover:bg-surface-subtle"
            >
              <input
                type="checkbox"
                className="size-4 accent-primary"
                {...register(
                  name as "regularMeals" | "vegetables" | "intakeConcern",
                )}
              />
              {label}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection
        icon={Dumbbell}
        title="训练"
        description="可选的快速训练记录"
      >
        <Field
          label="训练类型"
          htmlFor="workoutType"
          optional
          error={errors.workoutType?.message}
        >
          <Input
            id="workoutType"
            placeholder="例如 步行、力量、瑜伽"
            {...register("workoutType")}
          />
        </Field>
        <Field
          label="时长（分钟）"
          htmlFor="workoutMinutes"
          optional
          error={errors.workoutMinutes?.message}
        >
          <Input
            id="workoutMinutes"
            type="number"
            inputMode="numeric"
            {...register("workoutMinutes", optionalNumber)}
          />
        </Field>
        <Field label="主观强度 RPE" htmlFor="rpe" optional>
          <Select id="rpe" {...register("rpe", optionalNumber)}>
            <option value="">未记录</option>
            {Array.from({ length: 10 }, (_, index) => index + 1).map(
              (value) => (
                <option key={value} value={value}>
                  {value} / 10
                </option>
              ),
            )}
          </Select>
        </Field>
      </FormSection>

      <FormSection
        icon={BookOpenCheck}
        title="IELTS"
        description="学习时间和本次资料"
      >
        <Field
          label="学习时长（分钟）"
          htmlFor="ieltsMinutes"
          optional
          error={errors.ieltsMinutes?.message}
        >
          <Input
            id="ieltsMinutes"
            type="number"
            inputMode="numeric"
            {...register("ieltsMinutes", optionalNumber)}
          />
        </Field>
        <Field
          label="资料链接"
          htmlFor="ieltsLink"
          optional
          error={errors.ieltsLink?.message}
        >
          <Input
            id="ieltsLink"
            type="url"
            inputMode="url"
            placeholder="https://..."
            {...register("ieltsLink")}
          />
        </Field>
      </FormSection>

      <Card className="p-4 sm:p-5">
        <Field
          label="给今天的备注"
          htmlFor="note"
          optional
          error={errors.note?.message}
        >
          <Textarea
            id="note"
            placeholder="今天有什么值得记住？请不要写入密码或验证码。"
            {...register("note")}
          />
        </Field>
      </Card>

      <div className="shadow-raised sticky bottom-[4.7rem] z-20 -mx-2 rounded-2xl border border-border bg-surface/92 p-3 backdrop-blur-xl lg:bottom-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <Save aria-hidden="true" className="size-3.5" />
            {isDirty ? "草稿已自动保存在此设备" : "没有待保存的更改"}
          </p>
          <Button
            type="submit"
            loading={isSubmitting}
            className={cn("sm:min-w-40", submitted && !isDirty && "bg-success")}
          >
            {submitted && !isDirty ? (
              <Check aria-hidden="true" className="size-4" />
            ) : null}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
