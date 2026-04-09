'use client'

import {
	Search,
	X,
	Filter,
	Calendar,
	Building2,
	Keyboard,
	RefreshCw,
	Ruler,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import CompanyLogo from '@/components/company-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { useSearchAnalytics } from '@/lib/hooks/use-search-analytics'
import {
	type RaceSeriesListItem,
	type RaceDistanceListItem,
} from '@/lib/sanity/types'

export interface RaceSearchProps {
	races: RaceSeriesListItem[]
	onFilteredRacesAction: (races: RaceSeriesListItem[]) => void
	onRefresh?: () => void
}

interface SearchFilters {
	searchTerm: string
	company: string
	dateRange: string
	distance: string
}

const DATE_RANGE_OPTIONS = [
	{ value: 'next-month', label: 'Next Month' },
	{ value: 'next-3-months', label: 'Next 3 Months' },
	{ value: 'next-6-months', label: 'Next 6 Months' },
	{ value: 'this-year', label: 'This Year' },
]

type DistanceOption = { value: string; label: string; sortKey: number }

function buildDistanceOption(
	distance: RaceDistanceListItem,
): DistanceOption | null {
	if (distance.timeBased) {
		const hours = distance.timeDurationHours
		if (hours === undefined || hours === null) return null
		return {
			value: `time:${hours}`,
			label: `${hours} hr timed`,
			sortKey: 100000 + hours,
		}
	}

	const km =
		distance.distanceKm ??
		(distance.distanceMiles ? distance.distanceMiles * 1.60934 : null)
	const miles =
		distance.distanceMiles ??
		(distance.distanceKm ? distance.distanceKm * 0.621371 : null)
	const label = km
		? `${km} km${miles ? ` / ${miles.toFixed(1)} mi` : ''}`
		: miles
			? `${miles} mi`
			: distance.distance?.trim() || 'Distance'
	return {
		value:
			km !== null && km !== undefined
				? `km:${km}`
				: miles !== null && miles !== undefined
					? `mi:${miles}`
					: `label:${label}`,
		label,
		sortKey: km ?? (miles ? miles * 1.60934 : Number.MAX_SAFE_INTEGER),
	}
}

export function RaceSearch({
	races,
	onFilteredRacesAction,
	onRefresh,
}: RaceSearchProps) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const analytics = useSearchAnalytics()

	const [filters, setFilters] = React.useState<SearchFilters>({
		searchTerm: '',
		company: '',
		dateRange: '',
		distance: '',
	})

	const [isExpanded, setIsExpanded] = React.useState(false)
	const [isSearching, setIsSearching] = React.useState(false)
	const searchInputRef = React.useRef<HTMLInputElement>(null)

	const debouncedSearchTerm = useDebouncedValue(filters.searchTerm, 300)

	React.useEffect(() => {
		const urlFilters: SearchFilters = {
			searchTerm: searchParams.get('search') || '',
			company: searchParams.get('company') || '',
			dateRange: searchParams.get('date') || '',
			distance: searchParams.get('distance') || '',
		}

		setFilters(urlFilters)

		const hasUrlFilters = Object.values(urlFilters).some(Boolean)
		if (hasUrlFilters) {
			setIsExpanded(true)
		}
	}, [searchParams])

	const companies = React.useMemo(() => {
		const companyMap = new Map<
			string,
			{ name: string; logo?: { asset: { _id: string; url: string } } }
		>()
		races.forEach((race) => {
			if (race.company?.name) {
				companyMap.set(race.company.name, {
					name: race.company.name,
					logo: race.company.logo,
				})
			}
		})
		return Array.from(companyMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name),
		)
	}, [races])

	const distances = React.useMemo(() => {
		const distanceMap = new Map<string, DistanceOption>()
		races.forEach((race) => {
			race.distances?.forEach((distance) => {
				const option = buildDistanceOption(distance)
				if (option) {
					distanceMap.set(option.value, option)
				}
			})
		})

		return Array.from(distanceMap.values()).sort((a, b) => {
			if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
			return a.label.localeCompare(b.label)
		})
	}, [races])

	const distanceLabelLookup = React.useMemo(() => {
		const map: Record<string, string> = {}
		distances.forEach((d) => {
			map[d.value] = d.label
		})
		return map
	}, [distances])

	const filteredRaces = React.useMemo(() => {
		let filtered = races

		if (debouncedSearchTerm) {
			const searchLower = debouncedSearchTerm.toLowerCase()
			filtered = filtered.filter(
				(race) =>
					race.name.toLowerCase().includes(searchLower) ||
					race.location.toLowerCase().includes(searchLower) ||
					race.company?.name?.toLowerCase().includes(searchLower) ||
					race.terrain?.toLowerCase().includes(searchLower),
			)
		}

		if (filters.company) {
			filtered = filtered.filter(
				(race) => race.company?.name === filters.company,
			)
		}

		if (filters.distance) {
			const target = filters.distance
			filtered = filtered.filter((race) =>
				race.distances?.some((distance) => {
					if (target.startsWith('time:')) {
						const [, hoursStr] = target.split(':')
						const hours = hoursStr ? parseFloat(hoursStr) : NaN
						if (!Number.isFinite(hours)) return false
						return Boolean(
							distance.timeBased && distance.timeDurationHours === hours,
						)
					}

					const [, amount] = target.split(':')
					const parsedAmount = amount ? parseFloat(amount) : NaN
					const kmTarget = target.startsWith('km:')
						? parsedAmount
						: target.startsWith('mi:') && Number.isFinite(parsedAmount)
							? parsedAmount * 1.60934
							: null
					if (kmTarget !== null && Number.isFinite(kmTarget)) {
						const kmValue =
							distance.distanceKm ??
							(distance.distanceMiles ? distance.distanceMiles * 1.60934 : null)
						if (kmValue === null || kmValue === undefined) return false
						return Math.abs(kmValue - kmTarget) < 0.01
					}

					// Fallback: match label text
					return distance.distance?.trim() === target
				}),
			)
		}

		if (filters.dateRange) {
			const now = new Date()
			const startDate = new Date(now)
			const endDate = new Date(now)

			switch (filters.dateRange) {
				case 'next-month':
					endDate.setMonth(now.getMonth() + 1)
					break
				case 'next-3-months':
					endDate.setMonth(now.getMonth() + 3)
					break
				case 'next-6-months':
					endDate.setMonth(now.getMonth() + 6)
					break
				case 'this-year':
					endDate.setFullYear(now.getFullYear() + 1, 0, 1)
					break
			}

			filtered = filtered.filter((race) => {
				const raceDate = new Date(race.date)
				return raceDate >= startDate && raceDate <= endDate
			})
		}

		return filtered
	}, [
		races,
		debouncedSearchTerm,
		filters.company,
		filters.dateRange,
		filters.distance,
	])

	React.useEffect(() => {
		onFilteredRacesAction(filteredRaces)

		if (debouncedSearchTerm) {
			analytics.trackSearch(debouncedSearchTerm, filteredRaces.length)
		}
	}, [
		filteredRaces,
		onFilteredRacesAction,
		debouncedSearchTerm,
		analytics,
		companies,
		races.length,
	])

	React.useEffect(() => {
		if (filters.searchTerm !== debouncedSearchTerm) {
			setIsSearching(true)
		} else {
			setIsSearching(false)
		}
	}, [filters.searchTerm, debouncedSearchTerm])

	const updateURL = React.useCallback(
		(newFilters: SearchFilters) => {
			const params = new URLSearchParams()

			if (newFilters.searchTerm) params.set('search', newFilters.searchTerm)
			if (newFilters.company) params.set('company', newFilters.company)
			if (newFilters.dateRange) params.set('date', newFilters.dateRange)
			if (newFilters.distance) params.set('distance', newFilters.distance)

			const queryString = params.toString()
			const newUrl = queryString ? `?${queryString}` : window.location.pathname

			router.replace(newUrl, { scroll: false })
		},
		[router],
	)

	const activeFiltersCount = Object.values(filters).filter(Boolean).length
	const hasActiveFilters = activeFiltersCount > 0

	const updateFilter = React.useCallback(
		(key: keyof SearchFilters, value: string) => {
			const newFilters = { ...filters, [key]: value }
			setFilters(newFilters)
			updateURL(newFilters)

			if (key !== 'searchTerm' && value) {
				analytics.trackFilterApplied(key, value, filteredRaces.length)
			}
		},
		[filters, analytics, filteredRaces.length, updateURL],
	)

	const clearFilter = React.useCallback(
		(key: keyof SearchFilters) => {
			const newFilters = { ...filters, [key]: '' }
			setFilters(newFilters)
			updateURL(newFilters)

			if (key !== 'searchTerm') {
				analytics.trackFilterCleared(key, filteredRaces.length)
			}
		},
		[filters, analytics, filteredRaces.length, updateURL],
	)

	const clearAllFilters = React.useCallback(() => {
		const newFilters = {
			searchTerm: '',
			company: '',
			dateRange: '',
			distance: '',
		}
		setFilters(newFilters)
		updateURL(newFilters)

		analytics.trackAllFiltersCleared(races.length)
	}, [analytics, races.length, updateURL])

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
				event.preventDefault()
				searchInputRef.current?.focus()
			}

			if (event.key === 'Escape') {
				if (
					document.activeElement === searchInputRef.current &&
					filters.searchTerm
				) {
					updateFilter('searchTerm', '')
				} else if (hasActiveFilters) {
					clearAllFilters()
				}
			}

			if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
				event.preventDefault()
				setIsExpanded(!isExpanded)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [
		filters.searchTerm,
		hasActiveFilters,
		isExpanded,
		updateFilter,
		clearAllFilters,
	])

	return (
		<Card className="mb-8">
			<CardContent className="p-6">
				<div className="space-y-4">
					<div className="relative">
						<Search
							className={`absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors ${
								isSearching
									? 'text-primary animate-pulse'
									: 'text-muted-foreground'
							}`}
						/>
						<Input
							ref={searchInputRef}
							placeholder="Search races, locations, companies, or terrain... (⌘K)"
							value={filters.searchTerm}
							onChange={(e) => updateFilter('searchTerm', e.target.value)}
							className="pr-4 pl-10"
							autoComplete="off"
							aria-label="Search races"
							aria-describedby="search-help"
						/>
						{isSearching && (
							<div className="absolute top-1/2 right-3 -translate-y-1/2">
								<div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
							</div>
						)}
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsExpanded(!isExpanded)}
								className="gap-2"
								aria-expanded={isExpanded}
								aria-controls="filter-panel"
							>
								<Filter className="h-4 w-4" />
								Filters
								{activeFiltersCount > 0 && (
									<Badge
										variant="secondary"
										className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
									>
										{activeFiltersCount}
									</Badge>
								)}
							</Button>

							{onRefresh && (
								<Button
									variant="ghost"
									size="sm"
									onClick={onRefresh}
									className="gap-2"
									title="Refresh race data"
								>
									<RefreshCw className="h-4 w-4" />
									<span className="hidden sm:inline">Refresh</span>
								</Button>
							)}

							<div className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
								<Keyboard className="h-3 w-3" />
								<span>⌘K search • ⌘F filters • ESC clear</span>
							</div>
						</div>

						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearAllFilters}
								className="text-muted-foreground hover:text-foreground gap-2"
							>
								<X className="h-4 w-4" />
								Clear all
							</Button>
						)}
					</div>

					{isExpanded && (
						<div
							id="filter-panel"
							className="grid grid-cols-1 gap-4 md:grid-cols-4"
							role="region"
							aria-label="Race filters"
						>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Building2 className="text-muted-foreground h-4 w-4" />
									<label className="text-sm font-medium">Company</label>
								</div>
								<Select
									value={filters.company}
									onValueChange={(value) => updateFilter('company', value)}
								>
									<SelectTrigger aria-label="Filter by company">
										{filters.company ? (
											<div className="flex items-center gap-2">
												<CompanyLogo
													logo={
														companies.find((c) => c.name === filters.company)
															?.logo
													}
													companyName={filters.company}
													width={20}
													height={20}
													variant="filter"
												/>
												<span>{filters.company}</span>
											</div>
										) : (
											<SelectValue placeholder="All companies" />
										)}
									</SelectTrigger>
									<SelectContent>
										{companies.map((company) => (
											<SelectItem
												key={company.name}
												value={company.name}
												className="py-3"
											>
												<div className="flex items-center gap-3">
													<CompanyLogo
														logo={company.logo}
														companyName={company.name}
														width={40}
														height={40}
														variant="filter"
													/>
													<span className="font-medium">{company.name}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Calendar className="text-muted-foreground h-4 w-4" />
									<label className="text-sm font-medium">Time Period</label>
								</div>
								<Select
									value={filters.dateRange}
									onValueChange={(value) => updateFilter('dateRange', value)}
								>
									<SelectTrigger aria-label="Filter by date range">
										<SelectValue placeholder="All dates" />
									</SelectTrigger>
									<SelectContent>
										{DATE_RANGE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Ruler className="text-muted-foreground h-4 w-4" />
									<label className="text-sm font-medium">Distance</label>
								</div>
								<Select
									value={filters.distance}
									onValueChange={(value) => updateFilter('distance', value)}
								>
									<SelectTrigger aria-label="Filter by distance">
										<SelectValue placeholder="All distances" />
									</SelectTrigger>
									<SelectContent>
										{distances.map((distance) => (
											<SelectItem key={distance.value} value={distance.value}>
												{distance.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					{hasActiveFilters && (
						<div
							className="flex flex-wrap gap-2"
							role="group"
							aria-label="Active filters"
						>
							{filters.company && (
								<Badge variant="secondary" className="gap-2">
									<div className="flex items-center gap-2">
										<CompanyLogo
											logo={
												companies.find((c) => c.name === filters.company)?.logo
											}
											companyName={filters.company}
											width={16}
											height={16}
											variant="filter"
										/>
										<span>Company: {filters.company}</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-foreground h-auto p-0"
										onClick={() => clearFilter('company')}
									>
										<X className="h-3 w-3" />
									</Button>
								</Badge>
							)}
							{filters.dateRange && (
								<Badge variant="secondary" className="gap-1">
									Date:{' '}
									{
										DATE_RANGE_OPTIONS.find(
											(opt) => opt.value === filters.dateRange,
										)?.label
									}
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-foreground h-auto p-0"
										onClick={() => clearFilter('dateRange')}
									>
										<X className="h-3 w-3" />
									</Button>
								</Badge>
							)}
							{filters.distance && (
								<Badge variant="secondary" className="gap-1">
									Distance:{' '}
									{distanceLabelLookup[filters.distance] || filters.distance}
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-foreground h-auto p-0"
										onClick={() => clearFilter('distance')}
									>
										<X className="h-3 w-3" />
									</Button>
								</Badge>
							)}
						</div>
					)}

					<div className="flex items-center justify-between">
						<div
							className="text-muted-foreground text-sm"
							role="status"
							aria-live="polite"
						>
							{filteredRaces.length === races.length
								? `Showing all ${races.length} race${races.length !== 1 ? 's' : ''} • ${companies.length} companies`
								: `Showing ${filteredRaces.length} of ${races.length} race${races.length !== 1 ? 's' : ''} • ${companies.length} companies`}
						</div>
						<div
							id="search-help"
							className="text-muted-foreground hidden text-xs sm:block"
						>
							Search by name, location, company, or terrain type. Filter by
							company, date, or distance.
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
