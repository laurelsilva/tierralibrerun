import { type RaceSeriesListItem } from '@/lib/sanity/types'

export interface RacesByMonth {
	[monthYear: string]: RaceSeriesListItem[]
}

export function groupRacesByMonth(races: RaceSeriesListItem[]): RacesByMonth {
	return races.reduce((acc, series) => {
		const date = new Date(series.date)
		const monthYear = date.toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric',
		})

		if (!acc[monthYear]) {
			acc[monthYear] = []
		}
		acc[monthYear].push(series)
		return acc
	}, {} as RacesByMonth)
}

export function sortMonthsChronologically(
	racesByMonth: RacesByMonth,
): string[] {
	return Object.keys(racesByMonth).sort((a, b) => {
		const dateA =
			racesByMonth[a] && racesByMonth[a][0]
				? new Date(racesByMonth[a][0].date)
				: new Date(0)
		const dateB =
			racesByMonth[b] && racesByMonth[b][0]
				? new Date(racesByMonth[b][0].date)
				: new Date(0)
		return dateA.getTime() - dateB.getTime()
	})
}

export function formatRaceDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

export function formatRaceDateShort(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}
