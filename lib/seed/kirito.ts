import type { DayCategory, PlanIntensity, TaskCategory } from "@/types/domain";

import { dayOfWeek, differenceInCalendarDays, eachDateInclusive } from "./date";
import { deterministicHash } from "./hash";
import type { GeneratedPlan, SeedCommitment, SeedDay, SeedTask } from "./types";

export const KIRITO_TEMPLATE_KEY = "kirito-summer-2026@1";
export const KIRITO_TEMPLATE_VERSION = 1;
export const KIRITO_START_DATE = "2026-07-13";
export const KIRITO_END_DATE = "2026-08-31";
export const KIRITO_TIMEZONE = "Asia/Shanghai";

const IELTS_WEEK_FOCUS = [
  "诊断与重新校准",
  "听读准确率与写作结构",
  "写作反馈循环与口语输出",
  "混合限时训练与错题归因",
  "全职实习下的短时弱项训练",
  "考试准备与完整模拟",
  "错题回顾、睡眠和状态收束",
] as const;

function task(
  date: string,
  key: string,
  title: string,
  category: TaskCategory,
  estimatedMinutes: number,
  options: Partial<
    Pick<
      SeedTask,
      | "description"
      | "plannedStart"
      | "plannedEnd"
      | "required"
      | "minimumDayEligible"
    >
  > = {},
): SeedTask {
  return {
    seedKey: `${date}:${key}`,
    title,
    category,
    estimatedMinutes,
    required: options.required ?? true,
    minimumDayEligible: options.minimumDayEligible ?? false,
    sortOrder: 0,
    ...options,
  };
}

function commitment(
  date: string,
  key: string,
  title: string,
  kind: SeedCommitment["kind"],
  startTime: string | null,
  endTime: string | null,
  isAllDay = false,
): SeedCommitment {
  return {
    seedKey: `${date}:${key}`,
    title,
    kind,
    startTime,
    endTime,
    isAllDay,
  };
}

function categoryFor(date: string): DayCategory {
  if (date === "2026-07-13") return "BASELINE";
  if (date === "2026-08-29") return "EXAM_DAY";
  if (date === "2026-08-31") return "FINAL_REVIEW";
  if (date >= "2026-08-24") return "IELTS_TAPER";

  const weekday = dayOfWeek(date);
  if (date < "2026-08-08") {
    if ([1, 3, 4].includes(weekday)) return "INTERNSHIP_PART_TIME";
    if ([2, 5].includes(weekday)) return "COURSE_DAY";
  } else if (weekday >= 1 && weekday <= 5) {
    return "INTERNSHIP_FULL_TIME";
  }
  return weekday === 6 ? "WEEKEND_INTENSIVE" : "WEEKEND_RECOVERY";
}

function intensityFor(category: DayCategory): PlanIntensity {
  if (category === "WEEKEND_INTENSIVE") return "HIGH";
  if (
    category === "WEEKEND_RECOVERY" ||
    category === "IELTS_TAPER" ||
    category === "EXAM_DAY" ||
    category === "FINAL_REVIEW"
  ) {
    return "LOW";
  }
  return "MODERATE";
}

function commitmentsFor(date: string): SeedCommitment[] {
  const weekday = dayOfWeek(date);
  const result: SeedCommitment[] = [];

  if (
    (date < "2026-08-08" && [1, 3, 4].includes(weekday)) ||
    (date >= "2026-08-08" && weekday >= 1 && weekday <= 5)
  ) {
    result.push(
      commitment(date, "internship", "实习", "INTERNSHIP", "09:00", "17:30"),
    );
  }

  if (date > "2026-07-13" && date < "2026-08-08" && [2, 5].includes(weekday)) {
    result.push(
      commitment(date, "summer-course", "暑期课程", "COURSE", "09:00", "11:30"),
    );
  }

  if (date === "2026-08-29") {
    result.push(
      commitment(
        date,
        "ielts-exam-placeholder",
        "IELTS 考试（待确认）",
        "EXAM",
        null,
        null,
        true,
      ),
    );
  }
  return result;
}

