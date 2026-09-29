import { env } from "cloudflare:workers";
import seedRecords from "@/data/seed-records.json";

export type ResearchRecord = Record<string, unknown> & {
  id: string;
  workflow_status: string;
  name: { ja: string; en: string | null };
  spot_kind: string;
  verification: { confidence: string; issues: string[] };
  sources: Array<{ trust_level?: string }>;
  app_profile?: { region?: string; main_category?: string };
};

export type CandidateRow = {
  id: string;
  job_id: string | null;
  record_id: string;
  name_ja: string;
  name_en: string | null;
  spot_kind: string;
  workflow_status: string;
  confidence: string;
  primary_source_count: number;
  issue_count: number;
  payload_json: string;
  review_notes: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
};

type RuntimeEnv = {
  DB?: D1Database;
  OPENAI_API_KEY?: string;
};

export function runtimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

export function db(): D1Database {
  const value = runtimeEnv().DB;
  if (!value) {
    throw new Error("D1 binding DB is not available.");
  }
  return value;
}

export function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function migrateSpotRecord(record: ResearchRecord): ResearchRecord {
  if (record.schema_version === "1.2.0" || record.record_type !== "spot") {
    return record;
  }
  const location = (record.location ?? {}) as Record<string, unknown>;
  const address = (location.address ?? {}) as Record<string, unknown>;
  const maps = (record.google_maps ?? {}) as Record<string, unknown>;
  const query = `${record.name.ja}, ${
    typeof address.ja === "string" ? address.ja : ""
  }`;
  const searchUrl = `https://www.google.com/maps/search/?${new URLSearchParams({
    api: "1",
    query,
  }).toString()}`;
  return {
    ...record,
    schema_version: "1.2.0",
    google_maps: {
      url: typeof maps.url === "string" ? maps.url : null,
      place_id: typeof maps.place_id === "string" ? maps.place_id : null,
      search_url: searchUrl,
      link_status:
        typeof maps.url === "string" ? "entity-confirmed" : "search-only",
    },
    review_insights: {
      status: "not-collected",
      observed_at: null,
      source_types: ["google-maps"],
      source_urls: [searchUrl],
      sampled_review_count: null,
      summary: null,
      positive_themes: [],
      caution_themes: [],
      methodology: {
        ja: "Google Maps等の口コミは候補発見と訪問上の傾向把握にのみ使う。本文・投稿者名は保存せず、確認日付きの反復傾向を要約する。",
        en: "Use reviews such as Google Maps only for discovery and visitor-pattern signals. Do not retain review text or author names; summarize recurring themes with an observation date.",
      },
      caveats: [
        {
          ja: "口コミ傾向は未収集。評価値や口コミ件数を現在の事実として扱わない。",
          en: "Review themes have not yet been collected. Do not treat ratings or review counts as current facts.",
        },
      ],
    },
  };
}

