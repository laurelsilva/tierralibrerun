CREATE TABLE `hearts` (
	`id` varchar(36) NOT NULL,
	`section_id` varchar(255) NOT NULL,
	`ip_address` varchar(45) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hearts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `hearts_section_id_idx` ON `hearts` (`section_id`);--> statement-breakpoint
CREATE INDEX `hearts_ip_section_idx` ON `hearts` (`ip_address`,`section_id`);--> statement-breakpoint
CREATE INDEX `hearts_created_at_idx` ON `hearts` (`created_at`);