function workoutTask(date: string, category: DayCategory): SeedTask {
  const weekday = dayOfWeek(date);

  if (category === "EXAM_DAY") {
    return task(date, "movement", "轻松步行或完全休息", "RECOVERY", 20, {
      required: false,
      minimumDayEligible: true,
    });
  }
  if (category === "IELTS_TAPER" || category === "FINAL_REVIEW") {
    const title =
      weekday === 2 || weekday === 4
        ? "轻量全身力量或灵活性训练"
        : "恢复步行与拉伸";
    return task(
      date,
      "movement",
      title,
      weekday === 2 || weekday === 4 ? "FITNESS" : "RECOVERY",
      25,
      {
        required: false,
        minimumDayEligible: true,
      },
    );
  }

  const workouts: Record<number, [string, number, TaskCategory]> = {
    0: ["恢复步行与关节活动", 30, "RECOVERY"],
    1: ["力量训练 A：下肢推、水平推拉与核心", 40, "FITNESS"],
    2: ["Zone 2 有氧或快走", 35, "FITNESS"],
    3: ["力量训练 B：髋主导、上举、下拉与核心", 40, "FITNESS"],
    4: ["轻松步行与灵活性训练", 30, "RECOVERY"],
    5: ["力量训练 C：轻量全身训练", 35, "FITNESS"],
    6: ["较长有氧或户外活动", 50, "FITNESS"],
  };
  const [title, minutes, taskCategory] = workouts[weekday];
  return task(date, "movement", title, taskCategory, minutes, {
    required: weekday !== 0,
    minimumDayEligible: true,
  });
}

function ieltsTask(date: string, category: DayCategory): SeedTask {
  const week = Math.min(
    6,
    Math.floor(differenceInCalendarDays(date, KIRITO_START_DATE) / 7),
  );
  const focus = IELTS_WEEK_FOCUS[week];
  const weekday = dayOfWeek(date);
  let minutes = 35;
  let title = `${focus}：短时专注练习`;

  if (category === "WEEKEND_INTENSIVE") {
    minutes = week >= 5 ? 150 : 120;
    title = `${focus}：限时套题或模拟`;
  } else if (category === "WEEKEND_RECOVERY") {
    minutes = 25;
    title = `${focus}：轻量口语或词汇复盘`;
  } else if (category === "COURSE_DAY") {
    minutes = 75;
    title = `${focus}：课程后深度训练`;
  } else if (category === "INTERNSHIP_FULL_TIME") {
    minutes = 35;
    title = `${focus}：晚间弱项训练`;
  } else if (category === "IELTS_TAPER") {
    minutes = weekday === 1 ? 75 : 30;
    title =
      weekday === 1 ? "最后一次适量模拟与错题整理" : "针对性错题回顾（不过量）";
  } else if (category === "EXAM_DAY") {
    minutes = 10;
    title = "检查证件与考试安排，保持平稳节奏";
  } else if (category === "FINAL_REVIEW") {
    minutes = 20;
    title = "记录考试感受与下一步学习建议";
  }

  return task(date, "ielts", title, "IELTS", minutes, {
    plannedStart: category.includes("INTERNSHIP") ? "19:30" : undefined,
    required: category !== "EXAM_DAY",
    minimumDayEligible: true,
  });
}

function commonTasks(date: string, category: DayCategory): SeedTask[] {
  const result = [
    task(
      date,
      "morning-check-in",
      "晨间记录体重，或明确标记跳过",
      "PLANNING",
      3,
      {
        plannedStart: "06:45",
        minimumDayEligible: true,
      },
    ),
    task(
      date,
      "protein-dinner",
      "安排蛋白质充足、不过度限制的晚餐",
      "NUTRITION",
      20,
      {
        plannedStart: "18:30",
        minimumDayEligible: true,
      },
    ),
    workoutTask(date, category),
    ieltsTask(date, category),
    task(date, "plan-tomorrow", "快速记录并准备明天", "PLANNING", 10, {
      plannedStart: "21:30",
      minimumDayEligible: true,
    }),
    task(date, "wind-down", "按时放松，目标 23:30 前入睡", "RECOVERY", 15, {
      plannedStart: "23:15",
      minimumDayEligible: true,
    }),
  ];

  const fixed = commitmentsFor(date)[0];
  if (fixed?.kind === "INTERNSHIP") {
    result.splice(
      1,
      0,
      task(
        date,
        "attend-internship",
        "完成 09:00–17:30 实习",
        "INTERNSHIP",
        510,
        {
          plannedStart: "09:00",
          plannedEnd: "17:30",
        },
      ),
    );
  } else if (fixed?.kind === "COURSE") {
    result.splice(
      1,
      0,
      task(date, "attend-course", "完成 09:00–11:30 暑期课程", "COURSE", 150, {
        plannedStart: "09:00",
        plannedEnd: "11:30",
      }),
    );
  }
  return result;
}

