-- Canonical workflow foundation for fund + mentor application lifecycle

ALTER TABLE `fund_applications`
  ADD COLUMN `workflow_stage` varchar(64) NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN `decision_at` timestamp NULL,
  ADD COLUMN `offer_sent_at` timestamp NULL,
  ADD COLUMN `confirmation_deadline_at` timestamp NULL,
  ADD COLUMN `confirmed_at` timestamp NULL,
  ADD COLUMN `registration_started_at` timestamp NULL,
  ADD COLUMN `registered_at` timestamp NULL,
  ADD COLUMN `onboarding_started_at` timestamp NULL,
  ADD COLUMN `activated_at` timestamp NULL,
  ADD COLUMN `closed_at` timestamp NULL,
  ADD COLUMN `closed_reason` text NULL;

CREATE INDEX `fund_applications_workflow_stage_idx`
  ON `fund_applications` (`workflow_stage`);

ALTER TABLE `mentor_applications`
  ADD COLUMN `workflow_stage` varchar(64) NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN `decision_at` timestamp NULL,
  ADD COLUMN `approved_at` timestamp NULL,
  ADD COLUMN `matched_at` timestamp NULL,
  ADD COLUMN `activated_at` timestamp NULL,
  ADD COLUMN `closed_at` timestamp NULL,
  ADD COLUMN `closed_reason` text NULL;

CREATE INDEX `mentor_applications_workflow_stage_idx`
  ON `mentor_applications` (`workflow_stage`);

CREATE TABLE `application_events` (
  `id` varchar(36) NOT NULL,
  `application_id` varchar(36) NOT NULL,
  `application_type` varchar(20) NOT NULL,
  `event_type` varchar(64) NOT NULL,
  `from_stage` varchar(64) NULL,
  `to_stage` varchar(64) NULL,
  `actor_user_id` varchar(36) NULL,
  `actor_role` varchar(32) NOT NULL DEFAULT 'SYSTEM',
  `payload` text NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `application_events_id` PRIMARY KEY (`id`)
);

CREATE INDEX `application_events_application_idx`
  ON `application_events` (`application_type`, `application_id`);
CREATE INDEX `application_events_event_type_idx`
  ON `application_events` (`event_type`);
CREATE INDEX `application_events_created_at_idx`
  ON `application_events` (`created_at`);

CREATE TABLE `application_tasks` (
  `id` varchar(36) NOT NULL,
  `application_id` varchar(36) NOT NULL,
  `application_type` varchar(20) NOT NULL,
  `task_type` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NULL,
  `status` varchar(20) NOT NULL DEFAULT 'OPEN',
  `priority` varchar(20) NOT NULL DEFAULT 'MEDIUM',
  `owner_user_id` varchar(36) NULL,
  `due_at` timestamp NULL,
  `completed_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `application_tasks_id` PRIMARY KEY (`id`)
);

CREATE INDEX `application_tasks_application_idx`
  ON `application_tasks` (`application_type`, `application_id`);
CREATE INDEX `application_tasks_status_idx`
  ON `application_tasks` (`status`);
CREATE INDEX `application_tasks_due_at_idx`
  ON `application_tasks` (`due_at`);
CREATE INDEX `application_tasks_owner_idx`
  ON `application_tasks` (`owner_user_id`);

-- Backfill fund workflow stage from legacy status + registration status
UPDATE `fund_applications`
SET
  `workflow_stage` = CASE
    WHEN `status` = 'WAITLISTED' THEN 'WAITLISTED'
    WHEN `status` = 'REJECTED' THEN 'DECLINED'
    WHEN `status` = 'APPROVED' AND `registration_status` IN ('SELF_REGISTERED', 'ADMIN_REGISTERED') THEN 'REGISTERED'
    WHEN `status` = 'APPROVED' THEN 'AWAITING_CONFIRMATION'
    ELSE 'IN_REVIEW'
  END,
  `decision_at` = CASE
    WHEN `decision_at` IS NULL AND `status` IN ('APPROVED', 'WAITLISTED', 'REJECTED') THEN `updated_at`
    ELSE `decision_at`
  END,
  `offer_sent_at` = CASE
    WHEN `offer_sent_at` IS NULL AND `status` = 'APPROVED' THEN `updated_at`
    ELSE `offer_sent_at`
  END,
  `registered_at` = CASE
    WHEN `registered_at` IS NULL AND `registration_status` IN ('SELF_REGISTERED', 'ADMIN_REGISTERED') THEN `updated_at`
    ELSE `registered_at`
  END
WHERE `workflow_stage` = 'SUBMITTED';

-- Backfill mentor workflow stage from legacy status
UPDATE `mentor_applications`
SET
  `workflow_stage` = CASE
    WHEN `status` = 'APPROVED' THEN 'APPROVED_POOL'
    WHEN `status` = 'WAITLISTED' THEN 'WAITLISTED'
    WHEN `status` = 'REJECTED' THEN 'DECLINED'
    ELSE 'IN_REVIEW'
  END,
  `decision_at` = CASE
    WHEN `decision_at` IS NULL AND `status` IN ('APPROVED', 'WAITLISTED', 'REJECTED') THEN `updated_at`
    ELSE `decision_at`
  END,
  `approved_at` = CASE
    WHEN `approved_at` IS NULL AND `status` = 'APPROVED' THEN `updated_at`
    ELSE `approved_at`
  END
WHERE `workflow_stage` = 'SUBMITTED';
