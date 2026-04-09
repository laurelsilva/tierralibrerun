import { and, asc, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import {
	MentorPairingStudio,
	type PairingAthlete,
	type PairingMentor,
} from './pairing-studio'
import { getAvatarUrlFromClerkId } from '@/server/clerk/avatar'
import {
	db,
	fundApplications,
	mentorApplications,
	mentorshipMatches,
	users,
} from '@/server/db'

const ASSIGNABLE_FUND_STAGES = [
	'AWAITING_CONFIRMATION',
	'CONFIRMED',
	'REGISTRATION_IN_PROGRESS',
	'REGISTERED',
	'ONBOARDING_IN_PROGRESS',
	'ACTIVE_IN_PROGRAM',
] as const

const ACTIVE_MENTOR_STAGES = [
	'APPROVED_POOL',
	'MATCH_PENDING',
	'MATCHED',
	'ACTIVE',
] as const

async function resolveAvatarUrl(
	profileImageUrl?: string | null,
	clerkId?: string | null,
) {
	if (profileImageUrl) return profileImageUrl
	return getAvatarUrlFromClerkId(clerkId)
}

function sortAthletes(left: PairingAthlete, right: PairingAthlete) {
	if (left.currentMentor && !right.currentMentor) return 1
	if (!left.currentMentor && right.currentMentor) return -1
	if (left.wantsMentor !== right.wantsMentor) return left.wantsMentor ? -1 : 1

	const leftDate = left.raceDate
		? new Date(left.raceDate).getTime()
		: Number.MAX_SAFE_INTEGER
	const rightDate = right.raceDate
		? new Date(right.raceDate).getTime()
		: Number.MAX_SAFE_INTEGER
	if (leftDate !== rightDate) return leftDate - rightDate

	return left.name.localeCompare(right.name)
}

export default async function MentorPairingsPage() {
	const [mentorRows, athleteRows, pastMatchRows] = await Promise.all([
		db
			.select({
				mentorApplicationId: mentorApplications.id,
				mentorUserId: mentorApplications.userId,
				mentorName: mentorApplications.name,
				mentorEmail: mentorApplications.email,
				mentorWorkflowStage: mentorApplications.workflowStage,
				mentorGenderIdentity: mentorApplications.genderIdentity,
				mentorGenderPreference: mentorApplications.mentorGenderPreference,
				mentorSpecialExpertise: mentorApplications.specialExpertise,
				mentorPreferredCommunicationStyle:
					mentorApplications.preferredCommunicationStyle,
				mentorLocationRegion: users.locationRegion,
				mentorProfileImageUrl: users.profileImageUrl,
				mentorClerkId: users.clerkId,
				matchId: mentorshipMatches.id,
				matchedAt: mentorshipMatches.createdAt,
				athleteApplicationId: fundApplications.id,
				athleteUserId: fundApplications.userId,
				athleteName: fundApplications.name,
				athleteRace: fundApplications.race,
				athleteRaceDate: fundApplications.raceDate,
				athleteWantsMentor: fundApplications.wantsMentor,
			})
			.from(mentorApplications)
			.leftJoin(users, eq(users.id, mentorApplications.userId))
			.leftJoin(
				mentorshipMatches,
				and(
					eq(mentorshipMatches.mentorApplicationId, mentorApplications.id),
					isNull(mentorshipMatches.endedAt),
				),
			)
			.leftJoin(
				fundApplications,
				eq(fundApplications.id, mentorshipMatches.fundApplicationId),
			)
			.where(
				and(
					eq(mentorApplications.status, 'APPROVED'),
					inArray(mentorApplications.workflowStage, [...ACTIVE_MENTOR_STAGES]),
				),
			)
			.orderBy(asc(mentorApplications.name), desc(mentorshipMatches.createdAt)),
		db
			.select({
				athleteApplicationId: fundApplications.id,
				athleteUserId: fundApplications.userId,
				athleteName: fundApplications.name,
				athleteEmail: fundApplications.email,
				athleteRace: fundApplications.race,
				athleteRaceDate: fundApplications.raceDate,
				athleteWorkflowStage: fundApplications.workflowStage,
				athleteGenderIdentity: fundApplications.genderIdentity,
				athleteMentorPreference: fundApplications.mentorGenderPreference,
				athleteWantsMentor: fundApplications.wantsMentor,
				athleteLocationRegion: users.locationRegion,
				athleteProfileImageUrl: users.profileImageUrl,
				athleteClerkId: users.clerkId,
			})
			.from(fundApplications)
			.leftJoin(users, eq(users.id, fundApplications.userId))
			.where(
				and(
					inArray(fundApplications.workflowStage, [...ASSIGNABLE_FUND_STAGES]),
					eq(fundApplications.wantsMentor, true),
				),
			)
			.orderBy(asc(fundApplications.raceDate), asc(fundApplications.name)),
		// Past (ended) mentorship matches for history
		db
			.select({
				mentorApplicationId: mentorshipMatches.mentorApplicationId,
				matchedAt: mentorshipMatches.createdAt,
				endedAt: mentorshipMatches.endedAt,
				athleteApplicationId: fundApplications.id,
				athleteUserId: fundApplications.userId,
				athleteName: fundApplications.name,
				athleteRace: fundApplications.race,
				athleteRaceDate: fundApplications.raceDate,
			})
			.from(mentorshipMatches)
			.innerJoin(
				fundApplications,
				eq(fundApplications.id, mentorshipMatches.fundApplicationId),
			)
			.innerJoin(
				mentorApplications,
				and(
					eq(
						mentorApplications.id,
						mentorshipMatches.mentorApplicationId,
					),
					eq(mentorApplications.status, 'APPROVED'),
					inArray(mentorApplications.workflowStage, [
						...ACTIVE_MENTOR_STAGES,
					]),
				),
			)
			.where(isNotNull(mentorshipMatches.endedAt))
			.orderBy(desc(mentorshipMatches.endedAt)),
	])

	const mentorAvatarByApplicationId = new Map<string, string | null>()
	await Promise.all(
		Array.from(
			new Map(
				mentorRows.map((row) => [
					row.mentorApplicationId,
					{
						profileImageUrl: row.mentorProfileImageUrl,
						clerkId: row.mentorClerkId,
					},
				]),
			).entries(),
		).map(async ([applicationId, value]) => {
			mentorAvatarByApplicationId.set(
				applicationId,
				await resolveAvatarUrl(value.profileImageUrl, value.clerkId),
			)
		}),
	)

	const athleteAvatarByApplicationId = new Map<string, string | null>()
	await Promise.all(
		athleteRows.map(async (row) => {
			athleteAvatarByApplicationId.set(
				row.athleteApplicationId,
				await resolveAvatarUrl(row.athleteProfileImageUrl, row.athleteClerkId),
			)
		}),
	)

	// Build past athletes lookup by mentor application ID
	const pastAthletesByMentorId = new Map<
		string,
		PairingMentor['pastAthletes']
	>()
	// Collect past athlete application IDs for avatar resolution
	const pastAthleteAppIds = new Set<string>()
	for (const row of pastMatchRows) {
		if (row.athleteApplicationId && row.athleteName) {
			pastAthleteAppIds.add(row.athleteApplicationId)
		}
	}

	const currentMentorByAthleteApplicationId = new Map<
		string,
		{
			applicationId: string
			name: string
			avatarUrl: string | null
			matchedAt: Date | null
		}
	>()

	const mentorsById = new Map<string, PairingMentor>()
	const activeMentorUserIds = new Set<string>()

	for (const row of mentorRows) {
		activeMentorUserIds.add(row.mentorUserId)

		const mentor = mentorsById.get(row.mentorApplicationId) ?? {
			applicationId: row.mentorApplicationId,
			userId: row.mentorUserId,
			name: row.mentorName,
			email: row.mentorEmail,
			workflowStage: row.mentorWorkflowStage,
			genderIdentity: row.mentorGenderIdentity,
			mentorGenderPreference: row.mentorGenderPreference,
			specialExpertise: row.mentorSpecialExpertise,
			preferredCommunicationStyle: row.mentorPreferredCommunicationStyle,
			locationRegion: row.mentorLocationRegion,
			avatarUrl:
				mentorAvatarByApplicationId.get(row.mentorApplicationId) ?? null,
			currentAthletes: [],
			pastAthletes: [],
		}

		if (!mentorsById.has(row.mentorApplicationId)) {
			mentorsById.set(row.mentorApplicationId, mentor)
		}

		// Build past athletes for this mentor (once per mentor)
		// Exclude matches that lasted less than 24 hours (admin corrections, not real mentorships)
		if (!pastAthletesByMentorId.has(row.mentorApplicationId)) {
			const MIN_MENTORSHIP_DURATION_MS = 24 * 60 * 60 * 1000
			const pastRows = pastMatchRows.filter(
				(pr) => pr.mentorApplicationId === row.mentorApplicationId,
			)
			pastAthletesByMentorId.set(
				row.mentorApplicationId,
				pastRows
					.filter((pr) => {
						if (!pr.athleteApplicationId || !pr.athleteName) return false
						if (pr.matchedAt && pr.endedAt) {
							const duration =
								new Date(pr.endedAt).getTime() -
								new Date(pr.matchedAt).getTime()
							if (duration < MIN_MENTORSHIP_DURATION_MS) return false
						}
						return true
					})
					.map((pr) => ({
						applicationId: pr.athleteApplicationId!,
						userId: pr.athleteUserId!,
						name: pr.athleteName!,
						race: pr.athleteRace || 'Race TBD',
						raceDate: pr.athleteRaceDate,
						avatarUrl:
							athleteAvatarByApplicationId.get(pr.athleteApplicationId!) ??
							null,
						matchedAt: pr.matchedAt,
						endedAt: pr.endedAt,
					})),
			)
		}

		if (
			row.matchId &&
			row.athleteApplicationId &&
			row.athleteUserId &&
			row.athleteName &&
			!mentor.currentAthletes.some(
				(a) => a.applicationId === row.athleteApplicationId,
			)
		) {
			mentor.currentAthletes.push({
				applicationId: row.athleteApplicationId,
				userId: row.athleteUserId,
				name: row.athleteName,
				race: row.athleteRace || 'Race TBD',
				raceDate: row.athleteRaceDate,
				wantsMentor: Boolean(row.athleteWantsMentor),
				avatarUrl:
					athleteAvatarByApplicationId.get(row.athleteApplicationId) ?? null,
				matchedAt: row.matchedAt,
			})

			currentMentorByAthleteApplicationId.set(row.athleteApplicationId, {
				applicationId: row.mentorApplicationId,
				name: row.mentorName,
				avatarUrl:
					mentorAvatarByApplicationId.get(row.mentorApplicationId) ?? null,
				matchedAt: row.matchedAt,
			})
		}
	}

	const mentors = Array.from(mentorsById.values())
		.map((mentor) => ({
			...mentor,
			currentAthletes: mentor.currentAthletes.sort((left, right) => {
				const leftDate = left.raceDate
					? new Date(left.raceDate).getTime()
					: Number.MAX_SAFE_INTEGER
				const rightDate = right.raceDate
					? new Date(right.raceDate).getTime()
					: Number.MAX_SAFE_INTEGER
				if (leftDate !== rightDate) return leftDate - rightDate
				return left.name.localeCompare(right.name)
			}),
			pastAthletes: (
				pastAthletesByMentorId.get(mentor.applicationId) ?? []
			).filter(
				(past) =>
					!mentor.currentAthletes.some(
						(current) => current.userId === past.userId,
					),
			),
		}))
		.sort(
			(left, right) =>
				left.currentAthletes.length - right.currentAthletes.length ||
				left.name.localeCompare(right.name),
		)

	const athletes = athleteRows
		.filter((row) => !activeMentorUserIds.has(row.athleteUserId))
		.map((row) => ({
			applicationId: row.athleteApplicationId,
			userId: row.athleteUserId,
			name: row.athleteName,
			email: row.athleteEmail,
			race: row.athleteRace,
			raceDate: row.athleteRaceDate,
			workflowStage: row.athleteWorkflowStage,
			genderIdentity: row.athleteGenderIdentity,
			mentorGenderPreference: row.athleteMentorPreference,
			wantsMentor: Boolean(row.athleteWantsMentor),
			locationRegion: row.athleteLocationRegion,
			avatarUrl:
				athleteAvatarByApplicationId.get(row.athleteApplicationId) ?? null,
			currentMentor:
				currentMentorByAthleteApplicationId.get(row.athleteApplicationId) ??
				null,
		}))
		.sort(sortAthletes)

	return (
		<MentorPairingStudio initialMentors={mentors} initialAthletes={athletes} />
	)
}
