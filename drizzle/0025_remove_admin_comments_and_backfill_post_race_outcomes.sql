-- Remove unused private admin discussion table.
DROP TABLE IF EXISTS `fund_application_comments`;

-- Backfill: athletes still marked active after race date should move to no-longer-active.
UPDATE `fund_applications`
SET
  `workflow_stage` = 'NO_LONGER_ACTIVE',
  `updated_at` = NOW()
WHERE
  `workflow_stage` = 'ACTIVE_IN_PROGRAM'
  AND `race_date` IS NOT NULL
  AND `race_date` < NOW();
