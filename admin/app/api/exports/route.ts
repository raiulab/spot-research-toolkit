import { toCompactRecord } from "@/app/lib/compact-export";
import {
  ensureReady,
  id,
  parseRecord,
  type CandidateRow,
} from "@/app/lib/store";

export async function POST(request: Request) {
  const database = await ensureReady();
  const body = (await request.json()) as {
    format?: "canonical" | "compact";
    includeDrafts?: boolean;
    region?: string;
    mainCategory?: string;
  };
  const format = body.format === "compact" ? "compact" : "canonical";
  const clauses = body.includeDrafts
    ? ["workflow_status IN ('draft', 'verified')"]
    : ["workflow_status = 'verified'"];
  const bindings: string[] = [];
  const result = await database
    .prepare(
      `SELECT * FROM candidates WHERE ${clauses.join(" AND ")} ORDER BY name_ja`,
    )
    .bind(...bindings)
    .all<CandidateRow>();
  let records = result.results.map(parseRecord);
  if (body.region) {
    records = records.filter(
      (record) => record.app_profile?.region === body.region,
    );
  }
  if (body.mainCategory) {
    records = records.filter(
      (record) => record.app_profile?.main_category === body.mainCategory,
    );
  }
  const generatedAt = new Date().toISOString();
  const output =
    format === "compact"
      ? {
          schema_version: "compact-1.0",
          generated_at: generatedAt,
          region: body.region ?? null,
          main_category: body.mainCategory ?? null,
          venue_count: records.length,
          venues: records.map(toCompactRecord),
        }
      : {
          schema_version: "1.2.0",
          generated_at: generatedAt,
          record_count: records.length,
          spots: records,
          events: [],
        };
  await database
    .prepare(
      "INSERT INTO export_runs (id, format, region, main_category, record_count) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(
      id("export"),
      format,
      body.region ?? null,
      body.mainCategory ?? null,
      records.length,
    )
    .run();
  const filename = `spot-research-${format}-${generatedAt.slice(0, 10)}.json`;
  return new Response(JSON.stringify(output, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
