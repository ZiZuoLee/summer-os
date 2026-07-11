"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { publicEnv } from "@/lib/env";
import type { AuthActionState } from "@/app/(auth)/actions";
import { initialAuthState } from "@/app/(auth)/state";

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
};

export function AuthForm({
  action,
  fields,
  submitLabel,
  next,
  turnstile = false,
  signupConsent = false,
}: {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  fields: Field[];
  submitLabel: string;
  next?: string;
  turnstile?: boolean;
  signupConsent?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  const [token, setToken] = useState("");

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {fields.map((field) => (
        <div className="space-y-2" key={field.name}>
          <label className="auth-label" htmlFor={field.name}>
            {field.label}
          </label>
          <input
            className="auth-input"
            id={field.name}
            name={field.name}
            type={field.type ?? "text"}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            aria-describedby={
              state.fieldErrors?.[field.name]?.[0]
                ? `${field.name}-error`
                : undefined
            }
          />
          {state.fieldErrors?.[field.name]?.[0] ? (
            <p className="auth-error" id={`${field.name}-error`}>
              {state.fieldErrors[field.name][0]}
            </p>
          ) : null}
        </div>
      ))}

      {signupConsent ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-300">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              className="mt-1 size-4 accent-cyan-400"
              type="checkbox"
              name="ageConfirmed"
            />
            <span>我确认已满 18 周岁。</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              className="mt-1 size-4 accent-cyan-400"
              type="checkbox"
              name="disclaimerAccepted"
            />
            <span>
              我已阅读健康提示，理解本产品不提供医疗建议，并同意
              <Link
                className="text-cyan-300 underline-offset-4 hover:underline"
                href="/privacy"
              >
                隐私说明
              </Link>
              。
            </span>
          </label>
          {state.fieldErrors?.ageConfirmed?.[0] ||
          state.fieldErrors?.disclaimerAccepted?.[0] ? (
            <p className="auth-error">请确认年龄并同意健康提示。</p>
          ) : null}
        </div>
      ) : null}

      {turnstile ? (
        <div className="min-h-16">
          <input type="hidden" name="turnstileToken" value={token} />
          {publicEnv.turnstileSiteKey ? (
            <Turnstile
              siteKey={publicEnv.turnstileSiteKey}
              onSuccess={setToken}
              onExpire={() => setToken("")}
              options={{ theme: "auto", size: "flexible" }}
            />
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2 text-xs text-slate-400">
              <ShieldCheck className="size-4" aria-hidden="true" />
              本地环境：安全验证将在部署后启用
            </div>
          )}
        </div>
      ) : null}

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
            <CheckCircle2 className="size-4 shrink-0" />
          ) : null}
          <span>{state.message}</span>
        </div>
      ) : null}

      <button className="auth-submit" disabled={pending} type="submit">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "处理中…" : submitLabel}
        {!pending ? <ArrowRight className="size-4" /> : null}
      </button>
    </form>
  );
}
