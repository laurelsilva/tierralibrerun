CREATE TABLE `email_logs` (
	`id` varchar(36) NOT NULL,
	`application_id` varchar(36) NOT NULL,
	`application_type` varchar(20) NOT NULL,
	`email_type` varchar(20) NOT NULL,
	`recipient_email` text NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'SENT',
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_logs_application_idx` ON `email_logs` (`application_id`);--> statement-breakpoint
CREATE INDEX `email_logs_type_idx` ON `email_logs` (`application_type`,`email_type`);--> statement-breakpoint
CREATE INDEX `email_logs_sent_at_idx` ON `email_logs` (`sent_at`);