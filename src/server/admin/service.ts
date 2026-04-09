import {
	sql,
	and,
	eq,
	gte,
	lt,
	desc,
	ne,
	inArray,
	notInArray,
	type SQL,
} from 'drizzle-orm'
import { type AnyMySqlTable } from 'drizzle-orm/mysql-core'
import {
	db,
	users,
	fundApplications,
	mentorApplications,
} from '@/server/db'

/* =========================================================================================
   Shared Types / Helpers
   ========================================================================================= */

export type PaginationParams = {
	page?: number // 1-based
	pageSize?: number
	showAll?: boolean
}

export type PageResult<T> = {
	items: T[]
	page: number
	pageSize: number
	total: number
	totalPages: number
	hasPrev: boolean
	hasNext: boolean
}

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

function normalizePagination(p: PaginationParams | undefined) {
	const showAll = p?.showAll === true
	const page = Math.max(1, Math.floor(p?.page ?? 1))
	const pageSizeRaw = Math.max(1, Math.floor(p?.pageSize ?? DEFAULT_PAGE_SIZE))
	const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE)
	const offset = (page - 1) * pageSize
	const limit = pageSize
	return { page, pageSize, offset, limit, showAll }
}

/**
 * A generic COUNT(*) helper that returns a number.
 */
async function countFrom(table: AnyMySqlTable, where?: SQL): Promise<number> {
	const rows = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(table)
		.where(where ?? sql`1=1`)

	return rows?.[0]?.value ?? 0
}

/**
 * Utility to compute pagination metadata.
 */
function toPageResult<T>(
	items: T[],
	page: number,
	pageSize: number,
	total: number,
): PageResult<T> {
	const totalPages = Math.max(1, Math.ceil(total / pageSize))
	return {
		items,
		page,
		pageSize,
		total,
		totalPages,
		hasPrev: page > 1,
		hasNext: page < totalPages,
	}
}

/* =========================================================================================
   Users
   ========================================================================================= */

export type UserRow = {
	id: string
	name: string | null
	email: string
	userType: string | null
	age: number | null
	genderIdentity: string | null
	locationRegion: string | null
	onboardingCompleted: boolean
	acceptedCodeOfConduct: boolean
	slackJoined: boolean
	stravaJoined: boolean
	instagramFollowed: boolean
	newsletterSubscribed: boolean
	createdAt: Date
	clerkId: string
}

export type UsersFilters = {
	q?: string // search term (email/name)
	userType?: 'bipoc' | 'ally' | 'other' | string
	onboardingCompleted?: boolean
}

export async function getUsersCounts() {
	const total = await countFrom(users, sql`1=1`)

	// Onboarding completed count
	const onboardingCompleted = await countFrom(
		users,
		eq(users.onboardingCompleted, true),
	)

	// userType counts (common categories)
	const bipoc = await countFrom(users, eq(users.userType, 'bipoc'))
	const ally = await countFrom(users, eq(users.userType, 'ally'))

	return {
		total,
		onboardingCompleted,
		bipoc,
		ally,
	}
}

export async function getUsersPage(
	pagination?: PaginationParams,
	filters?: UsersFilters,
): Promise<PageResult<UserRow>> {
	const { page, pageSize, offset, limit } = normalizePagination(pagination)
	const whereExprs: SQL<unknown>[] = []

	if (filters?.q) {
		const term = `%${filters.q}%`
		// MySQL is case-insensitive by default; use LIKE for simple search
		whereExprs.push(
			sql`${users.email} LIKE ${term} OR ${users.name} LIKE ${term}`,
		)
	}

	if (filters?.userType) {
		whereExprs.push(eq(users.userType, filters.userType))
	}

	if (typeof filters?.onboardingCompleted === 'boolean') {
		whereExprs.push(eq(users.onboardingCompleted, filters.onboardingCompleted))
	}

	const where =
		whereExprs.length > 1 ? and(...whereExprs) : whereExprs[0] || undefined
	const whereSql: SQL = where ?? sql`1=1`

	const countResult = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(users)
		.where(whereSql)
	const total = countResult?.[0]?.value ?? 0

	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			userType: users.userType,
			age: users.age,
			genderIdentity: users.genderIdentity,
			locationRegion: users.locationRegion,
			onboardingCompleted: users.onboardingCompleted,
			acceptedCodeOfConduct: users.acceptedCodeOfConduct,
			slackJoined: users.slackJoined,
			stravaJoined: users.stravaJoined,
			instagramFollowed: users.instagramFollowed,
			newsletterSubscribed: users.newsletterSubscribed,
			createdAt: users.createdAt,
			clerkId: users.clerkId,
		})
		.from(users)
		.where(whereSql)
		.orderBy(desc(users.createdAt))
		.limit(limit)
		.offset(offset)

	return toPageResult(rows, page, pageSize, total)
}

