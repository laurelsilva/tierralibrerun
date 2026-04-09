'use client'

import * as React from 'react'
import { columns } from './columns'
import { RaceSearch } from '@/components/race-search'
import { RacesTable } from '@/components/races-table'
import { type RaceSeriesListItem } from '@/lib/sanity/types'

interface RacesPageClientProps {
	initialRaces: RaceSeriesListItem[]
}

export function RacesPageClient({ initialRaces }: RacesPageClientProps) {
	const [filteredRaces, setFilteredRaces] = React.useState(initialRaces)

	return (
		<div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-foreground mb-4 text-3xl font-bold sm:text-4xl lg:text-6xl">
					Athlete Fund Races
				</h1>
				<p className="text-muted-foreground text-base sm:text-lg">
					Browse and filter upcoming Athlete Fund–supported races.
				</p>
			</div>

			<RaceSearch
				races={initialRaces}
				onFilteredRacesAction={setFilteredRaces}
			/>

			<RacesTable races={filteredRaces} columns={columns} />
		</div>
	)
}
