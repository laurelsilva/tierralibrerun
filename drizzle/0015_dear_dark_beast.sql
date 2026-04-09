CREATE TABLE `event_rsvps` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(64) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_rsvps_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_event_user` UNIQUE(`event_id`,`user_id`)
);
--> statement-breakpoint
CREATE INDEX `event_rsvps_event_idx` ON `event_rsvps` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_rsvps_user_idx` ON `event_rsvps` (`user_id`);