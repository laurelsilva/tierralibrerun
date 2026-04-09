'use client'

import {CheckCircle, AlertCircle} from 'lucide-react'
import * as React from 'react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger
} from '@/components/ui/select'

import  {type RaceOptionForApplication} from '@/lib/sanity/types'
import {formatRaceDateShort} from '@/lib/utils/race-utils'

interface RaceSelectorProps {
	raceOptions: RaceOptionForApplication[]
	appliedRaces: string[]
	selectedRace: string
	onRaceSelectAction: (race: string) => void
}

interface CompanyData {
	name: string
	slug: string
	logo?: {asset: {_id: string; url: string}}
	races: RaceOptionForApplication[]
}

interface RaceSeriesData {
	_id: string
	name: string
	date: string
	location: string
	distances: RaceOptionForApplication[]
}

export default function RaceSelector({
	raceOptions,
	appliedRaces,
	selectedRace,
	onRaceSelectAction
}: RaceSelectorProps) {
	const [selectedCompany, setSelectedCompany] = React.useState<string>('')
	const [selectedRaceSeries, setSelectedRaceSeries] = React.useState<string>('')
	const [selectedDistance, setSelectedDistance] = React.useState<string>('')
	const [showResetNotification, setShowResetNotification] =
		React.useState(false)

	// Get available races only
	const availableRaces = React.useMemo(() => {
		return raceOptions.filter((option) => {
			const raceKey = `${option.raceSeries.name} - ${option.distance}`
			return !appliedRaces.includes(raceKey)
		})
	}, [raceOptions, appliedRaces])

	// Group by companies
	const companies = React.useMemo(() => {
		const companyMap = new Map<string, CompanyData>()

		availableRaces.forEach((option) => {
			const companyName = option.raceSeries.company.name
			if (!companyMap.has(companyName)) {
				companyMap.set(companyName, {
					name: companyName,
					slug: option.raceSeries.company.slug,
					logo: option.raceSeries.company.logo,
					races: []
				})
			}
			companyMap.get(companyName)!.races.push(option)
		})

		return Array.from(companyMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		)
	}, [availableRaces])

	// Get race series for selected company
	const raceSeries = React.useMemo(() => {
		if (!selectedCompany) return []

		const companyRaces = availableRaces.filter(
			(option) => option.raceSeries.company.name === selectedCompany
		)

		const seriesMap = new Map<string, RaceSeriesData>()

		companyRaces.forEach((option) => {
			const seriesId = option.raceSeries._id
			if (!seriesMap.has(seriesId)) {
				seriesMap.set(seriesId, {
					_id: seriesId,
					name: option.raceSeries.name,
					date: option.raceSeries.date,
					location: option.raceSeries.location,
					distances: []
				})
			}
			seriesMap.get(seriesId)!.distances.push(option)
		})

		return Array.from(seriesMap.values()).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		)
	}, [selectedCompany, availableRaces])

	// Get distances for selected race series
	const distances = React.useMemo(() => {
		if (!selectedRaceSeries) return []

		const series = raceSeries.find((rs) => rs._id === selectedRaceSeries)
		return series?.distances.sort((a, b) => a.price - b.price) || []
	}, [selectedRaceSeries, raceSeries])

	// Get selected race option details
	const selectedRaceOption = React.useMemo(() => {
		if (!selectedDistance) return null
		return distances.find((d) => d._id === selectedDistance) || null
	}, [selectedDistance, distances])

	// Show reset notification
	const showResetFeedback = () => {
		setShowResetNotification(true)
		setTimeout(() => setShowResetNotification(false), 3000)
	}

	// Handle company selection with proper cascade reset
	const handleCompanyChange = (companyName: string) => {
		const wasCompleteSelection =
			selectedCompany && selectedRaceSeries && selectedDistance

		setSelectedCompany(companyName)
		setSelectedRaceSeries('')
		setSelectedDistance('')
		onRaceSelectAction('')

		if (wasCompleteSelection) {
			showResetFeedback()
		}
	}

	// Handle race series selection with proper cascade reset
	const handleRaceSeriesChange = (seriesId: string) => {
		const wasCompleteSelection = selectedDistance

		setSelectedRaceSeries(seriesId)
		setSelectedDistance('')
		onRaceSelectAction('')

		if (wasCompleteSelection) {
			showResetFeedback()
		}
	}

	// Handle distance selection
	const handleDistanceChange = (distanceId: string) => {
		setSelectedDistance(distanceId)
		const option = distances.find((d) => d._id === distanceId)
		if (option) {
			const raceKey = `${option.raceSeries.name} - ${option.distance}`
			onRaceSelectAction(raceKey)
		}
	}

	// Clear all selections
	const handleClearAll = () => {
		setSelectedCompany('')
		setSelectedRaceSeries('')
		setSelectedDistance('')
		onRaceSelectAction('')
		showResetFeedback()
	}

	// Initialize selections when selectedRace prop is provided
	React.useEffect(() => {
		if (selectedRace && availableRaces.length > 0) {
			const matchingOption = availableRaces.find((option) => {
				const raceKey = `${option.raceSeries.name} - ${option.distance}`
				return raceKey === selectedRace
			})

			if (matchingOption) {
				const companyName = matchingOption.raceSeries.company.name
				const seriesId = matchingOption.raceSeries._id
				const distanceId = matchingOption._id

				setSelectedCompany(companyName)
				setSelectedRaceSeries(seriesId)
				setSelectedDistance(distanceId)
			}
		} else if (!selectedRace) {
			setSelectedCompany('')
			setSelectedRaceSeries('')
			setSelectedDistance('')
		}
	}, [selectedRace, availableRaces])

	// Calculate completion status
	const completionStatus = {
		step1: !!selectedCompany,
		step2: !!selectedRaceSeries,
		step3: !!selectedDistance
	}

	const allStepsComplete =
		completionStatus.step1 && completionStatus.step2 && completionStatus.step3

	return (
		<div className="space-y-6">
			{/* Progress indicator */}
			{(selectedCompany || selectedRaceSeries || selectedDistance) && (
				<div className="bg-muted/30 border-border rounded-lg border p-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-muted-foreground flex items-center gap-3 text-sm">
							<span className="font-medium">Progress:</span>
							<div
								className="flex gap-2"
								role="progressbar"
								aria-label="Selection progress">
								<CheckCircle
									className={`h-5 w-5 ${completionStatus.step1 ? 'text-primary' : 'text-muted-foreground/40'}`}
									aria-label={`Step 1: ${completionStatus.step1 ? 'Complete' : 'Incomplete'}`}
								/>
								<CheckCircle
									className={`h-5 w-5 ${completionStatus.step2 ? 'text-primary' : 'text-muted-foreground/40'}`}
									aria-label={`Step 2: ${completionStatus.step2 ? 'Complete' : 'Incomplete'}`}
								/>
								<CheckCircle
									className={`h-5 w-5 ${completionStatus.step3 ? 'text-primary' : 'text-muted-foreground/40'}`}
									aria-label={`Step 3: ${completionStatus.step3 ? 'Complete' : 'Incomplete'}`}
								/>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleClearAll}
							className="border-border bg-background hover:bg-accent/80 w-full text-xs sm:w-auto"
							aria-label="Clear all selections">
							Clear All
						</Button>
					</div>
				</div>
			)}

			{/* Reset Notification */}
			{showResetNotification && (
				<div
					className="border-primary/20 bg-primary/10 text-foreground rounded-lg border p-4 text-sm"
					role="alert">
					<div className="flex items-center gap-2">
						<AlertCircle className="text-primary h-4 w-4" />
						<span className="font-medium">
							Selection cleared. Please make your new choice below.
						</span>
					</div>
				</div>
			)}

			{/* Step 1: Company Selection */}
			<div className="space-y-3">
				<label
					className="text-foreground flex items-center gap-2 text-base font-semibold"
					htmlFor="race-company">
					Step 1: Choose Race Company{' '}
					<span className="text-destructive">*</span>
					{completionStatus.step1 && (
						<CheckCircle className="text-primary h-5 w-5" />
					)}
				</label>
				<Select value={selectedCompany} onValueChange={handleCompanyChange}>
					<SelectTrigger className="bg-card border-border hover:bg-accent/50 focus:bg-accent/30 h-auto min-h-[3rem] w-full transition-colors">
						<div className="flex w-full items-center justify-between py-2">
							<div className="flex w-full flex-col text-left">
								{selectedCompany ? (
									<>
										<span className="text-foreground font-medium">
											{selectedCompany}
										</span>
										<span className="text-muted-foreground text-xs">
											{companies.find((c) => c.name === selectedCompany)?.races
												.length || 0}{' '}
											races available
										</span>
									</>
								) : (
									<span className="text-muted-foreground">
										Select a race company...
									</span>
								)}
							</div>
						</div>
					</SelectTrigger>
					<SelectContent className="bg-card border-border max-h-[300px] shadow-lg">
						<SelectGroup>
							{companies.length === 0 ? (
								<SelectLabel className="text-muted-foreground px-3 py-2">
									No companies available
								</SelectLabel>
							) : (
								companies.map((company) => {
									const raceCount = new Set(
										company.races.map((r) => r.raceSeries._id)
									).size
									return (
										<SelectItem
											key={company.name}
											value={company.name}
											className="hover:bg-accent/80 focus:bg-accent/80 cursor-pointer px-3 py-3">
											<div className="flex w-full flex-col text-left">
												<span className="text-foreground font-medium">
													{company.name}
												</span>
												<span className="text-muted-foreground text-xs">
													{raceCount} race{raceCount !== 1 ? 's' : ''} available
												</span>
											</div>
										</SelectItem>
									)
								})
							)}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>

			{/* Step 2: Race Series Selection */}
			{selectedCompany && (
				<div className="space-y-3">
					<label
						className="text-foreground flex items-center gap-2 text-base font-semibold"
						htmlFor="race-series">
						Step 2: Choose Race Series{' '}
						<span className="text-destructive">*</span>
						{completionStatus.step2 && (
							<CheckCircle className="text-primary h-5 w-5" />
						)}
					</label>
					<Select
						value={selectedRaceSeries}
						onValueChange={handleRaceSeriesChange}>
						<SelectTrigger className="bg-card border-border hover:bg-accent/50 focus:bg-accent/30 h-auto min-h-[3rem] w-full transition-colors">
							<div className="flex w-full items-center justify-between py-2">
								<div className="flex w-full flex-col text-left">
									{selectedRaceSeries ? (
										<>
											<span className="text-foreground font-medium">
												{
													raceSeries.find((rs) => rs._id === selectedRaceSeries)
														?.name
												}
											</span>
											<span className="text-muted-foreground text-xs">
												{formatRaceDateShort(
													raceSeries.find((rs) => rs._id === selectedRaceSeries)
														?.date || ''
												)}{' '}
												•{' '}
												{
													raceSeries.find((rs) => rs._id === selectedRaceSeries)
														?.location
												}
											</span>
										</>
									) : (
										<span className="text-muted-foreground">
											Select a race series...
										</span>
									)}
								</div>
							</div>
						</SelectTrigger>
						<SelectContent className="bg-card border-border max-h-[300px] shadow-lg">
							<SelectGroup>
								<SelectLabel className="text-foreground px-3 py-2 font-medium">
									{selectedCompany}
								</SelectLabel>
								{raceSeries.map((series) => (
									<SelectItem
										key={series._id}
										value={series._id}
										className="hover:bg-accent/80 focus:bg-accent/80 cursor-pointer px-3 py-3">
										<div className="flex w-full flex-col text-left">
											<span className="text-foreground font-medium">
												{series.name}
											</span>
											<span className="text-muted-foreground text-xs">
												{formatRaceDateShort(series.date)} • {series.location}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Step 3: Distance Selection */}
			{selectedRaceSeries && (
				<div className="space-y-3">
					<label
						className="text-foreground flex items-center gap-2 text-base font-semibold"
						htmlFor="race-distance">
						Step 3: Choose Distance <span className="text-destructive">*</span>
						{completionStatus.step3 && (
							<CheckCircle className="text-primary h-5 w-5" />
						)}
					</label>
					<Select value={selectedDistance} onValueChange={handleDistanceChange}>
						<SelectTrigger className="bg-card border-border hover:bg-accent/50 focus:bg-accent/30 h-auto min-h-[3rem] w-full transition-colors">
							<div className="flex w-full items-center justify-between py-2">
								<div className="flex w-full flex-col text-left">
									{selectedDistance ? (
										<>
											<span className="text-foreground font-medium">
												{
													distances.find((d) => d._id === selectedDistance)
														?.distance
												}
											</span>
											<span className="text-muted-foreground text-xs">
												$
												{
													distances.find((d) => d._id === selectedDistance)
														?.price
												}{' '}
												•{' '}
												{
													distances.find((d) => d._id === selectedDistance)
														?.difficulty
												}{' '}
												•{' '}
												{
													distances.find((d) => d._id === selectedDistance)
														?.elevationGain
												}
												ft gain
											</span>
										</>
									) : (
										<span className="text-muted-foreground">
											Select a distance...
										</span>
									)}
								</div>
							</div>
						</SelectTrigger>
						<SelectContent className="bg-card border-border max-h-[300px] shadow-lg">
							<SelectGroup>
								<SelectLabel className="text-foreground px-3 py-2 font-medium">
									{raceSeries.find((rs) => rs._id === selectedRaceSeries)?.name}
								</SelectLabel>
								{distances.map((option) => {
									const details = []
									details.push(`$${option.price}`)
									if (option.difficulty) details.push(option.difficulty)
									if (option.elevationGain)
										details.push(`${option.elevationGain}ft gain`)

									return (
										<SelectItem
											key={option._id}
											value={option._id}
											className="hover:bg-accent/80 focus:bg-accent/80 cursor-pointer px-3 py-3">
											<div className="flex w-full flex-col text-left">
												<span className="text-foreground font-medium">
													{option.distance}
												</span>
												<span className="text-muted-foreground text-xs">
													{details.join(' • ')}
												</span>
											</div>
										</SelectItem>
									)
								})}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Selection Summary Card */}
			{selectedRaceOption && allStepsComplete && (
				<Card className="border-primary/30 bg-primary/5 shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-primary flex items-center gap-3 text-lg font-bold sm:text-xl">
							<CheckCircle className="h-6 w-6" />
							Selected Race Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-1">
								<span className="text-foreground text-sm font-semibold">
									Company:
								</span>
								<p className="text-muted-foreground text-sm">
									{selectedRaceOption.raceSeries.company.name}
								</p>
							</div>
							<div className="space-y-1">
								<span className="text-foreground text-sm font-semibold">
									Race:
								</span>
								<p className="text-muted-foreground text-sm">
									{selectedRaceOption.raceSeries.name}
								</p>
							</div>
							<div className="space-y-1">
								<span className="text-foreground text-sm font-semibold">
									Distance:
								</span>
								<p className="text-muted-foreground text-sm font-medium">
									{selectedRaceOption.distance}
								</p>
							</div>
							<div className="space-y-1">
								<span className="text-foreground text-sm font-semibold">
									Price:
								</span>
								<p className="text-primary text-base font-bold">
									${selectedRaceOption.price}
								</p>
							</div>
							<div className="space-y-1">
								<span className="text-foreground text-sm font-semibold">
									Date:
								</span>
								<p className="text-muted-foreground text-sm">
									{new Date(
										selectedRaceOption.raceSeries.date
									).toLocaleDateString('en-US', {
										weekday: 'long',
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</p>
							</div>
							<div className="space-y-1">
								<span className="text-foreground text-sm font-semibold">
									Location:
								</span>
								<p className="text-muted-foreground text-sm">
									{selectedRaceOption.raceSeries.location}
								</p>
							</div>
						</div>
						{(selectedRaceOption.difficulty ||
							selectedRaceOption.elevationGain ||
							selectedRaceOption.courseDistance) && (
							<div className="flex flex-wrap gap-2 pt-10">
								{selectedRaceOption.difficulty && (
									<Badge
										variant="outline"
										className="border-primary/30 text-primary bg-primary/10 text-xs font-medium capitalize">
										{selectedRaceOption.difficulty}
									</Badge>
								)}
								{selectedRaceOption.elevationGain && (
									<Badge
										variant="secondary"
										className="bg-accent text-accent-foreground text-xs font-medium">
										{selectedRaceOption.elevationGain}ft elevation
									</Badge>
								)}
								{selectedRaceOption.courseDistance && (
									<Badge
										variant="secondary"
										className="bg-accent text-accent-foreground text-xs font-medium">
										{selectedRaceOption.courseDistance} miles
									</Badge>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* No Races Available State */}
			{availableRaces.length === 0 && (
				<Card className="border-destructive/20 bg-destructive/5">
					<CardContent className="p-8 text-center">
						<AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
						<p className="text-foreground mb-2 text-lg font-semibold">
							No races available
						</p>
						<p className="text-muted-foreground">
							You have already applied to all available races or reached your
							application limit.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
