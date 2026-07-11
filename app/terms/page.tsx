import type { Metadata } from "next";

import { PublicDocument } from "@/components/public-document";

export const metadata: Metadata = {
  title: "使用条款 · Summer OS",
  description: "Summer OS 免费非商业公开测试版的使用条件与健康免责声明。",
};

export default function TermsPage() {
  return (
    <PublicDocument
      eyebrow="Terms"
      title="使用条款"
      intro="这是一个尽力而为的个人公开测试项目。请先了解它能做什么，也了解它不能替你做什么。"
      updated="2026 年 7 月 11 日"
    >
      <section>
        <h2>1. 接受与资格</h2>
        <p className="mt-3">
          创建账号或继续使用 Summer OS
          即表示你理解并接受本条款与隐私说明。你必须年满 18
          周岁，并仅将服务用于个人、合法和非商业目的。
        </p>
      </section>

      <section>
        <h2>2. 测试版性质</h2>
        <p className="mt-3">
          Summer OS
          使用免费托管资源，功能、容量和可用性可能发生变化，项目不承诺服务等级、永久可用、无错误运行或特定恢复时间。测试容量达到上限时，可能暂停新注册，但不影响已有用户登录（服务可用时）。
        </p>
      </section>

      <section>
        <h2>3. 账号责任与可接受使用</h2>
        <ul className="mt-3">
          <li>提供你有权使用的邮箱地址，并保护账号凭证。</li>
          <li>
            不得尝试访问他人数据、绕过速率限制、干扰服务或自动化滥用注册。
          </li>
          <li>不得上传违法、有害内容或将链接功能用于分发恶意内容。</li>
          <li>
            发现安全问题时，请通过维护者联络方式负责任地报告，不要公开真实用户数据。
          </li>
        </ul>
      </section>

      <section>
        <h2>4. 健康与学习免责声明</h2>
        <p className="mt-3">
          本服务只整理你输入的信息并展示保守趋势，不提供医疗诊断、治疗、营养处方、训练处方或考试结果保证。目标体重、趋势投影和提醒均不能替代专业判断。请根据自己的实际情况决定是否记录或执行某项计划。
        </p>
      </section>

      <section>
        <h2>5. 你的内容与数据</h2>
        <p className="mt-3">
          你保留对自己输入内容的权利，同时允许服务在提供相关功能所必需的范围内处理这些内容。请勿输入你无权处理的第三方敏感信息。你可以使用导出与账号删除功能管理数据。
        </p>
      </section>

      <section>
        <h2>6. 暂停与终止</h2>
        <p className="mt-3">
          为保护服务、用户或满足托管限制，项目可能暂停异常账号、限制滥用流量或停止公开测试。若计划终止服务，我们会在合理可行时提前提醒用户导出记录，但紧急安全事件或上游服务中断可能无法提前通知。
        </p>
      </section>

      <section>
        <h2>7. 责任边界与变更</h2>
        <p className="mt-3">
          在适用法律允许的范围内，服务按“现状”和“可用状态”提供。你应为重要信息保留自己的副本，并对基于应用信息作出的决定负责。条款更新后继续使用服务即表示接受更新；重要调整会在应用中说明。
        </p>
      </section>
    </PublicDocument>
  );
}
