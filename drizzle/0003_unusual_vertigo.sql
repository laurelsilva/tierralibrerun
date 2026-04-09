DROP TABLE `hearts`;--> statement-breakpoint
DROP INDEX `fund_applications_user_id_idx` ON `fund_applications`;--> statement-breakpoint
ALTER TABLE `fund_applications` ADD `gender_identity` text NOT NULL;