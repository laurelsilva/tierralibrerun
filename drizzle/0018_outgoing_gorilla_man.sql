CREATE TABLE `fund_application_comments` (
	`id` varchar(36) NOT NULL,
	`fund_application_id` varchar(36) NOT NULL,
	`admin_email` varchar(255) NOT NULL,
	`admin_name` text,
	`comment` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fund_application_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `fund_app_comments_app_idx` ON `fund_application_comments` (`fund_application_id`);--> statement-breakpoint
CREATE INDEX `fund_app_comments_created_at_idx` ON `fund_application_comments` (`created_at`);