import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  AnalyticsCharts,
  StudyBarChart,
} from "@/components/charts/analytics-charts";
import { TrendChart } from "@/components/trend-chart";
import { expectNoA11yViolations } from "@/tests/helpers/accessibility";

vi.mock("recharts", () => {
  const Chart = ({ children }: { children?: ReactNode }) => (
    <div data-testid="chart-library">{children}</div>
  );
  const Empty = () => null;
  return {
    Area: Empty,
    AreaChart: Chart,
    Bar: Empty,
    BarChart: Chart,
    CartesianGrid: Empty,
    ResponsiveContainer: Chart,
    Tooltip: Empty,
    XAxis: Empty,
    YAxis: Empty,
  };
});

describe("accessible analytics charts", () => {
  it("renders an explicit empty state instead of an unlabeled chart", () => {
    render(<TrendChart data={[]} title="体重" unit=" kg" />);

    expect(screen.getByText("暂无足够数据生成趋势图")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("provides a text summary and an expandable data table for a trend", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TrendChart
        title="体重"
        unit=" kg"
        data={[
          { label: "7月13日", value: 83 },
          { label: "7月20日", value: 82.4 },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", { name: "体重：从 83 kg 变化到 82.4 kg。" }),
    ).toBeVisible();
    expect(screen.getByText("体重：从 83 kg 变化到 82.4 kg。")).toHaveClass(
      "sr-only",
    );

    await user.click(screen.getByText("查看图表数据"));
    const figure = screen.getByRole("figure", { name: "体重" });
    expect(within(figure).getByText("7月13日")).toBeVisible();
    expect(within(figure).getByText("82.4 kg")).toBeVisible();
    await expectNoA11yViolations(container);
  });

  it("uses the supplied non-causal summary when provided", () => {
    render(
      <TrendChart
        title="睡眠与精力"
        description="睡眠与精力的关系仅为描述性观察，不表示因果。"
        data={[{ label: "本周", value: 3.5 }]}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "睡眠与精力的关系仅为描述性观察，不表示因果。",
      }),
    ).toBeVisible();
  });

  it("labels the study chart and exposes every value as text", () => {
    render(
      <StudyBarChart
        data={[
          { label: "周一", minutes: 45 },
          { label: "周二", minutes: 30 },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "学习时长：周一 45 分钟；周二 30 分钟。",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("学习时长：周一 45 分钟；周二 30 分钟。"),
    ).toHaveClass("sr-only");
    expect(screen.getByText("45 分钟")).toBeInTheDocument();
    expect(screen.getByText("30 分钟")).toBeInTheDocument();
  });

  it("shows distinct empty states for both dashboard charts", () => {
    render(<AnalyticsCharts />);

    expect(screen.getByText("暂无足够数据生成趋势图")).toBeVisible();
    expect(screen.getByText("暂无学习记录")).toBeVisible();
  });
});
