import { createResearchJob } from "@/app/lib/research";
import { ensureReady } from "@/app/lib/store";

export async function GET() {
  const database = await ensureReady();
  const result = await database
    .prepare("SELECT * FROM research_jobs ORDER BY created_at DESC LIMIT 30")
    .all();
  return Response.json({ jobs: result.results });
}

export async function POST(request: Request) {
  await ensureReady();
  const body = (await request.json()) as {
    region?: string;
    categories?: string[];
    targetCount?: number;
  };
  const region = body.region?.trim();
  const categories = (body.categories ?? []).filter(Boolean);
  const targetCount = Math.max(1, Math.min(30, Number(body.targetCount ?? 10)));
  if (!region || categories.length === 0) {
    return Response.json(
      { error: "地域とカテゴリーを指定してください。" },
      { status: 400 },
    );
  }
  const job = await createResearchJob({ region, categories, targetCount });
  return Response.json({ job }, { status: 201 });
}
