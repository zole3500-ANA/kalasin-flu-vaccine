CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`hospital_id` text NOT NULL,
	`year` integer NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	`uploaded_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_attachments_hospital_year` ON `attachments` (`hospital_id`,`year`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hospital_id` text NOT NULL,
	`year` integer NOT NULL,
	`allocated` integer DEFAULT 0 NOT NULL,
	`counts_json` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reports_hospital_year` ON `reports` (`hospital_id`,`year`);