import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const researchJobs = sqliteTable("research_jobs", {
  id: text("id").primaryKey(),
  region: text("region").notNull(),
  categoriesJson: text("categories_json").notNull(),
  targetCount: integer("target_count").notNull(),
  model: text("model").notNull().default("gpt-5.6-sol"),
  reasoningEffort: text("reasoning_effort").notNull().default("high"),
  status: text("status").notNull().default("queued"),
  providerResponseId: text("provider_response_id"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
});

export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey(),
  jobId: text("job_id"),
  recordId: text("record_id").notNull().unique(),
  nameJa: text("name_ja").notNull(),
  nameEn: text("name_en"),
  spotKind: text("spot_kind").notNull(),
  workflowStatus: text("workflow_status").notNull().default("draft"),
  confidence: text("confidence").notNull().default("medium"),
  primarySourceCount: integer("primary_source_count").notNull().default(0),
  issueCount: integer("issue_count").notNull().default(0),
  payloadJson: text("payload_json").notNull(),
  reviewNotes: text("review_notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  approvedAt: text("approved_at"),
});

export const researchSchedules = sqliteTable("research_schedules", {
  id: text("id").primaryKey(),
  region: text("region").notNull(),
  categoriesJson: text("categories_json").notNull(),
  targetCount: integer("target_count").notNull(),
  cadence: text("cadence").notNull(),
  weekday: integer("weekday"),
  dayOfMonth: integer("day_of_month"),
  timeJst: text("time_jst").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  nextRunAt: text("next_run_at").notNull(),
  lastRunAt: text("last_run_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const exportRuns = sqliteTable("export_runs", {
  id: text("id").primaryKey(),
  format: text("format").notNull(),
  region: text("region"),
  mainCategory: text("main_category"),
  recordCount: integer("record_count").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
