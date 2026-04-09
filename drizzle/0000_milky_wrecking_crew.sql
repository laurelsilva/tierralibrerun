CREATE TABLE `fund_applications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`age` int NOT NULL,
	`zipcode` text NOT NULL,
	`race` varchar(255) NOT NULL,
	`first_race` boolean NOT NULL,
	`experience` text NOT NULL,
	`reason` text NOT NULL,
	`goals` text,
	`involvement` text NOT NULL,
	`bipoc_identity` boolean NOT NULL,
	`additional_assistance_needs` text,
	`referral_source` text NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'PENDING',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fund_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `races` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`location` text NOT NULL,
	`dates` text NOT NULL,
	`distances` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`organization` text,
	`registration_url` text,
	`website_url` text,
	`image` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `races_id` PRIMARY KEY(`id`),
	CONSTRAINT `races_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`clerk_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` text,
	`profile_image_url` text,
	`user_type` text,
	`onboarding_completed` boolean NOT NULL DEFAULT false,
	`slack_joined` boolean NOT NULL DEFAULT false,
	`strava_joined` boolean NOT NULL DEFAULT false,
	`donation_completed` boolean NOT NULL DEFAULT false,
	`instagram_followed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_clerk_id_unique` UNIQUE(`clerk_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `fund_applications_user_id_idx` ON `fund_applications` (`user_id`);--> statement-breakpoint
CREATE INDEX `fund_applications_created_at_idx` ON `fund_applications` (`created_at`);--> statement-breakpoint
CREATE INDEX `fund_applications_status_idx` ON `fund_applications` (`status`);--> statement-breakpoint
CREATE INDEX `fund_applications_user_created_at_idx` ON `fund_applications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `races_slug_idx` ON `races` (`slug`);--> statement-breakpoint
CREATE INDEX `races_active_idx` ON `races` (`is_active`);