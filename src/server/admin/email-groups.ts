import 'server-only'
import { eq, inArray, sql } from 'drizzle-orm'
import { client } from '@/lib/sanity/client'
import { db, fundApplications, mentorApplications, users } from '@/server/db'
import { syncPastRaceFundApplications } from '@/server/workflow/service'

export interface Recipient {
	id: string
	name: string
	email: string
	race?: string
	raceSeries?: string
	raceDate?: Date | null
}

export interface RaceGroup {
	raceName: string
	raceDate: Date | null
	athletes: Recipient[]
}

export type GroupId =
	| 'active-athletes'
	| 'active-by-race-series'
	| 'no-longer-active-athletes'
	| 'no-show-or-dropped-athletes'
	| 'active-mentors'
	| 'newsletter'

interface SanityRaceDistance {
	distance: string | null
	seriesName: string | null
	seriesDate: string | null
}

interface RaceDistanceEntry {
	date: Date | null
	seriesName: string
}

export interface FundLifecycleGroups {
	activeAthletes: Recipient[]
	activeRaceGroups: RaceGroup[]
	noLongerActiveAthletes: Recipient[]
	noShowOrDroppedAthletes: Recipient[]
}

const NINE_MONTHS_MS = 9 * 30 * 24 * 60 * 60 * 1000

async function buildRaceDistanceDateMap(): Promise<
	Map<string, RaceDistanceEntry>
> {
	const distances: SanityRaceDistance[] = await client.fetch(`
		*[_type == "raceDistance"] {
			distance,
			"seriesName": raceSeries->name,
			"seriesDate": raceSeries->date
		}
	`)

	const map = new Map<string, RaceDistanceEntry>()
	for (const d of distances) {
		if (!d.seriesName || !d.distance) continue
		const key = `${d.seriesName} - ${d.distance}`
		const parsed =
			d.seriesDate && typeof d.seriesDate === 'string'
				? new Date(d.seriesDate)
				: null
		const date = parsed && !isNaN(parsed.getTime()) ? parsed : null
		map.set(key, { date, seriesName: d.seriesName })
	}
	return map
}

function resolveEditionDate(
	dbRaceDate: Date | null | undefined,
	sanityDate: Date | null,
	createdAt: Date,
	now: Date,
): Date | null {
	if (dbRaceDate) return dbRaceDate
	if (!sanityDate) return null
	if (sanityDate < now) return sanityDate

	const gapMs = sanityDate.getTime() - createdAt.getTime()
	if (gapMs > NINE_MONTHS_MS) return null
	return sanityDate
}

function groupByRace(recipients: Recipient[]): RaceGroup[] {
	const grouped = new Map<string, RaceGroup>()
	for (const athlete of recipients) {
		const key = athlete.raceSeries || athlete.race || 'Unknown Race'
		const existing = grouped.get(key)
		if (existing) {
			existing.athletes.push(athlete)
		} else {
			grouped.set(key, {
				raceName: key,
				raceDate: athlete.raceDate ?? null,
				athletes: [athlete],
			})
		}
	}
	return Array.from(grouped.values()).sort((a, b) => {
		if (!a.raceDate) return 1
		if (!b.raceDate) return -1
		return a.raceDate.getTime() - b.raceDate.getTime()
	})
}

