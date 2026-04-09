import {Suspense} from 'react'
import {RacesPageClient} from './races-page-client'
import {generateRacesMetadata} from '@/lib/metadata'
import {getUpcomingRaceSeries} from '@/lib/sanity/queries'

export const revalidate = 60

export async function generateMetadata() {
	const raceSeries = await getUpcomingRaceSeries()
	return generateRacesMetadata(raceSeries)
}

function RacesPageFallback() {
	return (
		<div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-foreground mb-4 text-3xl font-bold sm:text-4xl lg:text-6xl">
					Upcoming Races
				</h1>
				<p className="text-muted-foreground text-base sm:text-lg">Loading races...</p>
			</div>
			<div className="animate-pulse">
				<div className="bg-muted mb-6 h-32 rounded-lg"></div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="bg-muted h-64 rounded-lg"></div>
					))}
				</div>
			</div>
		</div>
	)
}

export default async function RacesPage() {
	const raceSeries = await getUpcomingRaceSeries()

	return (
		<Suspense fallback={<RacesPageFallback />}>
			<RacesPageClient initialRaces={raceSeries} />
		</Suspense>
	)
}
