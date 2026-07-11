import type { DayCategory, TaskCategory } from "@/types/domain";

import {
  dayOfWeek,
  differenceInCalendarDays,
  eachDateInclusive,
  isValidTimezone,
} from "./date";
import { deterministicHash } from "./hash";
import type {
  FlexCommitmentRule,
  FlexPlanConfig,
  FlexSpecialEvent,
  GeneratedPlan,
  SeedDay,
  SeedTask,
} from "./types";

export const FLEX_TEMPLATE_KEY = "summer-os-flex@1";
export const FLEX_TEMPLATE_VERSION = 1;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateRule(rule: FlexCommitmentRule): void {
  if (!rule.id.trim() || !rule.title.trim())
    throw new RangeError("Commitment id and title are required");
  if (
    !rule.daysOfWeek.length ||
    rule.daysOfWeek.some((day) => day < 0 || day > 6 || !Number.isInteger(day))
  ) {
    throw new RangeError(
      "Commitment weekdays must use integer values from 0 to 6",
    );
  }
  if (
    !TIME.test(rule.startTime) ||
    !TIME.test(rule.endTime) ||
    rule.startTime >= rule.endTime
  ) {
    throw new RangeError("Commitment times must be valid and end after start");
  }
}

function rulesForDate(
  rules: FlexCommitmentRule[],
  date: string,
): FlexCommitmentRule[] {
  return rules.filter(
    (rule) =>
      rule.daysOfWeek.includes(dayOfWeek(date)) &&
      (!rule.startsOn || rule.startsOn <= date) &&
      (!rule.endsOn || rule.endsOn >= date),
  );
}

const EVENT_PRECEDENCE: Record<DayCategory, number> = {
  EXAM_DAY: 100,
  FINAL_REVIEW: 90,
  BASELINE: 80,
  IELTS_TAPER: 70,
  INTERNSHIP_FULL_TIME: 60,
  INTERNSHIP_PART_TIME: 55,
  COURSE_DAY: 50,
  WEEKEND_INTENSIVE: 40,
  WEEKEND_RECOVERY: 30,
  FLEX_DAY: 10,
};

function eventForDate(
  events: FlexSpecialEvent[],
  date: string,
): FlexSpecialEvent | undefined {
  return events
    .filter((event) => event.date === date)
    .sort(
      (left, right) =>
        EVENT_PRECEDENCE[right.category] - EVENT_PRECEDENCE[left.category],
    )[0];
}

function task(
  date: string,
  key: string,
  title: string,
  category: TaskCategory,
  minutes: number,
  required: boolean,
): SeedTask {
  return {
    seedKey: `${date}:${key}`,
    title,
    category,
    estimatedMinutes: minutes,
    required,
    minimumDayEligible: ["PLANNING", "NUTRITION", "FITNESS", "IELTS"].includes(
      category,
    ),
    sortOrder: 0,
  };
}

