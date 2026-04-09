import { relations } from 'drizzle-orm'
import {
	mysqlTable,
	text,
	timestamp,
	varchar,
	boolean,
	int,
	index,
	uniqueIndex,
} from 'drizzle-orm/mysql-core'

export const users = mysqlTable(
	'users',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		clerkId: varchar('clerk_id', { length: 255 }).notNull(),
		email: varchar('email', { length: 255 }).notNull(),
		name: text('name'),
		profileImageUrl: text('profile_image_url'),
		userType: text('user_type'),
		genderIdentity: text('gender_identity'),
		pronouns: text('pronouns'),
		age: int('age'),
		locationRegion: text('location_region'),
		runningExperience: text('running_experience'),
		hearAbout: text('hear_about'),
		acceptedCodeOfConduct: boolean('accepted_code_of_conduct')
			.default(false)
			.notNull(),
		onboardingCompleted: boolean('onboarding_completed')
			.default(false)
			.notNull(),
		slackJoined: boolean('slack_joined').default(false).notNull(),
		stravaJoined: boolean('strava_joined').default(false).notNull(),
		donationCompleted: boolean('donation_completed').default(false).notNull(),
		instagramFollowed: boolean('instagram_followed').default(false).notNull(),
		newsletterSubscribed: boolean('newsletter_subscribed')
			.default(false)
			.notNull(),
		fundApplicationLimitExempt: boolean('fund_application_limit_exempt')
			.default(false)
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		clerkIdIdx: index('users_clerk_id_idx').on(table.clerkId),
		createdAtIdx: index('users_created_at_idx').on(table.createdAt),
		emailIdx: index('users_email_idx').on(table.email),
	}),
)

// Fund applications table
export const fundApplications = mysqlTable(
	'fund_applications',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: varchar('user_id', { length: 36 }).notNull(),
		name: text('name').notNull(),
		email: text('email').notNull(),
		age: int('age').notNull(),
		zipcode: text('zipcode').notNull(),
		race: varchar('race', { length: 255 }).notNull(),
		raceDate: timestamp('race_date'),
		raceLocation: text('race_location'),
		firstRace: boolean('first_race').notNull(),
		experience: text('experience').notNull(),
		reason: text('reason').notNull(),
		goals: text('goals'),
		communityContribution: text('community_contribution').notNull(),
		tierraLibreContribution: text('tierra_libre_contribution')
			.notNull()
			.default(''),
		bipocIdentity: boolean('bipoc_identity').notNull(),
		genderIdentity: text('gender_identity').notNull(),
		additionalAssistanceNeeds: text('additional_assistance_needs'),
		referralSource: text('referral_source').notNull(),
		gearNeeds: text('gear_needs'),
		wantsMentor: boolean('wants_mentor').notNull().default(false),
		mentorGenderPreference: text('mentor_gender_preference'),
		status: varchar('status', { length: 50 }).notNull().default('PENDING'),
		registrationStatus: varchar('registration_status', { length: 50 })
			.notNull()
			.default('PENDING'),
		workflowStage: varchar('workflow_stage', { length: 64 })
			.notNull()
			.default('SUBMITTED'),
		decisionAt: timestamp('decision_at'),
		offerSentAt: timestamp('offer_sent_at'),
		confirmationDeadlineAt: timestamp('confirmation_deadline_at'),
		confirmedAt: timestamp('confirmed_at'),
		registrationStartedAt: timestamp('registration_started_at'),
		registeredAt: timestamp('registered_at'),
		onboardingStartedAt: timestamp('onboarding_started_at'),
		activatedAt: timestamp('activated_at'),
		closedAt: timestamp('closed_at'),
		closedReason: text('closed_reason'),
		adminNotes: text('admin_notes'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		createdAtIdx: index('fund_applications_created_at_idx').on(table.createdAt),
		statusIdx: index('fund_applications_status_idx').on(table.status),
		workflowStageIdx: index('fund_applications_workflow_stage_idx').on(
			table.workflowStage,
		),
		userCreatedAtIdx: index('fund_applications_user_created_at_idx').on(
			table.userId,
			table.createdAt,
		),
	}),
)

