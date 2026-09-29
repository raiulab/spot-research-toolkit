import { syncResearchJob } from "@/app/lib/research";
import { ensureReady } from "@/app/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureReady();
  const { id } = await context.params;
  try {
    return Response.json(await syncResearchJob(id));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "同期に失敗しました。" },
      { status: 500 },
    );
  }
}
