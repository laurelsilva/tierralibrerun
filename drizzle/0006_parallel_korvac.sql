CREATE TABLE `mentor_applications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`pronouns` text,
	`running_experience_years` int,
	`trail_running_experience_years` int,
	`mentorship_experience` text,
	`motivation_to_mentor` text NOT NULL,
	`preferred_communication_style` text NOT NULL,
	`availability` text NOT NULL,
	`special_expertise` text,
	`bipoc_identity` boolean,
	`gender_identity` text,
	`location_region` text,
	`slack_username` text,
	`additional_info` text,
	`hear_about_program` text NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'PENDING',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mentor_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `mentor_applications_created_at_idx` ON `mentor_applications` (`created_at`);--> statement-breakpoint
CREATE INDEX `mentor_applications_status_idx` ON `mentor_applications` (`status`);--> statement-breakpoint
CREATE INDEX `mentor_applications_user_created_at_idx` ON `mentor_applications` (`user_id`,`created_at`);