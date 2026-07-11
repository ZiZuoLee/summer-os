import { NextRequest, NextResponse } from "next/server";
import { createCsv, csvDownloadFilename } from "@/lib/export";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const userTables = [
  "profiles",
  "app_preferences",
  "plan_cycles",
  "recurring_commitments",
  "daily_plans",
  "daily_commitments",
  "plan_tasks",
  "daily_logs",
  "workout_sessions",
  "ielts_sessions",
  "ielts_errors",
  "gre_programs",
  "gre_decisions",
  "weekly_reviews",
  "health_alerts",
  "alert_acknowledgements",
] as const;

type ExportRow = Record<string, unknown>;

const demoLogs: ExportRow[] = [
  {
    log_date: "2026-07-13",
    weight_kg: 83,
    sleep_minutes: 450,
    steps: 8200,
    water_ml: 2400,
    protein_g: 125,
    mood: 7,
    energy: 6,
    notes: "演示数据",
  },
  {
    log_date: "2026-07-14",
    weight_kg: 82.8,
    sleep_minutes: 430,
    steps: 10100,
    water_ml: 2600,
    protein_g: 132,
    mood: 7,
    energy: 7,
    notes: "=此值会被安全转义",
  },
];

function noStoreHeaders(contentType: string, filename: string) {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(request: NextRequest) {
  const format =
    request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";
  const exportedAt = new Date().toISOString();
  const exportedOn = exportedAt.slice(0, 10);

  let datasets: Record<string, ExportRow[]>;
  if (!isSupabaseConfigured() || publicEnv.demoMode) {
    datasets = { daily_logs: demoLogs };
  } else {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user)
      return NextResponse.json(
        { error: "AUTH_REQUIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    const results = await Promise.all(
      userTables.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .limit(10000);
        if (error) throw new Error(`Export failed for ${table}`);
        return [table, (data ?? []) as ExportRow[]] as const;
      }),
    );
    datasets = Object.fromEntries(results);
  }

  if (format === "csv") {
    const rows = datasets.daily_logs ?? [];
    const csv = createCsv(rows, [
      { header: "日期", value: (row) => String(row.log_date ?? "") },
      { header: "体重_kg", value: (row) => row.weight_kg as number | null },
      { header: "腰围_cm", value: (row) => row.waist_cm as number | null },
      {
        header: "睡眠_分钟",
        value: (row) => row.sleep_minutes as number | null,
      },
      { header: "步数", value: (row) => row.steps as number | null },
      { header: "饮水_ml", value: (row) => row.water_ml as number | null },
      { header: "蛋白质_g", value: (row) => row.protein_g as number | null },
      { header: "心情", value: (row) => row.mood as number | null },
      { header: "精力", value: (row) => row.energy as number | null },
      { header: "备注", value: (row) => String(row.notes ?? "") },
    ]);
    return new NextResponse(csv, {
      headers: noStoreHeaders(
        "text/csv; charset=utf-8",
        csvDownloadFilename("daily-logs", exportedOn),
      ),
    });
  }

  const payload = JSON.stringify(
    {
      schemaVersion: "summer-os-export@1",
      exportedAt,
      infrastructure: "best-effort-public-beta",
      datasets,
    },
    null,
    2,
  );
  return new NextResponse(payload, {
    headers: noStoreHeaders(
      "application/json; charset=utf-8",
      `summer-os-export-${exportedOn}.json`,
    ),
  });
}
