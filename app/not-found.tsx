import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div>
        <p className="text-sm font-semibold text-primary">404 · Summer OS</p>
        <h1 className="mt-3 text-3xl font-semibold">这里没有安排</h1>
        <p className="mt-3 text-muted-foreground">
          这个页面不存在，或已经移动到新的位置。
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-[#041317]"
          href="/"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
