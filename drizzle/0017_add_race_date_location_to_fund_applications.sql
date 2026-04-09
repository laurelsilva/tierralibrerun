-- Custom SQL migration file, put your code below! --
-- Add race_date and race_location columns to fund_applications table
-- These will be populated from Sanity when applications are submitted

ALTER TABLE `fund_applications` ADD COLUMN `race_date` timestamp;
ALTER TABLE `fund_applications` ADD COLUMN `race_location` text;
