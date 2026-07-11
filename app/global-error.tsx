"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="grid min-h-dvh place-items-center bg-[#090b11] px-6 text-white">
        <main className="max-w-md text-center">
          <p className="text-sm font-medium text-cyan-300">Summer OS</p>
          <h1 className="mt-4 text-3xl font-semibold">应用遇到了意外问题</h1>
          <p className="mt-3 text-slate-400">
            请重新载入。已经提交的数据不会因为这个页面而删除。
          </p>
          <button
            className="mt-7 min-h-12 rounded-xl bg-cyan-300 px-5 font-semibold text-slate-950"
            onClick={reset}
          >
            重新载入
          </button>
        </main>
      </body>
    </html>
  );
}
