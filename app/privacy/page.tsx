import type { Metadata } from "next";

import { PublicDocument } from "@/components/public-document";

export const metadata: Metadata = {
  title: "隐私说明 · Summer OS",
  description: "了解 Summer OS 公开测试版如何处理、保护与删除你的数据。",
};

export default function PrivacyPage() {
  return (
    <PublicDocument
      eyebrow="Privacy"
      title="隐私说明"
      intro="我们只收集运行个人计划、打卡与学习记录所必需的数据，并尽量让你始终知道数据去了哪里。"
      updated="2026 年 7 月 11 日"
    >
      <section>
        <h2>1. 适用范围</h2>
        <p className="mt-3">
          本说明适用于 Summer OS 免费、非商业公开测试版。服务面向年满 18
          周岁的个人用户，目前不提供企业账户或商业用途。
        </p>
      </section>

      <section>
        <h2>2. 我们处理的数据</h2>
        <p className="mt-3">根据你实际使用的功能，可能包括：</p>
        <ul className="mt-3">
          <li>
            <strong>账号数据：</strong>邮箱地址、认证状态、显示名称与时区。
          </li>
          <li>
            <strong>计划数据：</strong>
            日期范围、任务、课程、实习与其他由你创建的安排。
          </li>
          <li>
            <strong>自愿记录：</strong>
            体重、睡眠、步数、饮水、训练、情绪、疼痛及备注等。大多数指标可以跳过。
          </li>
          <li>
            <strong>学习数据：</strong>IELTS 学习时长和成绩、GRE
            项目研究与决策记录。
          </li>
          <li>
            <strong>必要的技术数据：</strong>
            安全日志、错误信息和限制滥用所需的请求信息。我们不应在日志中记录健康数值、备注、密码或访问令牌。
          </li>
        </ul>
      </section>

      <section>
        <h2>3. 使用目的与存储位置</h2>
        <p className="mt-3">
          数据用于提供登录、生成日程、保存打卡、展示个人趋势、导出和账号安全功能。线上记录存储在
          Supabase 托管的数据库中，应用通过 Vercel 提供；认证邮件可能经 Brevo
          发送，防滥用验证可能由 Cloudflare Turnstile 处理。
        </p>
        <p className="mt-3">
          打卡草稿可能保存在当前浏览器的本地存储中，默认不会提交到服务器；提交成功、退出账号或删除账号后应清理相关草稿。请不要在共用设备上留下敏感草稿。
        </p>
      </section>

      <section>
        <h2>4. 隔离、安全与共享</h2>
        <p className="mt-3">
          用户数据通过数据库行级权限和带所有权的关系约束进行隔离。服务密钥仅应在服务器环境处理受限管理操作，不会发送到浏览器。我们不会出售你的个人数据，也不会将健康记录用于广告画像。
        </p>
        <p className="mt-3">
          免费托管服务不提供可承诺的可用性、备份或恢复时限。虽然项目会采取合理的安全措施，但任何联网系统都无法保证绝对安全，建议定期导出重要记录。
        </p>
      </section>

      <section>
        <h2>5. 导出、删除与保留</h2>
        <p className="mt-3">
          你可以在设置中导出自己的数据，或在完成近期身份验证后删除账号。主动数据会从线上数据库和认证系统中删除；托管服务商的轮转备份可能在其有限保留期内继续存在，之后自然过期。
        </p>
      </section>

      <section>
        <h2>6. 健康信息说明</h2>
        <p className="mt-3">
          Summer OS
          是一般健康与学习记录工具，不是医疗服务。趋势和提醒不构成诊断、治疗或个性化医疗建议。如出现昏厥、严重疼痛或其他紧急情况，请立即联系当地急救服务或合格专业人士。
        </p>
      </section>

      <section>
        <h2>7. 变更与联系</h2>
        <p className="mt-3">
          测试期间本说明可能随功能或服务商变化而更新，重要变化会在应用内说明。隐私问题可通过项目仓库列出的维护者联络方式提出；公开反馈中请勿附上密码、令牌或健康记录。
        </p>
      </section>
    </PublicDocument>
  );
}
