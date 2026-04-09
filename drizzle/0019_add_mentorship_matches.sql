CREATE TABLE `mentorship_matches` (
	`id` varchar(36) NOT NULL,
	`fund_application_id` varchar(36) NOT NULL,
	`mentor_application_id` varchar(36) NOT NULL,
	`admin_notes` text,
	`ended_at` timestamp NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	PRIMARY KEY (`id`),
	KEY `mentorship_matches_created_at_idx` (`created_at`),
	KEY `mentorship_matches_fund_app_idx` (`fund_application_id`),
	KEY `mentorship_matches_mentor_app_idx` (`mentor_application_id`),
	KEY `mentorship_matches_open_idx` (`fund_application_id`, `ended_at`)
);
