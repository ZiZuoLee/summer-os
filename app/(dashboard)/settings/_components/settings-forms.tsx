"use client";

import { useActionState } from "react";
import { Download, Save, Trash2 } from "lucide-react";
import {
  deleteAccountAction,
  updateSettingsAction,
  type MutationState,
} from "@/app/(dashboard)/actions";
import { InstallPrompt } from "@/components/install-prompt";
import { clearSummerOsDrafts } from "@/components/draft-privacy";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AwaitedReturn } from "./types";

const initial: MutationState = { status: "idle" };

function Message({ state }: { state: MutationState }) {
  return state.message ? (
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
  ) : null;
}

export function SettingsForms({ profile }: { profile: AwaitedReturn }) {
  const [settingsState, settingsAction, settingsPending] = useActionState(
    updateSettingsAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccountAction,
    initial,
  );
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>个人与目标</CardTitle>
          <CardDescription>
            时区保留完整 IANA 标识；75 kg 是愿景，不是必须按期达到的处方。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={settingsAction} className="grid gap-4 sm:grid-cols-2">
            <label className="form-field">
              显示名称
              <input
                name="displayName"
                defaultValue={profile.displayName}
                required
                maxLength={80}
              />
            </label>
            <label className="form-field">
              时区
              <input
                name="timezone"
                defaultValue={profile.timezone}
                required
                placeholder="Asia/Shanghai"
              />
            </label>
            <label className="form-field">
              目标体重（kg）
              <input
                name="targetWeightKg"
                type="number"
                min="30"
                max="350"
                step="0.1"
                defaultValue={profile.targetWeightKg}
              />
            </label>
            <label className="form-field">
              延伸愿景（kg）
              <input
                name="stretchTargetWeightKg"
                type="number"
                min="30"
                max="350"
                step="0.1"
                defaultValue={profile.stretchTargetWeightKg}
              />
            </label>
            <label className="form-field">
              每日步数目标
              <input
                name="stepTarget"
                type="number"
                min="1000"
                max="50000"
                defaultValue={profile.stepTarget}
              />
            </label>
            <label className="form-field">
              每日饮水目标（ml）
              <input
                name="waterTargetMl"
                type="number"
                min="500"
                max="8000"
                defaultValue={profile.waterTargetMl}
              />
            </label>
            <label className="form-field">
              每日蛋白质参考（g）
              <input
                name="proteinTargetG"
                type="number"
                min="20"
                max="400"
                defaultValue={profile.proteinTargetG}
              />
            </label>
            <label className="form-field">
              每日睡眠目标（分钟）
              <input
                name="sleepTargetMinutes"
                type="number"
                min="240"
                max="720"
                defaultValue={profile.sleepTargetMinutes}
              />
            </label>
            <label className="form-field sm:col-span-2">
              IELTS 考试日期
              <input
                name="ieltsExamDate"
                type="date"
                defaultValue={profile.ieltsExamDate}
              />
            </label>
            <div className="sm:col-span-2">
              <Message state={settingsState} />
            </div>
            <Button
              type="submit"
              loading={settingsPending}
              className="sm:col-span-2"
            >
              <Save className="size-4" />
              保存设置
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>外观与安装</CardTitle>
            <CardDescription>
              支持浅色、深色、跟随系统，以及可安装 PWA。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ThemeToggle />
            <InstallPrompt />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>导出数据</CardTitle>
            <CardDescription>
              CSV 会防止电子表格公式注入；JSON 是完整的用户自助备份。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-4 text-sm font-semibold hover:bg-muted"
              href="/api/export?format=json"
            >
              <Download className="size-4" />
              导出完整 JSON
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-4 text-sm font-semibold hover:bg-muted"
              href="/api/export?format=csv"
            >
              <Download className="size-4" />
              导出打卡 CSV
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="border-danger/25">
        <CardHeader>
          <CardTitle>删除账户</CardTitle>
          <CardDescription>
            永久删除 Auth 身份并级联删除所有 Summer OS
            数据。必须刚刚重新验证密码，并准确输入邮箱和
            DELETE。部分已删除数据可能保留在提供商级备份中，直至备份自然过期。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={deleteAction}
            onSubmit={clearSummerOsDrafts}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="form-field">
              确认邮箱
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder={profile.email}
                required
              />
            </label>
            <label className="form-field">
              当前密码
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label className="form-field sm:col-span-2">
              输入 DELETE
              <input
                name="confirmation"
                autoComplete="off"
                pattern="DELETE"
                required
              />
            </label>
            <div className="sm:col-span-2">
              <Message state={deleteState} />
            </div>
            <Button
              type="submit"
              loading={deletePending}
              variant="danger"
              className="sm:col-span-2"
            >
              <Trash2 className="size-4" />
              永久删除我的账户
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
