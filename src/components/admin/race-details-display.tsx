import {Badge} from '@/components/ui/badge'
import  {type RaceOptionForApplication} from '@/lib/sanity/types'

interface RaceDetailsDisplayProps {
	raceString: string
	raceOptions?: RaceOptionForApplication[]
}

export function RaceDetailsDisplay({
	raceString,
	raceOptions
}: RaceDetailsDisplayProps) {
	// Find the matching race option if available
	const matchingRace = raceOptions?.find(
		(option) => `${option.raceSeries.name} - ${option.distance}` === raceString
	)

	if (matchingRace) {
		return (
			<div className="bg-muted rounded-lg p-3">
				<p className="mb-3 font-medium">{raceString}</p>
				<div className="space-y-2 text-sm">
					<div className="flex items-center gap-2">
						<span className="text-foreground font-medium">Partner:</span>
						<span className="text-muted-foreground">
							{matchingRace.raceSeries.company.name}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-foreground font-medium">Race Series:</span>
						<span className="text-muted-foreground">
							{matchingRace.raceSeries.name}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-foreground font-medium">Distance:</span>
						<span className="text-muted-foreground">
							{matchingRace.distance}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-foreground font-medium">Entry Fee:</span>
						<span className="text-muted-foreground font-semibold">
							${matchingRace.price}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-foreground font-medium">Date:</span>
						<span className="text-muted-foreground">
							{new Date(matchingRace.raceSeries.date).toLocaleDateString(
								'en-US',
								{
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								}
							)}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-foreground font-medium">Location:</span>
						<span className="text-muted-foreground">
							{matchingRace.raceSeries.location}
						</span>
					</div>
					{(matchingRace.difficulty ||
						matchingRace.elevationGain ||
						matchingRace.courseDistance) && (
						<div className="flex items-center gap-2 pt-1">
							<span className="text-foreground font-medium">Course:</span>
							<div className="flex gap-1">
								{matchingRace.difficulty && (
									<Badge variant="outline" className="text-xs capitalize">
										{matchingRace.difficulty}
									</Badge>
								)}
								{matchingRace.elevationGain && (
									<Badge variant="secondary" className="text-xs">
										{matchingRace.elevationGain} ft elevation
									</Badge>
								)}
								{matchingRace.courseDistance && (
									<Badge variant="secondary" className="text-xs">
										{matchingRace.courseDistance} miles
									</Badge>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		)
	}

	// Fallback for when race options aren't available or race isn't found
	if (raceString && raceString.includes(' - ')) {
		const [raceSeries, distance] = raceString.split(' - ')
		return (
			<div className="bg-muted rounded p-3">
				<p className="mb-2 font-medium">{raceString}</p>
				<div className="text-muted-foreground space-y-1 text-sm">
					<div>
						<span className="text-foreground font-medium">Race Series:</span>{' '}
						{raceSeries}
					</div>
					<div>
						<span className="text-foreground font-medium">Distance:</span>{' '}
						{distance}
					</div>
				</div>
			</div>
		)
	}

	// Simple fallback
	return (
		<div className="bg-muted rounded p-3">
			<p className="font-medium">{raceString}</p>
		</div>
	)
}