function specialTasks(date: string): SeedTask[] {
  switch (date) {
    case "2026-07-13":
      return [
        task(
          date,
          "baseline-measurements",
          "完成基线体重与腰围测量",
          "PLANNING",
          10,
        ),
        task(
          date,
          "pantry-setup",
          "整理食材并准备可持续的餐食方案",
          "NUTRITION",
          45,
        ),
        task(
          date,
          "ielts-diagnostic",
          "完成听读限时诊断、写作样本和两段口语录音",
          "IELTS",
          150,
        ),
        task(
          date,
          "configure-os",
          "确认目标、时区与每日追踪偏好",
          "PLANNING",
          15,
        ),
      ];
    case "2026-07-19":
      return [
        task(date, "first-weekly-review", "完成第一次周复盘", "PLANNING", 30),
      ];
    case "2026-08-07":
      return [
        task(
          date,
          "course-closeout",
          "整理暑期课程资料与后续行动",
          "COURSE",
          30,
        ),
      ];
    case "2026-08-08":
      return [
        task(
          date,
          "full-time-transition",
          "为全职实习阶段调整晚间计划",
          "PLANNING",
          25,
        ),
      ];
    case "2026-08-23":
      return [
        task(
          date,
          "exam-readiness-review",
          "完成考试准备度与物流清单复核",
          "IELTS",
          40,
        ),
      ];
    case "2026-08-29":
      return [
        task(
          date,
          "post-exam-notes",
          "考试后简短记录感受，不立即过度复盘",
          "IELTS",
          15,
          { required: false },
        ),
      ];
    case "2026-08-30":
      return [
        task(
          date,
          "gre-final-decision",
          "基于学校官网证据写下 GRE 最终决定",
          "GRE",
          45,
        ),
      ];
    case "2026-08-31":
      return [
        task(
          date,
          "final-measurements",
          "完成期末体重与腰围测量或标记跳过",
          "PLANNING",
          10,
        ),
        task(
          date,
          "summer-retrospective",
          "完成夏季复盘并选择可持续的下一步",
          "PLANNING",
          45,
        ),
      ];
    default:
      if (dayOfWeek(date) === 0) {
        return [
          task(date, "weekly-review", "完成周复盘与下周安排", "PLANNING", 25),
          task(
            date,
            "gre-research",
            "核对一所目标项目的 GRE 官方要求",
            "GRE",
            30,
            {
              required: false,
            },
          ),
        ];
      }
      if (dayOfWeek(date) === 6) {
        return [
          task(
            date,
            "ielts-error-review",
            "整理本次练习的错题与下一行动",
            "IELTS",
            30,
          ),
        ];
      }
      return [];
  }
}

function titleFor(date: string, category: DayCategory): [string, string] {
  const labels: Record<DayCategory, [string, string]> = {
    BASELINE: [
      "基线与系统启动",
      "建立真实基线，同时完成实习承诺；不追求第一天完美。",
    ],
    INTERNSHIP_PART_TIME: [
      "兼职实习日",
      "优先完成实习，在晚间安排短而明确的学习和活动。",
    ],
    COURSE_DAY: ["暑期课程日", "完成课程后利用下午进行较深的 IELTS 训练。"],
    WEEKEND_INTENSIVE: [
      "周末强化日",
      "安排较长训练与限时练习，并保留恢复空间。",
    ],
    WEEKEND_RECOVERY: ["周末恢复日", "恢复、备餐、周复盘和轻量研究。"],
    INTERNSHIP_FULL_TIME: [
      "全职实习日",
      "保护工作表现和睡眠，采用短时高质量练习。",
    ],
    IELTS_TAPER: ["IELTS 收束日", "减少额外疲劳，专注错题、物流和睡眠。"],
    EXAM_DAY: [
      "IELTS 考试占位日",
      "考试日期待确认；以稳定状态和基本后勤为主。",
    ],
    FINAL_REVIEW: [
      "夏季最终复盘",
      "完成实习承诺后，记录测量与可持续的下一步。",
    ],
    FLEX_DAY: ["灵活计划日", "围绕当日承诺选择最小而有效的行动。"],
  };
  const [title, summary] = labels[category];
  return [`${title} · ${date}`, summary];
}

export function generateKiritoPlan(): GeneratedPlan {
  const days = eachDateInclusive(KIRITO_START_DATE, KIRITO_END_DATE).map(
    (date) => {
      const category = categoryFor(date);
      const [title, summary] = titleFor(date, category);
      const tasks = [...commonTasks(date, category), ...specialTasks(date)].map(
        (item, index) => ({ ...item, sortOrder: (index + 1) * 10 }),
      );
      return {
        date,
        category,
        intensity: intensityFor(category),
        title,
        summary,
        commitments: commitmentsFor(date),
        tasks,
      } satisfies SeedDay;
    },
  );

  const payload = {
    templateKey: KIRITO_TEMPLATE_KEY,
    templateVersion: KIRITO_TEMPLATE_VERSION,
    timezone: KIRITO_TIMEZONE,
    startDate: KIRITO_START_DATE,
    endDate: KIRITO_END_DATE,
    days,
  };
  return { ...payload, payloadHash: deterministicHash(payload) };
}
