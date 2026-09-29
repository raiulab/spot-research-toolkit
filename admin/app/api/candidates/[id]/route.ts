import {
  approvalProblems,
  ensureReady,
  type ResearchRecord,
} from "@/app/lib/store";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const database = await ensureReady();
  const { id } = await context.params;
  const body = (await request.json()) as {
    reviewNotes?: string;
    payloadJson?: string;
    workflowStatus?: "draft";
  };
  const row = await database
    .prepare("SELECT record_id, payload_json FROM candidates WHERE id = ?")
    .bind(id)
    .first<{ record_id: string; payload_json: string }>();
  if (!row) return Response.json({ error: "候補が見つかりません。" }, { status: 404 });

  let payloadJson = row.payload_json;
  let nameJa: string | null = null;
  let nameEn: string | null = null;
  let spotKind: string | null = null;
  let confidence: string | null = null;
  let primarySourceCount: number | null = null;
  let issueCount: number | null = null;

  if (body.payloadJson !== undefined) {
    let record: ResearchRecord;
    try {
      record = JSON.parse(body.payloadJson) as ResearchRecord;
    } catch {
      return Response.json({ error: "JSONの構文が正しくありません。" }, { status: 400 });
    }
    if (record.id !== row.record_id) {
      return Response.json(
        { error: "record idは候補作成後に変更できません。" },
        { status: 400 },
      );
    }
    record.workflow_status = "draft";
    payloadJson = JSON.stringify(record);
    nameJa = record.name?.ja ?? null;
    nameEn = record.name?.en ?? null;
    spotKind = record.spot_kind ?? null;
    confidence = record.verification?.confidence ?? "medium";
    primarySourceCount = (record.sources ?? []).filter(
      (source) => source.trust_level === "primary",
    ).length;
    issueCount = record.verification?.issues?.length ?? 0;
    if (!nameJa || !spotKind) {
      return Response.json(
        { error: "name.ja と spot_kind は必須です。" },
        { status: 400 },
      );
    }
  }

  await database
    .prepare(`UPDATE candidates SET
      review_notes = COALESCE(?, review_notes),
      payload_json = ?,
      workflow_status = COALESCE(?, workflow_status),
      name_ja = COALESCE(?, name_ja),
      name_en = COALESCE(?, name_en),
      spot_kind = COALESCE(?, spot_kind),
      confidence = COALESCE(?, confidence),
      primary_source_count = COALESCE(?, primary_source_count),
      issue_count = COALESCE(?, issue_count),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
    .bind(
      body.reviewNotes ?? null,
      payloadJson,
      body.workflowStatus ?? null,
      nameJa,
      nameEn,
      spotKind,
      confidence,
      primarySourceCount,
      issueCount,
      id,
    )
    .run();

  const record = JSON.parse(payloadJson) as ResearchRecord;
  return Response.json({ ok: true, approvalProblems: approvalProblems(record) });
}