/* =========================================================================================
   Fund Applications
   ========================================================================================= */

export type ApplicationStatus =
	| 'PENDING'
	| 'APPROVED'
	| 'REJECTED'
	| 'WAITLISTED'

export type RegistrationStatus =
	| 'PENDING'
	| 'SELF_REGISTERED'
	| 'ADMIN_REGISTERED'
	| 'COMPLETED'

export type FundApplicationRow = {
	id: string
	name: string
	email: string
	race: string
	raceDate: Date | null
	raceLocation: string | null
	status: ApplicationStatus
	registrationStatus: RegistrationStatus
	workflowStage: string
	createdAt: Date
	userId: string
	reason: string
	firstRace: boolean
	genderIdentity: string
	age: number
	zipcode: string
	goals: string | null
	communityContribution: string
	tierraLibreContribution: string
	bipocIdentity: boolean
	gearNeeds: string | null
	wantsMentor: boolean
	mentorGenderPreference: string | null
	additionalAssistanceNeeds: string | null
}

export type FundApplicationsFilters = {
	q?: string // search (name/email/race)
	status?: ApplicationStatus
	excludeStatus?: ApplicationStatus
	workflowStages?: string[]
	excludeWorkflowStages?: string[]
	firstRace?: boolean
	year?: number // filter by createdAt year
}

export async function getFundApplicationsPage(
	pagination?: PaginationParams,
	filters?: FundApplicationsFilters,
): Promise<PageResult<FundApplicationRow>> {
	const { page, pageSize, offset, limit, showAll } = normalizePagination(pagination)
	const whereExprs: SQL<unknown>[] = []

	if (filters?.q) {
		const term = `%${filters.q}%`
		whereExprs.push(
			sql`(${fundApplications.name} LIKE ${term} OR ${fundApplications.email} LIKE ${term} OR ${fundApplications.race} LIKE ${term})`,
		)
	}

	if (filters?.status) {
		whereExprs.push(eq(fundApplications.status, filters.status))
	}

	if (!filters?.status && filters?.excludeStatus) {
		whereExprs.push(ne(fundApplications.status, filters.excludeStatus))
	}

	if (filters?.workflowStages && filters.workflowStages.length > 0) {
		whereExprs.push(inArray(fundApplications.workflowStage, filters.workflowStages))
	}

	if (filters?.excludeWorkflowStages && filters.excludeWorkflowStages.length > 0) {
		whereExprs.push(
			notInArray(fundApplications.workflowStage, filters.excludeWorkflowStages),
		)
	}

	if (typeof filters?.firstRace === 'boolean') {
		whereExprs.push(eq(fundApplications.firstRace, filters.firstRace))
	}

	if (filters?.year) {
		const start = new Date(filters.year, 0, 1)
		const end = new Date(filters.year + 1, 0, 1)
		whereExprs.push(gte(fundApplications.createdAt, start))
		whereExprs.push(lt(fundApplications.createdAt, end))
	}

	const where =
		whereExprs.length > 1 ? and(...whereExprs) : whereExprs[0] || undefined
	const whereSql: SQL = where ?? sql`1=1`

	const countResult = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(fundApplications)
		.where(whereSql)
	const total = countResult?.[0]?.value ?? 0

	const rowsQuery = db
		.select({
			id: fundApplications.id,
			name: fundApplications.name,
			email: fundApplications.email,
			race: fundApplications.race,
			raceDate: fundApplications.raceDate,
			raceLocation: fundApplications.raceLocation,
			status: fundApplications.status,
			registrationStatus: fundApplications.registrationStatus,
			workflowStage: fundApplications.workflowStage,
			createdAt: fundApplications.createdAt,
			userId: fundApplications.userId,
			reason: fundApplications.reason,
			firstRace: fundApplications.firstRace,
			genderIdentity: fundApplications.genderIdentity,
			age: fundApplications.age,
			zipcode: fundApplications.zipcode,
			goals: fundApplications.goals,
			communityContribution: fundApplications.communityContribution,
			tierraLibreContribution: fundApplications.tierraLibreContribution,
			bipocIdentity: fundApplications.bipocIdentity,
			gearNeeds: fundApplications.gearNeeds,
			wantsMentor: fundApplications.wantsMentor,
			mentorGenderPreference: fundApplications.mentorGenderPreference,
			additionalAssistanceNeeds: fundApplications.additionalAssistanceNeeds,
		})
		.from(fundApplications)
		.where(whereSql)
		.orderBy(desc(fundApplications.createdAt))

	const rows = showAll
		? await rowsQuery
		: await rowsQuery.limit(limit).offset(offset)

	const typedRows: FundApplicationRow[] = rows.map((r) => ({
		...r,
		status: r.status as ApplicationStatus,
		registrationStatus: r.registrationStatus as RegistrationStatus,
	}))
	return toPageResult(typedRows, page, pageSize, total)
}

