import { CalendarRange } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getPlanEditorData } from "@/lib/data/sections";
import { PlanEditor } from "./_components/plan-editor";

export const metadata = { title: "计划编辑" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const data = await getPlanEditorData(date);
  return (
    <div className="grid gap-5">
      <header className="hero-panel">
        <div>
          <p className="section-eyebrow">PLAN LAB</p>
          <h1 className="page-title">计划编辑器</h1>
          <p className="page-description">
            调整现实，而不是抹掉历史。所有危险操作都要求明确确认。
          </p>
        </div>
        <CalendarRange className="size-8 text-primary" />
      </header>
      {data.selected ? (
        <PlanEditor
          days={data.days}
          selected={data.selected}
          tasks={data.tasks}
          commitments={data.commitments}
        />
      ) : (
        <EmptyState
          title="还没有计划"
          description="先完成引导并选择一个模板。"
        />
      )}
    </div>
  );
}
