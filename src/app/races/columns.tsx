'use client'

import { type ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import CompanyLogo from '@/components/company-logo'
import { Badge } from '@/components/ui/badge'
import {
	type RaceSeriesListItem,
	type RaceDistanceListItem,
} from '@/lib/sanity/types'

function formatDistance(d: RaceDistanceListItem): string {
	if (d.timeBased) {
		return d.timeDurationHours !== undefined && d.timeDurationHours !== null
			? `${d.timeDurationHours} hr`
			: 'Timed'
	}
	if (d.distanceKm !== undefined && d.distanceKm !== null) {
		const miles = d.distanceMiles ?? d.courseDistance
		return miles
			? `${d.distanceKm} km / ${Number(miles).toFixed(1)} mi`
			: `${d.distanceKm} km`
	}
	if (d.distanceMiles !== undefined && d.distanceMiles !== null) {
		return `${d.distanceMiles} mi`
	}
	if (d.courseDistance !== undefined && d.courseDistance !== null) {
		return `${d.courseDistance} miles`
	}
	return d.distance
}

export const columns: ColumnDef<RaceSeriesListItem>[] = [
	{
		accessorKey: 'date',
		header: 'Date',
		cell: ({ row }) => {
			const date = new Date(row.original.date)
			return (
				<div className="flex flex-col gap-1">
					<div className="text-foreground text-base font-semibold">
						{date.toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
						})}
					</div>
					<div className="text-muted-foreground text-sm">
						{date.toLocaleDateString('en-US', {
							year: 'numeric',
						})}
					</div>
				</div>
			)
		},
		sortingFn: (rowA, rowB) => {
			const dateA = new Date(rowA.original.date)
			const dateB = new Date(rowB.original.date)
			return dateA.getTime() - dateB.getTime()
		},
		size: 110,
	},
	{
		accessorKey: 'name',
		header: 'Race',
		cell: ({ row }) => {
			const race = row.original
			return (
				<div className="flex flex-col gap-2.5" style={{ minWidth: 240 }}>
					<Link
						href={`/races/${race.slug}`}
						className="text-foreground hover:text-primary text-base font-semibold transition-colors"
					>
						{race.name}
					</Link>
					<div className="flex flex-wrap gap-1.5">
						{race.terrain && (
							<Badge
								variant="secondary"
								className="px-2 py-0.5 text-xs font-normal capitalize"
							>
								{race.terrain}
							</Badge>
						)}
					</div>
				</div>
			)
		},
		size: 320,
	},
	{
		accessorKey: 'company',
		header: 'Organizer',
		cell: ({ row }) => {
			const company = row.original.company
			if (!company)
				return <span className="text-muted-foreground text-sm">—</span>
			return (
				<div className="flex items-center gap-3" style={{ minWidth: 180 }}>
					<div className="shrink-0">
						<CompanyLogo
							logo={company.logo}
							companyName={company.name}
							width={40}
							height={40}
						/>
					</div>
					<Link
						href={`/companies/${company.slug}`}
						className="text-foreground hover:text-primary text-sm font-medium transition-colors"
					>
						{company.name}
					</Link>
				</div>
			)
		},
		size: 240,
	},
	{
		accessorKey: 'location',
		header: 'Location',
		cell: ({ row }) => {
			return (
				<div className="text-foreground text-sm" style={{ minWidth: 140 }}>
					{row.original.location}
				</div>
			)
		},
		size: 200,
	},
	{
		id: 'distances',
		accessorKey: 'distances',
		header: 'Distances',
		cell: ({ row }) => {
			const distances = row.original.distances
			if (!distances || distances.length === 0) {
				return <span className="text-muted-foreground text-sm">—</span>
			}
			return (
				<div
					className="text-foreground text-sm leading-relaxed"
					style={{ minWidth: 160 }}
				>
					{distances.map((d) => formatDistance(d)).join(' · ')}
				</div>
			)
		},
		size: 220,
	},
]
