import type { Metadata } from "next";
import { PublicDocument } from "@/components/public-document";

export const metadata: Metadata = {
  title: "健康与安全提示 · Summer OS",
  description: "了解 Summer OS 的一般健康边界、提醒规则与紧急情况建议。",
};

export default function HealthPage() {
  return (
    <PublicDocument
      eyebrow="Health & Safety"
      title="健康与安全提示"
      intro="Summer OS 帮你观察习惯和趋势，但不诊断、不治疗，也不会为你开出饮食或训练处方。"
      updated="2026 年 7 月 11 日"
    >
      <section>
        <h2>1. 不是医疗服务</h2>
        <p className="mt-3">
          本应用提供一般生活记录、计划与描述性趋势，不能代替医生、注册营养师、心理健康专业人员或其他合格专业人士。任何提醒都只是建议你降低风险并寻求合适支持。
        </p>
      </section>
      <section>
        <h2>2. 体重愿景与安全展示</h2>
        <p className="mt-3">
          75 kg 可以作为个人愿景，但 83 kg 到 75 kg 在 50 天内所需速度超过每周约
          1%
          的一般提示线。应用不会因此生成极端热量限制、脱水、补剂或惩罚性运动指令。
        </p>
        <p className="mt-3">
          体重预测至少需要跨 14 天的 7
          次有效记录，并把展示速度限制在当前趋势体重的每周
          1%。趋势平稳、上升或样本不足时不显示到达日期。
        </p>
      </section>
      <section>
        <h2>3. 何时暂停并求助</h2>
        <ul className="mt-3">
          <li>
            眩晕、晕厥、胸痛、呼吸困难、意识改变或其他紧急症状：停止活动并联系当地急救服务。
          </li>
          <li>
            明显或持续疼痛、连续低睡眠、反复担心摄入过少或连续高强度训练：降低负荷并考虑尽快咨询合格专业人士。
          </li>
          <li>
            如果记录或体重目标加重进食障碍、焦虑或强迫行为，请停止相关功能并寻求专业支持。
          </li>
        </ul>
      </section>
      <section>
        <h2>4. 记录方式</h2>
        <p className="mt-3">
          大多数健康指标可以明确跳过。缺失值不会被当作零，也不会自动推断为不健康行为。相关性只描述共同变化，不代表因果。
        </p>
      </section>
      <section>
        <h2>5. 18 岁以上</h2>
        <p className="mt-3">
          本公开测试版仅面向年满 18
          周岁的成人。未成年人不应注册或使用健康记录功能。
        </p>
      </section>
    </PublicDocument>
  );
}
