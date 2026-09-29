import { ensureReady, id, nextRunAt } from "@/app/lib/store";

export async function GET() {
  const database = await ensureReady();
  const result = await database
    .prepare("SELECT * FROM research_schedules ORDER BY next_run_at ASC")
    .all();
  return Response.json({ schedules: result.results });
}

export async function POST(request: Request) {
  const database = await ensureReady();
  const body = (await request.json()) as {
    region?: string;
    categories?: string[];
    targetCount?: number;
    cadence?: "weekly" | "monthly";
    weekday?: number | null;
    dayOfMonth?: number | null;
    timeJst?: string;
  };
  if (
    !body.region?.trim() ||
    !body.categories?.length ||
    !["weekly", "monthly"].includes(body.cadence ?? "") ||
    !/^\d{2}:\d{2}$/.test(body.timeJst ?? "")
  ) {
    return Response.json({ error: "定期設定の入力を確認してください。" }, { status: 400 });
  }
  const scheduleId = id("schedule");
  const next = nextRunAt({
    cadence: body.cadence as "weekly" | "monthly",
    weekday: body.weekday,
    dayOfMonth: body.dayOfMonth,
    timeJst: body.timeJst as string,
  });
  await database
    .prepare(`INSERT INTO research_schedules (
      id, region, categories_json, target_count, cadence, weekday,
      day_of_month, time_jst, enabled, next_run_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`)
    .bind(
      scheduleId,
      body.region.trim(),
      JSON.stringify(body.categories),
      Math.max(1, Math.min(30, Number(body.targetCount ?? 10))),
      body.cadence,
      body.weekday ?? null,
      body.dayOfMonth ?? null,
      body.timeJst,
      next,
    )
    .run();
  return Response.json({ id: scheduleId, nextRunAt: next }, { status: 201 });
}
