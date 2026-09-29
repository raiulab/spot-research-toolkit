import type { ResearchRecord } from "./store";
import { db, id, runtimeEnv } from "./store";

type ResearchInput = {
  region: string;
  categories: string[];
  targetCount: number;
};

type ProviderCandidate = {
  slug: string;
  name_ja: string;
  name_en: string;
  spot_kind: "restaurant" | "cafe" | "bar" | "shop" | "gallery";
  venue_type:
    | "restaurant"
    | "cafe"
    | "bar"
    | "bakery"
    | "food-shop"
    | "retail"
    | "gallery"
    | "hybrid"
    | "other";
  address_ja: string;
  address_en: string;
  postal_code: string | null;
  official_url: string | null;
  google_maps_url: string | null;
  summary_ja: string;
  summary_en: string;
  why_ja: string;
  why_en: string;
  local_context_ja: string;
  local_context_en: string;
  hours_ja: string;
  hours_en: string;
  weekly: Record<
    string,
    Array<{ open: string; close: string }>
  > | null;
  closures_ja: string;
  closures_en: string;
  phone: string | null;
  last_order: string | null;
  service_modes: string[];
  reservation_policy: string;
  takeaway: boolean | null;
  review_observed_at: string | null;
  review_sampled_count: number | null;
  review_summary_ja: string | null;
  review_summary_en: string | null;
  review_positive_themes_ja: string[];
  review_positive_themes_en: string[];
  review_caution_themes_ja: string[];
  review_caution_themes_en: string[];
  review_source_urls: string[];
  issues: string[];
  sources: Array<{
    url: string;
    title: string;
    publisher: string;
    source_type:
      | "official"
      | "tourism"
      | "editorial"
      | "map"
      | "social"
      | "other";
    trust_level: "primary" | "secondary" | "discovery";
    supports: string[];
    evidence_note: string;
  }>;
};

const interval = {
  type: "object",
  additionalProperties: false,
  properties: {
    open: { type: "string", pattern: "^([01][0-9]|2[0-4]):[0-5][0-9]$" },
    close: { type: "string", pattern: "^([01][0-9]|2[0-4]):[0-5][0-9]$" },
  },
  required: ["open", "close"],
} as const;

const weeklyObject = {
  type: "object",
  additionalProperties: false,
  properties: Object.fromEntries(
    ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => [
      day,
      { type: "array", items: interval },
    ]),
  ),
  required: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
} as const;

const researchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string" },
          name_ja: { type: "string" },
          name_en: { type: "string" },
          spot_kind: {
            type: "string",
            enum: ["restaurant", "cafe", "bar", "shop", "gallery"],
          },
          venue_type: {
            type: "string",
            enum: [
              "restaurant",
              "cafe",
              "bar",
              "bakery",
              "food-shop",
              "retail",
              "gallery",
              "hybrid",
              "other",
            ],
          },
          address_ja: { type: "string" },
          address_en: { type: "string" },
          postal_code: { type: ["string", "null"] },
          official_url: { type: ["string", "null"] },
          google_maps_url: { type: ["string", "null"] },
          summary_ja: { type: "string" },
          summary_en: { type: "string" },
          why_ja: { type: "string" },
          why_en: { type: "string" },
          local_context_ja: { type: "string" },
          local_context_en: { type: "string" },
          hours_ja: { type: "string" },
          hours_en: { type: "string" },
          weekly: { anyOf: [weeklyObject, { type: "null" }] },
          closures_ja: { type: "string" },
          closures_en: { type: "string" },
          phone: { type: ["string", "null"] },
          last_order: { type: ["string", "null"] },
          service_modes: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "dine-in",
                "counter",
                "table",
                "standing",
                "takeaway",
                "retail",
                "exhibition",
              ],
            },
          },
          reservation_policy: {
            type: "string",
            enum: [
              "not-accepted",
              "optional",
              "recommended",
              "required",
              "unknown",
            ],
          },
          takeaway: { type: ["boolean", "null"] },
          review_observed_at: { type: ["string", "null"] },
          review_sampled_count: { type: ["integer", "null"], minimum: 0 },
          review_summary_ja: { type: ["string", "null"] },
          review_summary_en: { type: ["string", "null"] },
          review_positive_themes_ja: {
            type: "array",
            items: { type: "string" },
          },
          review_positive_themes_en: {
            type: "array",
            items: { type: "string" },
          },
          review_caution_themes_ja: {
            type: "array",
            items: { type: "string" },
          },
          review_caution_themes_en: {
            type: "array",
            items: { type: "string" },
          },
          review_source_urls: {
            type: "array",
            items: { type: "string" },
          },
          issues: { type: "array", items: { type: "string" } },
          sources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                url: { type: "string" },
                title: { type: "string" },
                publisher: { type: "string" },
                source_type: {
                  type: "string",
                  enum: [
                    "official",
                    "tourism",
                    "editorial",
                    "map",
                    "social",
                    "other",
                  ],
                },
                trust_level: {
                  type: "string",
                  enum: ["primary", "secondary", "discovery"],
                },
                supports: { type: "array", items: { type: "string" } },
                evidence_note: { type: "string" },
              },
              required: [
                "url",
                "title",
                "publisher",
                "source_type",
                "trust_level",
                "supports",
                "evidence_note",
              ],
            },
          },
        },
        required: [
          "slug",
          "name_ja",
          "name_en",
          "spot_kind",
          "venue_type",
          "address_ja",
          "address_en",
          "postal_code",
          "official_url",
          "google_maps_url",
          "summary_ja",
          "summary_en",
          "why_ja",
          "why_en",
          "local_context_ja",
          "local_context_en",
          "hours_ja",
          "hours_en",
          "weekly",
          "closures_ja",
          "closures_en",
          "phone",
          "last_order",
          "service_modes",
          "reservation_policy",
          "takeaway",
          "review_observed_at",
          "review_sampled_count",
          "review_summary_ja",
          "review_summary_en",
          "review_positive_themes_ja",
          "review_positive_themes_en",
          "review_caution_themes_ja",
          "review_caution_themes_en",
          "review_source_urls",
          "issues",
          "sources",
        ],
      },
    },
  },
  required: ["candidates"],
} as const;