export function generateFlexPlan(config: FlexPlanConfig): GeneratedPlan {
  const length = differenceInCalendarDays(config.endDate, config.startDate) + 1;
  if (length < 7 || length > 120)
    throw new RangeError("Flexible plans must contain 7 to 120 days");
  if (!isValidTimezone(config.timezone))
    throw new RangeError("Invalid IANA timezone");

  const rules = config.commitments ?? [];
  const events = config.specialEvents ?? [];
  rules.forEach(validateRule);
  if (new Set(rules.map((rule) => rule.id)).size !== rules.length) {
    throw new RangeError("Commitment ids must be unique");
  }
  const eventIds = new Set(events.map((event) => event.id));
  if (eventIds.size !== events.length)
    throw new RangeError("Special event ids must be unique");
  if (
    events.some(
      (event) => event.date < config.startDate || event.date > config.endDate,
    )
  ) {
    throw new RangeError("Special events must be inside the plan range");
  }
  for (const event of events) {
    if (!event.id.trim() || !event.title.trim()) {
      throw new RangeError("Special event id and title are required");
    }
    const hasStart = Boolean(event.startTime);
    const hasEnd = Boolean(event.endTime);
    if (
      hasStart !== hasEnd ||
      (hasStart &&
        (!TIME.test(event.startTime!) ||
          !TIME.test(event.endTime!) ||
          event.startTime! >= event.endTime!))
    ) {
      throw new RangeError(
        "Timed special events require a valid start and later end time",
      );
    }
  }

  const days = eachDateInclusive(config.startDate, config.endDate).map(
    (date, index) => {
      const dayRules = rulesForDate(rules, date);
      const event = eventForDate(events, date);
      const hasInternship = dayRules.some((rule) => rule.kind === "INTERNSHIP");
      const hasCourse = dayRules.some((rule) => rule.kind === "COURSE");
      let category: DayCategory =
        index === 0
          ? "BASELINE"
          : index === length - 1
            ? "FINAL_REVIEW"
            : hasInternship
              ? "INTERNSHIP_FULL_TIME"
              : hasCourse
                ? "COURSE_DAY"
                : dayOfWeek(date) === 6
                  ? "WEEKEND_INTENSIVE"
                  : dayOfWeek(date) === 0
                    ? "WEEKEND_RECOVERY"
                    : "FLEX_DAY";
      if (
        event &&
        EVENT_PRECEDENCE[event.category] > EVENT_PRECEDENCE[category]
      ) {
        category = event.category;
      }

      const tasks: SeedTask[] = [
        task(
          date,
          "check-in",
          "完成简短晨间记录，或明确标记跳过",
          "PLANNING",
          3,
          true,
        ),
        ...dayRules.map((rule) =>
          task(
            date,
            `commitment:${rule.id}`,
            `完成：${rule.title}`,
            "FIXED_COMMITMENT",
            30,
            true,
          ),
        ),
      ];
      if (config.includeWellnessTasks !== false) {
        tasks.push(
          task(
            date,
            "movement",
            "根据精力选择步行、灵活性或适量训练",
            "FITNESS",
            30,
            false,
          ),
          task(
            date,
            "meal",
            "安排均衡且蛋白质充足的一餐",
            "NUTRITION",
            20,
            true,
          ),
          task(
            date,
            "wind-down",
            "为睡眠预留安静的收束时间",
            "RECOVERY",
            15,
            true,
          ),
        );
      }
      if (config.includeStudyTasks !== false) {
        tasks.push(
          task(date, "study", "完成一个明确的学习下一行动", "IELTS", 25, false),
        );
      }
      if (event) {
        tasks.push(
          task(date, `event:${event.id}`, event.title, "PERSONAL", 30, true),
        );
      }
      tasks.push(
        task(date, "tomorrow", "确认明天最重要的一件事", "PLANNING", 5, true),
      );

      return {
        date,
        category,
        intensity:
          category === "WEEKEND_INTENSIVE"
            ? "HIGH"
            : category === "WEEKEND_RECOVERY" || category === "EXAM_DAY"
              ? "LOW"
              : "MODERATE",
        title: event?.title ?? `夏日计划 · ${date}`,
        summary: event?.summary ?? "围绕固定承诺，选择小而可持续的行动。",
        commitments: [
          ...dayRules.map((rule) => ({
            seedKey: `${date}:rule:${rule.id}`,
            title: rule.title,
            kind: rule.kind,
            startTime: rule.startTime,
            endTime: rule.endTime,
            isAllDay: false,
          })),
          ...(event
            ? [
                {
                  seedKey: `${date}:event:${event.id}`,
                  title: event.title,
                  kind: "PERSONAL" as const,
                  startTime: event.startTime ?? null,
                  endTime: event.endTime ?? null,
                  isAllDay: event.isAllDay ?? !event.startTime,
                },
              ]
            : []),
        ],
        tasks: tasks.map((item, taskIndex) => ({
          ...item,
          sortOrder: (taskIndex + 1) * 10,
        })),
      } satisfies SeedDay;
    },
  );

  const payload = {
    templateKey: FLEX_TEMPLATE_KEY,
    templateVersion: FLEX_TEMPLATE_VERSION,
    timezone: config.timezone,
    startDate: config.startDate,
    endDate: config.endDate,
    days,
  };
  return { ...payload, payloadHash: deterministicHash(payload) };
}
