import { ensureReady } from "@/app/lib/store";

export async function GET() {
  const database = await ensureReady();
  const [totals, kinds, jobs, schedules] = await Promise.all([
    database.prepare(`SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN workflow_status = 'draft' THEN 1 ELSE 0 END) AS draft,
      SUM(CASE WHEN workflow_status = 'verified' THEN 1 ELSE 0 END) AS verified,
      SUM(CASE WHEN primary_source_count > 0 THEN 1 ELSE 0 END) AS primary_backed
      FROM candidates`).first(),
    database
      .prepare(
        "SELECT spot_kind, COUNT(*) AS count FROM candidates GROUP BY spot_kind ORDER BY count DESC",
      )
      .all(),
    database
      .prepare(
        "SELECT * FROM research_jobs ORDER BY created_at DESC LIMIT 6",
      )
      .all(),
    database
      .prepare(
        "SELECT * FROM research_schedules WHERE enabled = 1 ORDER BY next_run_at ASC LIMIT 6",
      )
      .all(),
  ]);
  return Response.json({
    totals,
    kinds: kinds.results,
    jobs: jobs.results,
    schedules: schedules.results,
  });
}
