-- Migration: 002_add_event_rsvp_answers_table.sql
-- Purpose: Create a table to store per-question RSVP answers for events

-- Notes:
-- - This table stores structured answers keyed by a stable `question_key` defined in Sanity.
-- - It is safe to run multiple times thanks to IF NOT EXISTS.
-- - Unique constraint prevents duplicate answers per (event_id, user_id, question_key).
-- - Foreign keys are intentionally omitted for PlanetScale compatibility.

CREATE TABLE IF NOT EXISTS `event_rsvp_answers` (
  `id` varchar(36) NOT NULL,
  `event_id` varchar(64) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `question_key` varchar(64) NOT NULL,
  `answer` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_event_user_question` (`event_id`, `user_id`, `question_key`),
  KEY `event_rsvp_answers_event_idx` (`event_id`),
  KEY `event_rsvp_answers_user_idx` (`user_id`),
  KEY `event_rsvp_answers_question_idx` (`question_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
