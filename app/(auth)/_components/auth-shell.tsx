import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />
      <section className="auth-card">
        <Link className="auth-back" href="/">
          <ArrowLeft className="size-4" /> 返回首页
        </Link>
        <div className="mb-8">
          <div className="auth-eyebrow">
            <Sparkles className="size-4" /> {eyebrow}
          </div>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
        </div>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </section>
      <p className="auth-beta-note">
        非商业公开测试 · 数据可随时导出 · 不构成医疗建议
      </p>
    </main>
  );
}
