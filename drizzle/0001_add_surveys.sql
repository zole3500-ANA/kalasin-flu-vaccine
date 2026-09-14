DROP TABLE IF EXISTS `surveys`;
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hospital_id` text NOT NULL,
	`year` integer NOT NULL,
	`target_total` integer DEFAULT 0 NOT NULL,
	`requested_doses` integer DEFAULT 0 NOT NULL,
	`counts_json` text NOT NULL,
	`coordinator_name` text DEFAULT '' NOT NULL,
	`coordinator_phone` text DEFAULT '' NOT NULL,
	`coordinator_position` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_surveys_hospital_year` ON `surveys` (`hospital_id`,`year`);
