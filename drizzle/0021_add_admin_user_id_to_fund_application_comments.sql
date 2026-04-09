-- Add admin_user_id to fund_application_comments so the DB (users table) is the source of truth
-- Note: kept nullable to avoid breaking existing rows; new writes will populate it.
ALTER TABLE `fund_application_comments`
	ADD COLUMN `admin_user_id` varchar(36);

--> statement-breakpoint
CREATE INDEX `fund_app_comments_admin_user_idx` ON `fund_application_comments` (`admin_user_id`);
