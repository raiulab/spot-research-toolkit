import { createResearchJob } from "@/app/lib/research";
import { ensureReady, nextRunAt } from "@/app/lib/store";

export async function POST() {
  const database = await ensureReady();
  const due = await database
    .prepare(
      "SELECT * FROM research_schedules WHERE enabled = 1 AND next_run_at <= ? ORDER BY next_run_at ASC LIMIT 10",
    )
    .bind(new Date().toISOString())
    .all<{
      id: string;
      region: string;
      categories_json: string;
      target_count: number;
      cadence: "weekly" | "monthly";
      weekday: number | null;
      day_of_month: number | null;
      time_jst: string;
    }>();
  const jobs: Array<{ scheduleId: string; jobId: string; status: string }> = [];
  for (const schedule of due.results) {
    const job = await createResearchJob({
      region: schedule.region,
      categories: JSON.parse(schedule.categories_json) as string[],
      targetCount: schedule.target_count,
    });
    const next = nextRunAt({
      cadence: schedule.cadence,
      weekday: schedule.weekday,
      dayOfMonth: schedule.day_of_month,
      timeJst: schedule.time_jst,
      from: new Date(),
    });
    await database
      .prepare(
        "UPDATE research_schedules SET last_run_at = CURRENT_TIMESTAMP, next_run_at = ? WHERE id = ?",
      )
      .bind(next, schedule.id)
      .run();
    jobs.push({ scheduleId: schedule.id, jobId: job.id, status: job.status });
  }
  return Response.json({ processed: jobs.length, jobs });
}