/* =========================================================================================
   Mentor Applications
   ========================================================================================= */

export type MentorApplicationRow = {
	id: string
	name: string
	email: string
	status: ApplicationStatus
	workflowStage: string
	createdAt: Date
	userId: string
	motivationToMentor: string
	preferredCommunicationStyle: string
	mentorGenderPreference: string | null
	availability: string
	specialExpertise: string | null
	additionalInfo: string | null
	hearAboutProgram: string
	mentorshipExperience: string | null
}

export type MentorApplicationsFilters = {
	q?: string // search (name/email)
	status?: ApplicationStatus
	year?: number
}

export async function getMentorApplicationsCounts(args?: { year?: number }) {
	const total = await countFrom(mentorApplications, sql`1=1`)

	const pending = await countFrom(
		mentorApplications,
		eq(mentorApplications.status, 'PENDING'),
	)
	const approved = await countFrom(
		mentorApplications,
		eq(mentorApplications.status, 'APPROVED'),
	)
	const rejected = await countFrom(
		mentorApplications,
		eq(mentorApplications.status, 'REJECTED'),
	)
	const waitlisted = await countFrom(
		mentorApplications,
		eq(mentorApplications.status, 'WAITLISTED'),
	)

	let yearCount = 0
	if (args?.year) {
		const start = new Date(args.year, 0, 1)
		const end = new Date(args.year + 1, 0, 1)
		yearCount = await countFrom(
			mentorApplications,
			and(
				gte(mentorApplications.createdAt, start),
				lt(mentorApplications.createdAt, end),
			),
		)
	}

	return {
		total,
		pending,
		approved,
		rejected,
		waitlisted,
		yearCount,
	}
}

export async function getMentorApplicationsPage(
	pagination?: PaginationParams,
	filters?: MentorApplicationsFilters,
): Promise<PageResult<MentorApplicationRow>> {
	const { page, pageSize, offset, limit } = normalizePagination(pagination)
	const whereExprs: SQL<unknown>[] = []

	if (filters?.q) {
		const term = `%${filters.q}%`
		whereExprs.push(
			sql`(${mentorApplications.name} LIKE ${term} OR ${mentorApplications.email} LIKE ${term})`,
		)
	}

	if (filters?.status) {
		whereExprs.push(eq(mentorApplications.status, filters.status))
	}

	if (filters?.year) {
		const start = new Date(filters.year, 0, 1)
		const end = new Date(filters.year + 1, 0, 1)
		whereExprs.push(gte(mentorApplications.createdAt, start))
		whereExprs.push(lt(mentorApplications.createdAt, end))
	}

	const where =
		whereExprs.length > 1 ? and(...whereExprs) : whereExprs[0] || undefined
	const whereSql: SQL = where ?? sql`1=1`

	const countResult = await db
		.select({ value: sql<number>`count(*)`.mapWith(Number) })
		.from(mentorApplications)
		.where(whereSql)
	const total = countResult?.[0]?.value ?? 0

	const rows = await db
		.select({
			id: mentorApplications.id,
			name: mentorApplications.name,
			email: mentorApplications.email,
			status: mentorApplications.status,
			workflowStage: mentorApplications.workflowStage,
			createdAt: mentorApplications.createdAt,
			userId: mentorApplications.userId,
			motivationToMentor: mentorApplications.motivationToMentor,
			preferredCommunicationStyle:
				mentorApplications.preferredCommunicationStyle,
			mentorGenderPreference: mentorApplications.mentorGenderPreference,
			availability: mentorApplications.availability,
			specialExpertise: mentorApplications.specialExpertise,
			additionalInfo: mentorApplications.additionalInfo,
			hearAboutProgram: mentorApplications.hearAboutProgram,
			mentorshipExperience: mentorApplications.mentorshipExperience,
		})
		.from(mentorApplications)
		.where(whereSql)
		.orderBy(desc(mentorApplications.createdAt))
		.limit(limit)
		.offset(offset)

	const typedRows: MentorApplicationRow[] = rows.map((r) => ({
		...r,
		status: r.status as ApplicationStatus,
	}))
	return toPageResult(typedRows, page, pageSize, total)
}

/* =========================================================================================
   Suggested Indexes (for migrations) - Documentation only
   =========================================================================================
   Add these in your DB migrations to improve performance at scale:
   - users: INDEX users_created_at_idx (created_at), INDEX users_email_idx (email)
   - fund_applications: (already present) created_at, status, (user_id, created_at)
   - mentor_applications: (already present) created_at, status, (user_id, created_at)
*/
