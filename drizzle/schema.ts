import { sql } from 'drizzle-orm'
import {
	mysqlTable,
	index,
	primaryKey,
	varchar,
	text,
	timestamp,
	int,
	tinyint,
} from 'drizzle-orm/mysql-core'

export const emailLogs = mysqlTable(
	'email_logs',
	{
		id: varchar({ length: 36 }).notNull(),
		applicationId: varchar('application_id', { length: 36 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(),
		emailType: varchar('email_type', { length: 20 }).notNull(),
		recipientEmail: text('recipient_email').notNull(),
		status: varchar({ length: 20 }).default('SENT').notNull(),
		sentAt: timestamp('sent_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
	},
	(table) => [
		index('email_logs_application_idx').on(table.applicationId),
		index('email_logs_type_idx').on(table.applicationType, table.emailType),
		index('email_logs_sent_at_idx').on(table.sentAt),
		primaryKey({ columns: [table.id], name: 'email_logs_id' }),
	],
)

export const emailPresets = mysqlTable(
	'email_presets',
	{
		id: varchar({ length: 36 }).notNull(),
		key: varchar({ length: 64 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(),
		category: varchar({ length: 20 }).notNull(),
		status: varchar({ length: 20 }),
		subjectTemplate: text('subject_template').notNull(),
		htmlTemplate: text('html_template').notNull(),
		defaultTokens: text('default_tokens'),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		updatedAt: timestamp('updated_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
	},
	(table) => [
		index('uniq_preset_key_type_status').on(
			table.key,
			table.applicationType,
			table.status,
		),
		index('email_presets_key_idx').on(table.key),
		index('email_presets_type_idx').on(table.applicationType),
		index('email_presets_status_idx').on(table.status),
		primaryKey({ columns: [table.id], name: 'email_presets_id' }),
	],
)

export const fundApplications = mysqlTable(
	'fund_applications',
	{
		id: varchar({ length: 36 }).notNull(),
		userId: varchar('user_id', { length: 36 }).notNull(),
		name: text().notNull(),
		email: text().notNull(),
		age: int().notNull(),
		zipcode: text().notNull(),
		race: varchar({ length: 255 }).notNull(),
		firstRace: tinyint('first_race').notNull(),
		experience: text().notNull(),
		reason: text().notNull(),
		goals: text(),
		communityContribution: text('community_contribution').notNull(),
		tierraLibreContribution: text('tierra_libre_contribution')
			.notNull()
			.default(''),
		bipocIdentity: tinyint('bipoc_identity').notNull(),
		additionalAssistanceNeeds: text('additional_assistance_needs'),
		referralSource: text('referral_source').notNull(),
		status: varchar({ length: 50 }).default('PENDING').notNull(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		updatedAt: timestamp('updated_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		genderIdentity: text('gender_identity').notNull(),
		wantsMentor: tinyint('wants_mentor').default(0).notNull(),
		gearNeeds: text('gear_needs'),
		registrationStatus: varchar('registration_status', { length: 50 })
			.default('PENDING')
			.notNull(),
		workflowStage: varchar('workflow_stage', { length: 64 })
			.default('SUBMITTED')
			.notNull(),
		decisionAt: timestamp('decision_at', { mode: 'string' }),
		offerSentAt: timestamp('offer_sent_at', { mode: 'string' }),
		confirmationDeadlineAt: timestamp('confirmation_deadline_at', {
			mode: 'string',
		}),
		confirmedAt: timestamp('confirmed_at', { mode: 'string' }),
		registrationStartedAt: timestamp('registration_started_at', {
			mode: 'string',
		}),
		registeredAt: timestamp('registered_at', { mode: 'string' }),
		onboardingStartedAt: timestamp('onboarding_started_at', { mode: 'string' }),
		activatedAt: timestamp('activated_at', { mode: 'string' }),
		closedAt: timestamp('closed_at', { mode: 'string' }),
		closedReason: text('closed_reason'),
		adminNotes: text('admin_notes'),
		mentorGenderPreference: text('mentor_gender_preference'),
		raceDate: timestamp('race_date', { mode: 'string' }),
		raceLocation: text('race_location'),
	},
	(table) => [
		index('fund_applications_created_at_idx').on(table.createdAt),
		index('fund_applications_status_idx').on(table.status),
		index('fund_applications_workflow_stage_idx').on(table.workflowStage),
		index('fund_applications_user_created_at_idx').on(
			table.userId,
			table.createdAt,
		),
		primaryKey({ columns: [table.id], name: 'fund_applications_id' }),
	],
)

export const mentorApplications = mysqlTable(
	'mentor_applications',
	{
		id: varchar({ length: 36 }).notNull(),
		userId: varchar('user_id', { length: 36 }).notNull(),
		name: text().notNull(),
		email: text().notNull(),
		pronouns: text(),
		runningExperienceYears: int('running_experience_years'),
		trailRunningExperienceYears: int('trail_running_experience_years'),
		mentorshipExperience: text('mentorship_experience'),
		motivationToMentor: text('motivation_to_mentor').notNull(),
		preferredCommunicationStyle: text(
			'preferred_communication_style',
		).notNull(),
		availability: text().notNull(),
		specialExpertise: text('special_expertise'),
		bipocIdentity: tinyint('bipoc_identity'),
		genderIdentity: text('gender_identity'),
		locationRegion: text('location_region'),
		slackUsername: text('slack_username'),
		additionalInfo: text('additional_info'),
		hearAboutProgram: text('hear_about_program').notNull(),
		status: varchar({ length: 50 }).default('PENDING').notNull(),
		workflowStage: varchar('workflow_stage', { length: 64 })
			.default('SUBMITTED')
			.notNull(),
		decisionAt: timestamp('decision_at', { mode: 'string' }),
		approvedAt: timestamp('approved_at', { mode: 'string' }),
		matchedAt: timestamp('matched_at', { mode: 'string' }),
		activatedAt: timestamp('activated_at', { mode: 'string' }),
		closedAt: timestamp('closed_at', { mode: 'string' }),
		closedReason: text('closed_reason'),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		updatedAt: timestamp('updated_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		mentorGenderPreference: text('mentor_gender_preference'),
	},
	(table) => [
		index('mentor_applications_created_at_idx').on(table.createdAt),
		index('mentor_applications_status_idx').on(table.status),
		index('mentor_applications_workflow_stage_idx').on(table.workflowStage),
		index('mentor_applications_user_created_at_idx').on(
			table.userId,
			table.createdAt,
		),
		primaryKey({ columns: [table.id], name: 'mentor_applications_id' }),
	],
)

export const mentorshipMatches = mysqlTable(
	'mentorship_matches',
	{
		id: varchar({ length: 36 }).notNull(),
		fundApplicationId: varchar('fund_application_id', { length: 36 }).notNull(),
		mentorApplicationId: varchar('mentor_application_id', {
			length: 36,
		}).notNull(),
		adminNotes: text('admin_notes'),
		endedAt: timestamp('ended_at', { mode: 'string' }),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		updatedAt: timestamp('updated_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
	},
	(table) => [
		index('mentorship_matches_created_at_idx').on(table.createdAt),
		index('mentorship_matches_fund_app_idx').on(table.fundApplicationId),
		index('mentorship_matches_mentor_app_idx').on(table.mentorApplicationId),
		index('mentorship_matches_open_idx').on(
			table.fundApplicationId,
			table.endedAt,
		),
		primaryKey({ columns: [table.id], name: 'mentorship_matches_id' }),
	],
)

export const applicationEvents = mysqlTable(
	'application_events',
	{
		id: varchar({ length: 36 }).notNull(),
		applicationId: varchar('application_id', { length: 36 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(),
		eventType: varchar('event_type', { length: 64 }).notNull(),
		fromStage: varchar('from_stage', { length: 64 }),
		toStage: varchar('to_stage', { length: 64 }),
		actorUserId: varchar('actor_user_id', { length: 36 }),
		actorRole: varchar('actor_role', { length: 32 })
			.default('SYSTEM')
			.notNull(),
		payload: text(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
	},
	(table) => [
		index('application_events_application_idx').on(
			table.applicationType,
			table.applicationId,
		),
		index('application_events_event_type_idx').on(table.eventType),
		index('application_events_created_at_idx').on(table.createdAt),
		primaryKey({ columns: [table.id], name: 'application_events_id' }),
	],
)

export const applicationTasks = mysqlTable(
	'application_tasks',
	{
		id: varchar({ length: 36 }).notNull(),
		applicationId: varchar('application_id', { length: 36 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(),
		taskType: varchar('task_type', { length: 64 }).notNull(),
		title: varchar({ length: 255 }).notNull(),
		description: text(),
		status: varchar({ length: 20 }).default('OPEN').notNull(),
		priority: varchar({ length: 20 }).default('MEDIUM').notNull(),
		ownerUserId: varchar('owner_user_id', { length: 36 }),
		dueAt: timestamp('due_at', { mode: 'string' }),
		completedAt: timestamp('completed_at', { mode: 'string' }),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		updatedAt: timestamp('updated_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
	},
	(table) => [
		index('application_tasks_application_idx').on(
			table.applicationType,
			table.applicationId,
		),
		index('application_tasks_status_idx').on(table.status),
		index('application_tasks_due_at_idx').on(table.dueAt),
		index('application_tasks_owner_idx').on(table.ownerUserId),
		primaryKey({ columns: [table.id], name: 'application_tasks_id' }),
	],
)

export const users = mysqlTable(
	'users',
	{
		id: varchar({ length: 36 }).notNull(),
		clerkId: varchar('clerk_id', { length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull(),
		name: text(),
		profileImageUrl: text('profile_image_url'),
		userType: text('user_type'),
		onboardingCompleted: tinyint('onboarding_completed').default(0).notNull(),
		slackJoined: tinyint('slack_joined').default(0).notNull(),
		stravaJoined: tinyint('strava_joined').default(0).notNull(),
		donationCompleted: tinyint('donation_completed').default(0).notNull(),
		instagramFollowed: tinyint('instagram_followed').default(0).notNull(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		updatedAt: timestamp('updated_at', { mode: 'string' })
			.default(sql`(now())`)
			.notNull(),
		newsletterSubscribed: tinyint('newsletter_subscribed').default(0).notNull(),
		genderIdentity: text('gender_identity'),
		pronouns: text(),
		age: int(),
		locationRegion: text('location_region'),
		runningExperience: text('running_experience'),
		hearAbout: text('hear_about'),
		acceptedCodeOfConduct: tinyint('accepted_code_of_conduct')
			.default(0)
			.notNull(),
	},
	(table) => [
		index('users_created_at_idx').on(table.createdAt),
		index('users_email_idx').on(table.email),
		primaryKey({ columns: [table.id], name: 'users_id' }),
	],
)