export async function createResearchJob(input: ResearchInput) {
  const database = db();
  const jobId = id("job");
  const key = runtimeEnv().OPENAI_API_KEY;
  await database
    .prepare(`INSERT INTO research_jobs (
      id, region, categories_json, target_count, model, reasoning_effort, status
    ) VALUES (?, ?, ?, ?, 'gpt-5.6-sol', 'high', ?)`)
    .bind(
      jobId,
      input.region,
      JSON.stringify(input.categories),
      input.targetCount,
      key ? "running" : "waiting_for_key",
    )
    .run();

  if (!key) {
    await database
      .prepare(
        "UPDATE research_jobs SET error_message = ? WHERE id = ?",
      )
      .bind(
        "OPENAI_API_KEY is not configured. The job is saved and can be rerun after the secret is added.",
        jobId,
      )
      .run();
    return { id: jobId, status: "waiting_for_key" };
  }

  const prompt = [
    `Research ${input.targetCount} currently operating physical storefronts in ${input.region}, Japan.`,
    `Categories: ${input.categories.join(", ")}.`,
    "The audience is repeat international visitors seeking everyday local life and culture.",
    "Use current web search. Prefer official Japanese first-party pages for identity, address, opening hours, closures, reservation rules and contact details.",
    "For small stores without an official website, keep the candidate as draft and use map, official social, local tourism or reputable regional sources for discovery.",
    "If you find a confirmed Google Maps entity page, return its exact URL. Otherwise return null; never invent a Maps entity URL or Place ID.",
    "Review sources may be used only to summarize repeated visitor themes and cautions. Never quote review text or return reviewer identities. Record the observation date, sampled count and source URLs; return null/empty values if unavailable.",
    "Do not infer dates, hours, coordinates, Place IDs, translations or URLs.",
    "Include restaurants, cafés, independent shops or galleries, not sightseeing-only landmarks.",
    "When a material fact is missing or conflicting, set weekly to null and describe the issue.",
    "Keep source evidence notes short paraphrases. Return Japanese and careful English editorial text.",
    "All results enter editorial review as draft; do not call a candidate verified.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-sol",
      reasoning: { effort: "high" },
      tools: [{ type: "web_search" }],
      input: prompt,
      background: true,
      text: {
        format: {
          type: "json_schema",
          name: "store_research",
          strict: true,
          schema: researchSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    await database
      .prepare(
        "UPDATE research_jobs SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(message.slice(0, 1500), jobId)
      .run();
    return { id: jobId, status: "failed" };
  }

  const result = (await response.json()) as { id?: string; status?: string };
  await database
    .prepare(
      "UPDATE research_jobs SET provider_response_id = ?, status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(result.id ?? null, result.status ?? "running", jobId)
    .run();
  return { id: jobId, status: result.status ?? "running" };
}

function outputText(response: Record<string, unknown>): string | null {
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: unknown[] }).content)
      : [];
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "output_text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

function normalizeCandidate(
  candidate: ProviderCandidate,
  region: string,
): ResearchRecord {
  const now = new Date().toISOString().slice(0, 10);
  const sourceIds = candidate.sources.map(
    (_source, index) => `${candidate.slug}-source-${index + 1}`,
  );
  const fieldSources: Record<string, string[]> = {};
  for (const field of [
    "name.ja",
    "location.address.ja",
    "official.website",
    "practical.opening_hours",
    "summary",
    "business",
  ]) {
    const matches = candidate.sources
      .map((source, index) => ({ source, sourceId: sourceIds[index] }))
      .filter(
        ({ source }) =>
          source.trust_level === "primary" &&
          source.supports.some(
            (supported) =>
              supported === field ||
              field.startsWith(`${supported}.`) ||
              supported.startsWith(`${field}.`),
          ),
      )
      .map(({ sourceId }) => sourceId);
    if (matches.length) fieldSources[field] = matches;
  }
  const regionKey = region
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "region";
  const mapsSearchUrl = `https://www.google.com/maps/search/?${new URLSearchParams({
    api: "1",
    query: `${candidate.name_ja}, ${candidate.address_ja}`,
  }).toString()}`;
  const collectedReviews =
    candidate.review_observed_at !== null &&
    candidate.review_summary_ja !== null &&
    candidate.review_summary_en !== null;
  const pairThemes = (ja: string[], en: string[]) =>
    ja.map((item, index) => ({
      ja: item,
      en: en[index] ?? null,
    }));
  return {
    schema_version: "1.2.0",
    record_type: "spot",
    id: `spot:jp:auto:${candidate.slug}`,
    workflow_status: "draft",
    name: { ja: candidate.name_ja, en: candidate.name_en, aliases: [] },
    location: {
      country_code: "JP",
      prefecture: { ja: "", en: "" },
      municipality: { ja: region, en: region },
      neighborhood: null,
      address: { ja: candidate.address_ja, en: candidate.address_en },
      postal_code: candidate.postal_code,
      coordinates: null,
    },
    google_maps: {
      url: candidate.google_maps_url,
      place_id: null,
      search_url: mapsSearchUrl,
      link_status: candidate.google_maps_url
        ? "entity-confirmed"
        : "search-only",
    },
    official: { website: candidate.official_url, social_urls: [] },
    review_insights: {
      status: collectedReviews ? "collected" : "not-collected",
      observed_at: candidate.review_observed_at,
      source_types: candidate.review_source_urls.length
        ? [
            candidate.review_source_urls.some((url) =>
              /google\.[^/]+\/maps/i.test(url),
            )
              ? "google-maps"
              : "other",
          ]
        : [],
      source_urls: candidate.review_source_urls,
      sampled_review_count: candidate.review_sampled_count,
      summary: collectedReviews
        ? {
            ja: candidate.review_summary_ja,
            en: candidate.review_summary_en,
          }
        : null,
      positive_themes: pairThemes(
        candidate.review_positive_themes_ja,
        candidate.review_positive_themes_en,
      ),
      caution_themes: pairThemes(
        candidate.review_caution_themes_ja,
        candidate.review_caution_themes_en,
      ),
      methodology: {
        ja: "口コミ本文や投稿者名を保存せず、複数投稿で反復する傾向のみを要約。",
        en: "Summarize only recurring themes across multiple posts; do not retain review text or author names.",
      },
      caveats: collectedReviews
        ? [
            {
              ja: "口コミは変動する発見用情報であり、営業時間等の事実確認には使わない。",
              en: "Reviews are volatile discovery signals and do not verify practical facts such as opening hours.",
            },
          ]
        : [
            {
              ja: "口コミ傾向は未収集。",
              en: "Review themes have not been collected.",
            },
          ],
    },
    spot_kind: candidate.spot_kind,
    categories: [candidate.spot_kind],
    tags: [],
    summary: { ja: candidate.summary_ja, en: candidate.summary_en },
    audience_fit: {
      repeat_visitor_score: 4,
      daily_life_score: 4,
      tourist_density: "unknown",
      why: { ja: candidate.why_ja, en: candidate.why_en },
    },
    editorial: {
      why: { ja: candidate.why_ja, en: candidate.why_en },
      description: { ja: candidate.summary_ja, en: candidate.summary_en },
      tips: { ja: "訪問当日に公式情報を再確認。", en: "Recheck official information on the day of the visit." },
      walking_note: { ja: "周辺の生活街歩きと組み合わせる。", en: "Combine with a walk through the surrounding neighborhood." },
      cultural_note: {
        ja: candidate.local_context_ja,
        en: candidate.local_context_en,
      },
    },
    app_profile: {
      region: regionKey,
      main_category:
        candidate.spot_kind === "shop"
          ? "shopping_local"
          : candidate.spot_kind === "gallery"
            ? "culture_history"
            : "food_cafe",
      curated_id: null,
      subcategories: [],
      place_types: [],
      suitable_for: ["repeat", "deep_dive"],
      priority_for: ["repeat-visitors", "local-life"],
      budget_tier: null,
      selection_tier: "fallback",
      route_role: "any",
      meal_slots: [],
      best_time: null,
      vibe: null,
      foreigner_friendly: null,
      discovery_level: "deep_cut",
      hidden_gem: null,
      visit_duration_minutes: 45,
      pace: "medium",
      warnings: candidate.issues,
      best_months: [],
      avoid_months: [],
      weather_roles: [],
      open_by_09: null,
      open_after_20: null,
      night_slot_ok: null,
    },
    access: {
      nearest_stations: [],
      transport_notes: { ja: "要確認", en: "To be confirmed" },
      accessibility: { ja: "未確認", en: "Not confirmed" },
    },
    practical: {
      opening_hours: {
        raw_text: { ja: candidate.hours_ja, en: candidate.hours_en },
        weekly: candidate.weekly,
        exceptions: [],
      },
      regular_closures: {
        raw_text: { ja: candidate.closures_ja, en: candidate.closures_en },
        days: [],
        notes: [],
      },
      price: {
        currency: "JPY",
        range: null,
        notes: { ja: "要確認", en: "To be confirmed" },
      },
      reservations: {
        required: null,
        recommended: null,
        method: null,
        notes: { ja: "要確認", en: "To be confirmed" },
      },
      payment: [],
      language_support: [],
      etiquette: [],
      photography: { ja: "撮影前に確認。", en: "Ask before taking photographs." },
    },
    experience: {
      recommended_duration_minutes: 45,
      best_time: { ja: "営業時間内", en: "During opening hours" },
      highlights: [],
      nearby_pairing_ids: [],
    },
    food: null,
    business: {
      venue_type: candidate.venue_type,
      service_modes: candidate.service_modes,
      reservation_policy: candidate.reservation_policy,
      ordering_flow: null,
      seating: null,
      takeaway: candidate.takeaway,
      last_order: candidate.last_order,
      smoking_policy: "unknown",
      menu: null,
      dietary_support: null,
      public_contact: {
        phone: candidate.phone,
        inquiry_url: candidate.official_url,
      },
      local_context: {
        ja: candidate.local_context_ja,
        en: candidate.local_context_en,
      },
    },
    verification: { confidence: "medium", issues: candidate.issues },
    sources: candidate.sources.map((source, index) => ({
      source_id: sourceIds[index],
      url: source.url,
      title: source.title,
      publisher: source.publisher,
      source_type: source.source_type,
      trust_level: source.trust_level,
      language: "ja",
      accessed_at: now,
      supports: source.supports,
      evidence_note: source.evidence_note,
    })),
    field_sources: fieldSources,
    research: {
      researched_at: now,
      verified_at: null,
      next_review_at: now,
      agent_notes: candidate.issues,
      change_notes: [
        {
          at: now,
          from: null,
          to: "draft",
          note: "管理画面のWeb調査ジョブから候補として作成。",
        },
      ],
    },
  };
}

export async function syncResearchJob(jobId: string) {
  const database = db();
  const job = await database
    .prepare("SELECT * FROM research_jobs WHERE id = ?")
    .bind(jobId)
    .first<{
      id: string;
      region: string;
      provider_response_id: string | null;
      status: string;
    }>();
  if (!job) throw new Error("Research job not found.");
  if (!job.provider_response_id) return { status: job.status, imported: 0 };

  const key = runtimeEnv().OPENAI_API_KEY;
  if (!key) return { status: "waiting_for_key", imported: 0 };
  const response = await fetch(
    `https://api.openai.com/v1/responses/${encodeURIComponent(job.provider_response_id)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!response.ok) throw new Error((await response.text()).slice(0, 1000));
  const result = (await response.json()) as Record<string, unknown>;
  const status = typeof result.status === "string" ? result.status : "running";
  if (status !== "completed") {
    await database
      .prepare("UPDATE research_jobs SET status = ? WHERE id = ?")
      .bind(status, jobId)
      .run();
    return { status, imported: 0 };
  }

  const text = outputText(result);
  if (!text) throw new Error("The completed response did not contain structured output.");
  const parsed = JSON.parse(text) as { candidates: ProviderCandidate[] };
  let imported = 0;
  for (const item of parsed.candidates) {
    const record = normalizeCandidate(item, job.region);
    const sources = record.sources ?? [];
    const issues = record.verification?.issues ?? [];
    const result = await database
      .prepare(`INSERT OR IGNORE INTO candidates (
        id, job_id, record_id, name_ja, name_en, spot_kind,
        workflow_status, confidence, primary_source_count, issue_count,
        payload_json, review_notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft', 'medium', ?, ?, ?, '')`)
      .bind(
        id("candidate"),
        jobId,
        record.id,
        record.name.ja,
        record.name.en,
        record.spot_kind,
        sources.filter((source) => source.trust_level === "primary").length,
        issues.length,
        JSON.stringify(record),
      )
      .run();
    imported += result.meta.changes ?? 0;
  }
  await database
    .prepare(
      "UPDATE research_jobs SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(jobId)
    .run();
  return { status: "completed", imported };
}
