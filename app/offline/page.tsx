import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff, FilePenLine, LockKeyhole, Wifi } from "lucide-react";

import { Brand } from "@/components/brand";
import { ReconnectButton } from "@/components/reconnect-button";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "当前离线 · Summer OS",
  description: "Summer OS 的安全离线提示与本机草稿说明。",
};

export default function OfflinePage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="page-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_15%,transparent),transparent_68%)] blur-2xl" />
      <section className="shadow-raised relative w-full max-w-xl rounded-[1.5rem] border border-border bg-surface/94 p-6 text-center backdrop-blur-xl sm:p-10">
        <Brand className="justify-center" />
        <div className="mx-auto mt-8 flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <CloudOff aria-hidden="true" className="size-6" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-4xl">
          网络暂时离开了
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Summer OS
          不会在离线时猜测提交结果。恢复网络后刷新页面，你的线上记录仍以服务器版本为准。
        </p>
        <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-subtle p-4">
            <FilePenLine aria-hidden="true" className="size-4 text-primary" />
            <p className="mt-3 text-sm font-semibold">打卡草稿可保留</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              已开始的草稿可能仍在这台设备里，联网后请确认再提交。
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-subtle p-4">
            <LockKeyhole aria-hidden="true" className="size-4 text-secondary" />
            <p className="mt-3 text-sm font-semibold">敏感数据不缓存</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              应用外壳可以离线打开，但认证页面和健康记录不会由离线缓存保存。
            </p>
          </div>
        </div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ReconnectButton />
          <Link href="/" className={buttonVariants({ variant: "secondary" })}>
            返回首页
          </Link>
        </div>
        <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wifi aria-hidden="true" className="size-3.5" />
          连接恢复后，点击“重新连接”
        </p>
      </section>
    </main>
  );
}
