ALTER TABLE `fund_applications`
ADD COLUMN `registration_status` varchar(50) NOT NULL DEFAULT 'PENDING';
