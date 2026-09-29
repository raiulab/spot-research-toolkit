import {
  approvalProblems,
  ensureReady,
  type ResearchRecord,
} from "@/app/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const database = await ensureReady();
  const { id } = await context.params;
  const row = await database
    .prepare("SELECT payload_json FROM candidates WHERE id = ?")
    .bind(id)
    .first<{ payload_json: string }>();
  if (!row) return Response.json({ error: "候補が見つかりません。" }, { status: 404 });
  const record = JSON.parse(row.payload_json) as ResearchRecord;
  const problems = approvalProblems(record);
  if (problems.length) {
    return Response.json(
      { error: "承認条件を満たしていません。", problems },
      { status: 409 },
    );
  }
  record.workflow_status = "verified";
  record.verification = {
    ...record.verification,
    confidence: "high",
    issues: [],
  };
  const research =
    typeof record.research === "object" && record.research
      ? (record.research as Record<string, unknown>)
      : {};
  research.verified_at = new Date().toISOString().slice(0, 10);
  record.research = research;
  await database
    .prepare(`UPDATE candidates SET
      workflow_status = 'verified',
      confidence = 'high',
      issue_count = 0,
      payload_json = ?,
      approved_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
    .bind(JSON.stringify(record), id)
    .run();
  return Response.json({ ok: true });
}
