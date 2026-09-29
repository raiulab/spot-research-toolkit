CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text,
	`record_id` text NOT NULL,
	`name_ja` text NOT NULL,
	`name_en` text,
	`spot_kind` text NOT NULL,
	`workflow_status` text DEFAULT 'draft' NOT NULL,
	`confidence` text DEFAULT 'medium' NOT NULL,
	`primary_source_count` integer DEFAULT 0 NOT NULL,
	`issue_count` integer DEFAULT 0 NOT NULL,
	`payload_json` text NOT NULL,
	`review_notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`approved_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidates_record_id_unique` ON `candidates` (`record_id`);--> statement-breakpoint
CREATE TABLE `export_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`format` text NOT NULL,
	`region` text,
	`main_category` text,
	`record_count` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `research_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`region` text NOT NULL,
	`categories_json` text NOT NULL,
	`target_count` integer NOT NULL,
	`model` text DEFAULT 'gpt-5.6-sol' NOT NULL,
	`reasoning_effort` text DEFAULT 'high' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider_response_id` text,
	`error_message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`started_at` text,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `research_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`region` text NOT NULL,
	`categories_json` text NOT NULL,
	`target_count` integer NOT NULL,
	`cadence` text NOT NULL,
	`weekday` integer,
	`day_of_month` integer,
	`time_jst` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`next_run_at` text NOT NULL,
	`last_run_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