export async function getFundLifecycleGroups(): Promise<FundLifecycleGroups> {
	await syncPastRaceFundApplications()

	const [rows, sanityMap] = await Promise.all([
		db
			.select({
				id: fundApplications.id,
				name: fundApplications.name,
				email: fundApplications.email,
				race: fundApplications.race,
				dbRaceDate: fundApplications.raceDate,
				createdAt: fundApplications.createdAt,
				workflowStage: fundApplications.workflowStage,
			})
			.from(fundApplications)
			.where(
				inArray(fundApplications.workflowStage, [
					'REGISTERED',
					'ONBOARDING_IN_PROGRESS',
					'ACTIVE_IN_PROGRAM',
					'NO_LONGER_ACTIVE',
					'NO_SHOW_OR_DROPPED',
				]),
			),
		buildRaceDistanceDateMap(),
	])

	const now = new Date()
	const all = rows.map((r) => {
		const entry = r.race ? (sanityMap.get(r.race) ?? null) : null
		const sanityDate = entry?.date ?? null
		const raceDate = resolveEditionDate(
			r.dbRaceDate,
			sanityDate,
			r.createdAt,
			now,
		)
		return {
			id: r.id,
			name: typeof r.name === 'string' ? r.name : '',
			email: typeof r.email === 'string' ? r.email : '',
			race: r.race ?? undefined,
			raceSeries: entry?.seriesName,
			raceDate,
			workflowStage: r.workflowStage,
		}
	})

	const activeAthletes = all
		.filter(
			(a) =>
				(a.workflowStage === 'REGISTERED' ||
					a.workflowStage === 'ONBOARDING_IN_PROGRESS' ||
					a.workflowStage === 'ACTIVE_IN_PROGRAM') &&
				(!a.raceDate || a.raceDate >= now),
		)
		.map(({ workflowStage: _ignoredStage, ...rest }) => rest)

	const noLongerActiveAthletes = all
		.filter((a) => a.workflowStage === 'NO_LONGER_ACTIVE')
		.map(({ workflowStage: _ignoredStage, ...rest }) => rest)

	const noShowOrDroppedAthletes = all
		.filter((a) => a.workflowStage === 'NO_SHOW_OR_DROPPED')
		.map(({ workflowStage: _ignoredStage, ...rest }) => rest)

	return {
		activeAthletes,
		activeRaceGroups: groupByRace(activeAthletes),
		noLongerActiveAthletes,
		noShowOrDroppedAthletes,
	}
}

export async function getActiveMentors(): Promise<Recipient[]> {
	const rows = await db
		.select({
			id: mentorApplications.id,
			name: mentorApplications.name,
			email: mentorApplications.email,
		})
		.from(mentorApplications)
		.where(
			inArray(mentorApplications.workflowStage, [
				'APPROVED_POOL',
				'MATCH_PENDING',
				'MATCHED',
				'ACTIVE',
			]),
		)
		.orderBy(sql`${mentorApplications.name} ASC`)

	return rows.map((r) => ({
		id: r.id,
		name: typeof r.name === 'string' ? r.name : '',
		email: typeof r.email === 'string' ? r.email : '',
	}))
}

export async function getNewsletterSubscribers(): Promise<Recipient[]> {
	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
		})
		.from(users)
		.where(eq(users.newsletterSubscribed, true))
		.orderBy(sql`${users.createdAt} DESC`)

	return rows.map((r) => ({
		id: r.id,
		name: r.name || '',
		email: r.email,
	}))
}

export async function getRecipientsForGroup(
	groupId: GroupId,
	raceFilter?: string,
): Promise<{ recipients: Recipient[]; raceGroups?: RaceGroup[] }> {
	if (groupId === 'active-athletes') {
		const lifecycle = await getFundLifecycleGroups()
		return { recipients: lifecycle.activeAthletes }
	}

	if (groupId === 'active-by-race-series') {
		const lifecycle = await getFundLifecycleGroups()
		const raceGroups = lifecycle.activeRaceGroups
		if (raceFilter) {
			const match = raceGroups.find((g) => g.raceName === raceFilter)
			return {
				recipients: match?.athletes ?? [],
				raceGroups,
			}
		}
		return { recipients: raceGroups.flatMap((g) => g.athletes), raceGroups }
	}

	if (groupId === 'no-longer-active-athletes') {
		const lifecycle = await getFundLifecycleGroups()
		return { recipients: lifecycle.noLongerActiveAthletes }
	}

	if (groupId === 'no-show-or-dropped-athletes') {
		const lifecycle = await getFundLifecycleGroups()
		return { recipients: lifecycle.noShowOrDroppedAthletes }
	}

	if (groupId === 'active-mentors') {
		return { recipients: await getActiveMentors() }
	}

	if (groupId === 'newsletter') {
		return { recipients: await getNewsletterSubscribers() }
	}

	return { recipients: [] }
}
