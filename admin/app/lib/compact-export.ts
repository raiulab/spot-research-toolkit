import type { ResearchRecord } from "./store";

function localized(
  value: unknown,
): { ja: string; en: string | null } | null {
  if (!value || typeof value !== "object") return null;
  const item = value as { ja?: unknown; en?: unknown };
  if (typeof item.ja !== "string") return null;
  return {
    ja: item.ja,
    en: typeof item.en === "string" ? item.en : null,
  };
}

export function toCompactRecord(record: ResearchRecord) {
  const profile = (record.app_profile ?? {}) as Record<string, unknown>;
  const location = (record.location ?? {}) as Record<string, unknown>;
  const practical = (record.practical ?? {}) as Record<string, unknown>;
  const opening = (practical.opening_hours ?? {}) as Record<string, unknown>;
  const experience = (record.experience ?? {}) as Record<string, unknown>;
  const googleMaps = (record.google_maps ?? {}) as Record<string, unknown>;
  return {
    id:
      typeof profile.curated_id === "string"
        ? profile.curated_id
        : record.id.replaceAll(":", "-"),
    name: record.name,
    category:
      typeof profile.main_category === "string"
        ? profile.main_category
        : "other",
    subcategories: Array.isArray(profile.subcategories)
      ? profile.subcategories
      : [],
    address: localized(location.address),
    summary: localized(record.summary),
    editorial: record.editorial ?? null,
    opening_hours: opening.weekly ?? null,
    regular_opening_hours: opening.weekly ?? null,
    visit_duration_minutes:
      profile.visit_duration_minutes ??
      experience.recommended_duration_minutes ??
      null,
    budget_tier: profile.budget_tier ?? null,
    selection_tier: profile.selection_tier ?? "fallback",
    route_role: profile.route_role ?? "any",
    meal_slots: profile.meal_slots ?? [],
    suitable_for: profile.suitable_for ?? [],
    warnings: profile.warnings ?? [],
    google_maps_url: googleMaps.url ?? googleMaps.search_url ?? null,
    place_id: googleMaps.place_id ?? null,
    review_insights: record.review_insights ?? null,
    source_record_id: record.id,
  };
}
