-- Rename involvement to community_contribution and add tierra_libre_contribution
ALTER TABLE `fund_applications` 
  CHANGE COLUMN `involvement` `community_contribution` text NOT NULL;

-- Add new column with default for existing rows (will be populated from legacy data)
ALTER TABLE `fund_applications` 
  ADD COLUMN `tierra_libre_contribution` text NOT NULL DEFAULT '' AFTER `community_contribution`;

-- Copy community_contribution to tierra_libre_contribution for existing applications
-- (since the old "involvement" field covered both topics)
UPDATE `fund_applications` 
  SET `tierra_libre_contribution` = community_contribution 
  WHERE `tierra_libre_contribution` = '';
