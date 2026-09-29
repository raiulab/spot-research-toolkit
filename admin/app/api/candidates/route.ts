import { ensureReady } from "@/app/lib/store";

export async function GET(request: Request) {
  const database = await ensureReady();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const kind = url.searchParams.get("kind");
  const search = url.searchParams.get("q")?.trim();
  const conditions: string[] = [];
  const bindings: string[] = [];
  if (status && status !== "all") {
    conditions.push("workflow_status = ?");
    bindings.push(status);
  }
  if (kind && kind !== "all") {
    conditions.push("spot_kind = ?");
    bindings.push(kind);
  }
  if (search) {
    conditions.push("(name_ja LIKE ? OR name_en LIKE ? OR record_id LIKE ?)");
    bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await database
    .prepare(
      `SELECT * FROM candidates ${where}
       ORDER BY CASE workflow_status WHEN 'draft' THEN 0 ELSE 1 END,
       issue_count DESC, name_ja ASC`,
    )
    .bind(...bindings)
    .all();
  return Response.json({ candidates: result.results });
}
