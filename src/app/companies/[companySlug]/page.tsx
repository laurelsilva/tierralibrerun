import Link from 'next/link'
import { notFound } from 'next/navigation'
import CompanyLogo from '@/components/company-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { generateCompanyMetadata } from '@/lib/metadata'
import { getCompanyBySlug } from '@/lib/sanity/queries'
import { type CompanyWithRaces } from '@/lib/sanity/types'

export const revalidate = 60

function normalizeUrl(url?: string) {
	if (!url) return undefined
	return url.startsWith('http') ? url : `https://${url}`
}

function splitRaces(races: NonNullable<CompanyWithRaces['raceSeries']>) {
	const now = new Date()
	const upcoming: NonNullable<CompanyWithRaces['raceSeries']> = []
	const past: NonNullable<CompanyWithRaces['raceSeries']> = []

	races.forEach((race) => {
		if (!race.date) {
			upcoming.push(race)
			return
		}

		const raceDate = new Date(race.date)
		if (raceDate >= now) {
			upcoming.push(race)
		} else {
			past.push(race)
		}
	})

	upcoming.sort((a, b) => {
		if (!a.date || !b.date) return 0
		return new Date(a.date).getTime() - new Date(b.date).getTime()
	})

	past.sort((a, b) => {
		if (!a.date || !b.date) return 0
		return new Date(b.date).getTime() - new Date(a.date).getTime()
	})
	return { upcoming, past }
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ companySlug: string }>
}) {
	const { companySlug } = await params
	const company = await getCompanyBySlug(companySlug)

	if (!company) {
		return {
			title: 'Company Not Found | Trail Running Community',
			description: 'The requested company profile could not be found.',
		}
	}

	return generateCompanyMetadata(company)
}

export default async function CompanyPage({
	params,
}: {
	params: Promise<{ companySlug: string }>
}) {
	const { companySlug } = await params
	const company = await getCompanyBySlug(companySlug)

	if (!company) {
		notFound()
	}

	const races = (company.raceSeries ?? []) as NonNullable<
		CompanyWithRaces['raceSeries']
	>
	const { upcoming, past } = splitRaces(races)
	const websiteUrl = normalizeUrl(company.website)

	return (
		<div className="container mx-auto px-6 py-12 sm:px-8 lg:px-12">
			{/* Header */}
			<div className="mb-12">
				<Link
					href="/companies"
					className="text-muted-foreground hover:text-primary mb-8 inline-flex items-center text-sm transition-colors"
				>
					← Back to Companies
				</Link>

				<div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-start">
					<div className="shrink-0">
						<CompanyLogo
							logo={company.logo}
							companyName={company.name}
							width={120}
							height={120}
						/>
					</div>
					<div className="flex-1 space-y-6">
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-3">
								<h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
									{company.name}
								</h1>
								{company.companyType && (
									<Badge
										variant="secondary"
										className="px-3 py-1 text-sm capitalize"
									>
										{company.companyType.replace(/-/g, ' ')}
									</Badge>
								)}
							</div>
							{company.description && (
								<p className="text-muted-foreground max-w-3xl text-lg leading-relaxed">
									{company.description}
								</p>
							)}
						</div>

						<div className="flex flex-wrap gap-3">
							{websiteUrl && (
								<Button variant="default" asChild>
									<Link href={websiteUrl} target="_blank" rel="noreferrer">
										Visit Website →
									</Link>
								</Button>
							)}
							{company.email && (
								<Button variant="outline" asChild>
									<a href={`mailto:${company.email}`}>Contact</a>
								</Button>
							)}
							{company.phone && (
								<Button variant="outline" asChild>
									<a href={`tel:${company.phone}`}>{company.phone}</a>
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Upcoming Races Table */}
			<RaceTableSection
				title="Upcoming Races"
				races={upcoming}
				emptyText="No upcoming races scheduled."
			/>

			{/* Past Races Table */}
			{past.length > 0 && (
				<RaceTableSection
					title="Past Races"
					races={past}
					emptyText="No past races recorded."
				/>
			)}
		</div>
	)
}

function RaceTableSection({
	title,
	races,
	emptyText,
}: {
	title: string
	races: NonNullable<CompanyWithRaces['raceSeries']>
	emptyText: string
}) {
	if (!races || races.length === 0) {
		return (
			<section className="mb-16 space-y-6">
				<h2 className="text-foreground text-3xl font-semibold tracking-tight">
					{title}
				</h2>
				<p className="text-muted-foreground text-base">{emptyText}</p>
			</section>
		)
	}

	return (
		<section className="mb-16 space-y-6">
			<div className="flex items-baseline justify-between">
				<h2 className="text-foreground text-3xl font-semibold tracking-tight">
					{title}
				</h2>
				<span className="text-muted-foreground text-sm">
					{races.length} {races.length === 1 ? 'race' : 'races'}
				</span>
			</div>

			<div className="border-border bg-card overflow-x-auto rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow className="border-border bg-muted/30 border-b">
							<TableHead className="text-muted-foreground h-14 px-6 text-xs font-semibold tracking-wider uppercase">
								Date
							</TableHead>
							<TableHead className="text-muted-foreground h-14 px-6 text-xs font-semibold tracking-wider uppercase">
								Race
							</TableHead>
							<TableHead className="text-muted-foreground h-14 px-6 text-xs font-semibold tracking-wider uppercase">
								Location
							</TableHead>
							<TableHead className="text-muted-foreground h-14 px-6 text-xs font-semibold tracking-wider uppercase">
								Details
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{races.map((race) => {
							const date = race.date ? new Date(race.date) : null
							return (
								<TableRow
									key={race._id}
									className="border-border/50 hover:bg-muted/20 border-b transition-colors last:border-0"
								>
									<TableCell className="px-6 py-5">
										{date ? (
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
										) : (
											<span className="text-muted-foreground text-sm">TBA</span>
										)}
									</TableCell>
									<TableCell className="px-6 py-5">
										<div
											className="flex flex-col gap-2.5"
											style={{ minWidth: 240 }}
										>
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
									</TableCell>
									<TableCell className="px-6 py-5">
										<div
											className="text-foreground text-sm"
											style={{ minWidth: 140 }}
										>
											{race.location || '—'}
										</div>
									</TableCell>
									<TableCell className="px-6 py-5">
										{race.description ? (
											<p className="text-muted-foreground line-clamp-2 max-w-md text-sm leading-relaxed">
												{race.description}
											</p>
										) : (
											<span className="text-muted-foreground text-sm">—</span>
										)}
									</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</div>
		</section>
	)
}