// Mentor applications table
export const mentorApplications = mysqlTable(
	'mentor_applications',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: varchar('user_id', { length: 36 }).notNull(),
		name: text('name').notNull(),
		email: text('email').notNull(),
		pronouns: text('pronouns'),
		runningExperienceYears: int('running_experience_years'),
		trailRunningExperienceYears: int('trail_running_experience_years'),
		mentorshipExperience: text('mentorship_experience'),
		motivationToMentor: text('motivation_to_mentor').notNull(),
		preferredCommunicationStyle: text(
			'preferred_communication_style',
		).notNull(),
		availability: text('availability').notNull(),
		specialExpertise: text('special_expertise'),
		bipocIdentity: boolean('bipoc_identity'),
		genderIdentity: text('gender_identity'),
		mentorGenderPreference: text('mentor_gender_preference'),
		locationRegion: text('location_region'),
		slackUsername: text('slack_username'),
		additionalInfo: text('additional_info'),
		hearAboutProgram: text('hear_about_program').notNull(),
		status: varchar('status', { length: 50 }).notNull().default('PENDING'),
		workflowStage: varchar('workflow_stage', { length: 64 })
			.notNull()
			.default('SUBMITTED'),
		decisionAt: timestamp('decision_at'),
		approvedAt: timestamp('approved_at'),
		matchedAt: timestamp('matched_at'),
		activatedAt: timestamp('activated_at'),
		closedAt: timestamp('closed_at'),
		closedReason: text('closed_reason'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		createdAtIdx: index('mentor_applications_created_at_idx').on(
			table.createdAt,
		),
		statusIdx: index('mentor_applications_status_idx').on(table.status),
		workflowStageIdx: index('mentor_applications_workflow_stage_idx').on(
			table.workflowStage,
		),
		userCreatedAtIdx: index('mentor_applications_user_created_at_idx').on(
			table.userId,
			table.createdAt,
		),
	}),
)

// Mentorship matches (mentor <-> mentee pairing)
export const mentorshipMatches = mysqlTable(
	'mentorship_matches',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		fundApplicationId: varchar('fund_application_id', { length: 36 }).notNull(),
		mentorApplicationId: varchar('mentor_application_id', {
			length: 36,
		}).notNull(),
		adminNotes: text('admin_notes'),
		endedAt: timestamp('ended_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		createdAtIdx: index('mentorship_matches_created_at_idx').on(
			table.createdAt,
		),
		fundAppIdx: index('mentorship_matches_fund_app_idx').on(
			table.fundApplicationId,
		),
		mentorAppIdx: index('mentorship_matches_mentor_app_idx').on(
			table.mentorApplicationId,
		),
		openIdx: index('mentorship_matches_open_idx').on(
			table.fundApplicationId,
			table.endedAt,
		),
	}),
)

// Workflow event log for fund + mentor application state transitions and actions.
export const applicationEvents = mysqlTable(
	'application_events',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		applicationId: varchar('application_id', { length: 36 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(), // 'FUND' | 'MENTOR'
		eventType: varchar('event_type', { length: 64 }).notNull(),
		fromStage: varchar('from_stage', { length: 64 }),
		toStage: varchar('to_stage', { length: 64 }),
		actorUserId: varchar('actor_user_id', { length: 36 }),
		actorRole: varchar('actor_role', { length: 32 }).notNull().default('SYSTEM'), // 'ADMIN' | 'ATHLETE' | 'SYSTEM'
		payload: text('payload'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		applicationIdx: index('application_events_application_idx').on(
			table.applicationType,
			table.applicationId,
		),
		eventTypeIdx: index('application_events_event_type_idx').on(table.eventType),
		createdAtIdx: index('application_events_created_at_idx').on(table.createdAt),
	}),
)

// Actionable workflow tasks for admin queueing and assignment.
export const applicationTasks = mysqlTable(
	'application_tasks',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		applicationId: varchar('application_id', { length: 36 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(), // 'FUND' | 'MENTOR'
		taskType: varchar('task_type', { length: 64 }).notNull(),
		title: varchar('title', { length: 255 }).notNull(),
		description: text('description'),
		status: varchar('status', { length: 20 }).notNull().default('OPEN'), // 'OPEN' | 'DONE' | 'CANCELED'
		priority: varchar('priority', { length: 20 }).notNull().default('MEDIUM'), // 'HIGH' | 'MEDIUM' | 'LOW'
		ownerUserId: varchar('owner_user_id', { length: 36 }),
		dueAt: timestamp('due_at'),
		completedAt: timestamp('completed_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		applicationIdx: index('application_tasks_application_idx').on(
			table.applicationType,
			table.applicationId,
		),
		statusIdx: index('application_tasks_status_idx').on(table.status),
		dueAtIdx: index('application_tasks_due_at_idx').on(table.dueAt),
		ownerIdx: index('application_tasks_owner_idx').on(table.ownerUserId),
	}),
)

// Email logs table to track sent emails
export const emailLogs = mysqlTable(
	'email_logs',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		applicationId: varchar('application_id', { length: 36 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(), // 'FUND' or 'MENTOR'
		emailType: varchar('email_type', { length: 20 }).notNull(), // 'APPROVAL', 'REJECTION', 'WAITLIST'
		recipientEmail: text('recipient_email').notNull(),
		status: varchar('status', { length: 20 }).notNull().default('SENT'), // 'SENT' or 'FAILED'
		sentAt: timestamp('sent_at').defaultNow().notNull(),
	},
	(table) => ({
		applicationIdx: index('email_logs_application_idx').on(table.applicationId),
		typeIdx: index('email_logs_type_idx').on(
			table.applicationType,
			table.emailType,
		),
		sentAtIdx: index('email_logs_sent_at_idx').on(table.sentAt),
	}),
)

export const eventRsvps = mysqlTable(
	'event_rsvps',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		eventId: varchar('event_id', { length: 64 }).notNull(),
		userId: varchar('user_id', { length: 36 }).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		eventIdx: index('event_rsvps_event_idx').on(table.eventId),
		userIdx: index('event_rsvps_user_idx').on(table.userId),
		uniqEventUser: index('uniq_event_user').on(table.eventId, table.userId),
	}),
)

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
	user: one(users, {
		fields: [eventRsvps.userId],
		references: [users.id],
	}),
}))