export async function ensureReady(): Promise<D1Database> {
  const database = db();
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS research_jobs (
      id TEXT PRIMARY KEY NOT NULL,
      region TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      target_count INTEGER NOT NULL,
      model TEXT NOT NULL DEFAULT 'gpt-5.6-sol',
      reasoning_effort TEXT NOT NULL DEFAULT 'high',
      status TEXT NOT NULL DEFAULT 'queued',
      provider_response_id TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      completed_at TEXT
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY NOT NULL,
      job_id TEXT,
      record_id TEXT NOT NULL UNIQUE,
      name_ja TEXT NOT NULL,
      name_en TEXT,
      spot_kind TEXT NOT NULL,
      workflow_status TEXT NOT NULL DEFAULT 'draft',
      confidence TEXT NOT NULL DEFAULT 'medium',
      primary_source_count INTEGER NOT NULL DEFAULT 0,
      issue_count INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL,
      review_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      approved_at TEXT
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS research_schedules (
      id TEXT PRIMARY KEY NOT NULL,
      region TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      target_count INTEGER NOT NULL,
      cadence TEXT NOT NULL,
      weekday INTEGER,
      day_of_month INTEGER,
      time_jst TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      next_run_at TEXT NOT NULL,
      last_run_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS export_runs (
      id TEXT PRIMARY KEY NOT NULL,
      format TEXT NOT NULL,
      region TEXT,
      main_category TEXT,
      record_count INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);

  const count = await database
    .prepare("SELECT COUNT(*) AS count FROM candidates")
    .first<{ count: number }>();
  if ((count?.count ?? 0) === 0) {
    const statements = (seedRecords as ResearchRecord[]).map((record) => {
      const sources = Array.isArray(record.sources) ? record.sources : [];
      const issues = record.verification?.issues ?? [];
      return database
        .prepare(`INSERT OR IGNORE INTO candidates (
          id, job_id, record_id, name_ja, name_en, spot_kind,
          workflow_status, confidence, primary_source_count, issue_count,
          payload_json, review_notes, approved_at
        ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?)`)
        .bind(
          id("candidate"),
          record.id,
          record.name.ja,
          record.name.en,
          record.spot_kind,
          record.workflow_status,
          record.verification?.confidence ?? "medium",
          sources.filter((source) => source.trust_level === "primary").length,
          issues.length,
          JSON.stringify(record),
          record.workflow_status === "verified"
            ? new Date().toISOString()
            : null,
        );
    });
    for (let index = 0; index < statements.length; index += 20) {
      await database.batch(statements.slice(index, index + 20));
    }
  }
  const legacy = await database
    .prepare(
      `SELECT id, payload_json FROM candidates
       WHERE json_extract(payload_json, '$.record_type') = 'spot'
       AND COALESCE(json_extract(payload_json, '$.schema_version'), '') != '1.2.0'`,
    )
    .all<{ id: string; payload_json: string }>();
  const migrations = legacy.results.map((row) =>
    database
      .prepare(
        "UPDATE candidates SET payload_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(
        JSON.stringify(
          migrateSpotRecord(JSON.parse(row.payload_json) as ResearchRecord),
        ),
        row.id,
      ),
  );
  for (let index = 0; index < migrations.length; index += 20) {
    await database.batch(migrations.slice(index, index + 20));
  }
  return database;
}

export function parseRecord(row: CandidateRow): ResearchRecord {
  return JSON.parse(row.payload_json) as ResearchRecord;
}

export function approvalProblems(record: ResearchRecord): string[] {
  const problems: string[] = [];
  const primarySources = (record.sources ?? []).filter(
    (source) => source.trust_level === "primary",
  );
  const fieldSources =
    typeof record.field_sources === "object" && record.field_sources
      ? (record.field_sources as Record<string, unknown>)
      : {};
  if (primarySources.length === 0) problems.push("一次情報がありません");
  if (!fieldSources["name.ja"]) problems.push("名称の証拠参照がありません");
  if (!fieldSources["location.address.ja"])
    problems.push("住所の証拠参照がありません");
  if (!fieldSources["practical.opening_hours"])
    problems.push("営業時間の証拠参照がありません");
  const location =
    typeof record.location === "object" && record.location
      ? (record.location as Record<string, unknown>)
      : {};
  const prefecture =
    typeof location.prefecture === "object" && location.prefecture
      ? (location.prefecture as Record<string, unknown>)
      : {};
  if (
    typeof prefecture.ja !== "string" ||
    prefecture.ja.trim().length === 0
  ) {
    problems.push("都道府県が未確定です");
  }
  const hours = record.practical as
    | { opening_hours?: { weekly?: unknown } }
    | undefined;
  if (hours?.opening_hours?.weekly == null)
    problems.push("曜日別営業時間が未確定です");
  if ((record.verification?.issues ?? []).length > 0)
    problems.push("未解決の確認事項があります");
  return problems;
}

export function nextRunAt(input: {
  cadence: "weekly" | "monthly";
  weekday?: number | null;
  dayOfMonth?: number | null;
  timeJst: string;
  from?: Date;
}): string {
  const from = input.from ?? new Date();
  const jst = new Date(from.getTime() + 9 * 60 * 60 * 1000);
  const [hour, minute] = input.timeJst.split(":").map(Number);
  const candidate = new Date(
    Date.UTC(
      jst.getUTCFullYear(),
      jst.getUTCMonth(),
      jst.getUTCDate(),
      hour - 9,
      minute,
    ),
  );

  if (input.cadence === "weekly") {
    const target = Math.max(0, Math.min(6, input.weekday ?? 1));
    let offset = (target - jst.getUTCDay() + 7) % 7;
    if (offset === 0 && candidate <= from) offset = 7;
    candidate.setUTCDate(candidate.getUTCDate() + offset);
  } else {
    const day = Math.max(1, Math.min(28, input.dayOfMonth ?? 1));
    candidate.setUTCDate(day);
    if (candidate <= from) candidate.setUTCMonth(candidate.getUTCMonth() + 1);
  }
  return candidate.toISOString();
}