export const eventRsvpAnswers = mysqlTable(
	'event_rsvp_answers',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		eventId: varchar('event_id', { length: 64 }).notNull(),
		userId: varchar('user_id', { length: 36 }).notNull(),
		questionKey: varchar('question_key', { length: 64 }).notNull(),
		answer: text('answer').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		uniqEventUserQuestion: index('uniq_event_user_question').on(
			table.eventId,
			table.userId,
			table.questionKey,
		),
		eventIdx: index('event_rsvp_answers_event_idx').on(table.eventId),
		userIdx: index('event_rsvp_answers_user_idx').on(table.userId),
		questionIdx: index('event_rsvp_answers_question_idx').on(table.questionKey),
	}),
)

export const eventRsvpAnswersRelations = relations(
	eventRsvpAnswers,
	({ one }) => ({
		user: one(users, {
			fields: [eventRsvpAnswers.userId],
			references: [users.id],
		}),
	}),
)

// Define the relations for the users table
export const usersRelations = relations(users, ({ many }) => ({
	fundApplications: many(fundApplications),
	mentorApplications: many(mentorApplications),
	eventRsvps: many(eventRsvps),
	eventRsvpAnswers: many(eventRsvpAnswers),
}))

// Define the relations for the fundApplications table
export const fundApplicationsRelations = relations(
	fundApplications,
	({ one, many }) => ({
		user: one(users, {
			fields: [fundApplications.userId],
			references: [users.id],
		}),
		mentorshipMatches: many(mentorshipMatches),
		events: many(applicationEvents),
		tasks: many(applicationTasks),
	}),
)

// Define the relations for the mentorApplications table
export const mentorApplicationsRelations = relations(
	mentorApplications,
	({ one, many }) => ({
		user: one(users, {
			fields: [mentorApplications.userId],
			references: [users.id],
		}),
		mentorshipMatches: many(mentorshipMatches),
		events: many(applicationEvents),
		tasks: many(applicationTasks),
	}),
)

export const mentorshipMatchesRelations = relations(
	mentorshipMatches,
	({ one }) => ({
		fundApplication: one(fundApplications, {
			fields: [mentorshipMatches.fundApplicationId],
			references: [fundApplications.id],
		}),
		mentorApplication: one(mentorApplications, {
			fields: [mentorshipMatches.mentorApplicationId],
			references: [mentorApplications.id],
		}),
	}),
)

export const applicationEventsRelations = relations(
	applicationEvents,
	({ one }) => ({
		fundApplication: one(fundApplications, {
			fields: [applicationEvents.applicationId],
			references: [fundApplications.id],
		}),
		mentorApplication: one(mentorApplications, {
			fields: [applicationEvents.applicationId],
			references: [mentorApplications.id],
		}),
	}),
)

export const applicationTasksRelations = relations(applicationTasks, ({ one }) => ({
	fundApplication: one(fundApplications, {
		fields: [applicationTasks.applicationId],
		references: [fundApplications.id],
	}),
	mentorApplication: one(mentorApplications, {
		fields: [applicationTasks.applicationId],
		references: [mentorApplications.id],
	}),
}))

// Define the relations for the emailLogs table
export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
	fundApplication: one(fundApplications, {
		fields: [emailLogs.applicationId],
		references: [fundApplications.id],
	}),
	mentorApplication: one(mentorApplications, {
		fields: [emailLogs.applicationId],
		references: [mentorApplications.id],
	}),
}))

// Email presets table for DB-backed composer presets
export const emailPresets = mysqlTable(
	'email_presets',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		key: varchar('key', { length: 64 }).notNull(),
		applicationType: varchar('application_type', { length: 20 }).notNull(), // 'FUND' | 'MENTOR' | 'EVENT'
		category: varchar('category', { length: 20 }).notNull(), // 'STATUS' | 'INVITE' | 'REMINDER' | ...
		status: varchar('status', { length: 20 }), // 'APPROVED' | 'WAITLISTED' | 'REJECTED' (nullable for non-status categories)
		subjectTemplate: text('subject_template').notNull(),
		htmlTemplate: text('html_template').notNull(),
		defaultTokens: text('default_tokens'), // JSON string of default tokens
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		keyIdx: index('email_presets_key_idx').on(table.key),
		typeIdx: index('email_presets_type_idx').on(table.applicationType),
		statusIdx: index('email_presets_status_idx').on(table.status),
		uniqPreset: uniqueIndex('uniq_preset_key_type_status').on(
			table.key,
			table.applicationType,
			table.status,
		),
	}),
)
