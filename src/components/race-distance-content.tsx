import { type PortableTextBlock } from '@portabletext/types'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from 'next-sanity'
import CompanyLogo from '@/components/company-logo'
import { FundApplyButton } from '@/components/fund-apply-button'
import { Badge } from '@/components/ui/badge'
import { type RaceDistanceDetail } from '@/lib/sanity/types'

const portableTextComponents: PortableTextComponents = {
	block: {
		h2: ({ children }) => (
			<h2 className="text-foreground mt-8 mb-4 text-2xl font-bold tracking-tight">
				{children}
			</h2>
		),
		h3: ({ children }) => (
			<h3 className="text-foreground mt-6 mb-3 text-xl font-semibold tracking-tight">
				{children}
			</h3>
		),
		normal: ({ children }) => (
			<p className="text-muted-foreground mb-4 leading-7">{children}</p>
		),
		blockquote: ({ children }) => (
			<blockquote className="border-primary text-muted-foreground my-4 border-l-4 pl-4 italic">
				{children}
			</blockquote>
		),
	},
	list: {
		bullet: ({ children }) => (
			<ul className="text-muted-foreground my-4 ml-6 list-disc space-y-2 pl-6">
				{children}
			</ul>
		),
		number: ({ children }) => (
			<ol className="text-muted-foreground my-4 ml-6 list-decimal space-y-2 pl-6">
				{children}
			</ol>
		),
	},
	listItem: {
		bullet: ({ children }) => <li className="pl-2 leading-7">{children}</li>,
		number: ({ children }) => <li className="pl-2 leading-7">{children}</li>,
	},
	marks: {
		strong: ({ children }) => (
			<strong className="text-foreground font-semibold">{children}</strong>
		),
		em: ({ children }) => <em className="italic">{children}</em>,
		code: ({ children }) => (
			<code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm">
				{children}
			</code>
		),
		link: ({
			children,
			value,
		}: {
			children: React.ReactNode
			value?: { href?: string; openInNewTab?: boolean }
		}) => {
			const href = value?.href || '#'
			const newTab = !!value?.openInNewTab
			return (
				<a
					href={href}
					target={newTab ? '_blank' : undefined}
					rel={newTab ? 'noopener noreferrer' : undefined}
					className="text-primary underline-offset-4 hover:underline"
				>
					{children}
				</a>
			)
		},
	},
}

interface RaceDistanceContentProps {
	distance: RaceDistanceDetail
	raceSeriesSlug: string
	showBreadcrumb?: boolean
}

export default async function RaceDistanceContent({
	distance,
	raceSeriesSlug,
	showBreadcrumb = true,
}: RaceDistanceContentProps) {
	const raceName = `${distance.raceSeries?.name || ''} - ${distance.distance}`

	return (
		<div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
			{/* Breadcrumb */}
			{showBreadcrumb && (
				<nav className="mb-8 space-x-2 text-sm">
					<Link
						href="/races"
						className="text-muted-foreground hover:text-primary"
					>
						All Races
					</Link>
					<span className="text-muted-foreground">→</span>
					<Link
						href={`/races/${raceSeriesSlug}`}
						className="text-muted-foreground hover:text-primary"
					>
						{distance.raceSeries?.name}
					</Link>
					<span className="text-muted-foreground">→</span>
					<span className="text-foreground">{distance.distance}</span>
				</nav>
			)}

			{/* Header Section */}
			<div className="bg-card border-border mb-8 rounded-lg border p-6 sm:p-8">
				<div className="mb-6">
					<Badge
						variant="default"
						className="bg-primary text-primary-foreground"
					>
						BIPOC Athlete Fund Supported
					</Badge>
				</div>
				<div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
					<div className="flex w-full shrink-0 justify-center sm:w-auto sm:justify-start">
						<CompanyLogo
							logo={distance.raceSeries?.company?.logo}
							companyName={
								distance.raceSeries?.company?.name || 'Unknown Company'
							}
							width={80}
							height={80}
							className="object-contain p-2 sm:h-25 sm:w-25"
						/>
					</div>
					<div className="min-w-0 flex-1">
						<h1
							id="modal-title"
							className="text-foreground mb-4 text-2xl font-bold wrap-break-word sm:text-3xl lg:text-5xl"
						>
							{distance.distance}
						</h1>
						<p className="text-muted-foreground mb-3 text-sm wrap-break-word sm:text-base">
							{distance.raceSeries?.name}
						</p>
						<p className="text-muted-foreground text-sm wrap-break-word sm:text-base">
							Organized by {distance.raceSeries?.company?.name}
						</p>
					</div>
					<div className="flex w-full flex-col space-y-3 sm:w-auto sm:text-right">
						<div>
							<div className="text-foreground text-2xl font-bold sm:text-3xl">
								${distance.price}
							</div>
							<div className="text-muted-foreground text-sm">Entry Fee</div>
						</div>
						<FundApplyButton
							raceName={raceName}
							fullWidth
							className="w-full sm:w-auto"
							label="Apply for Race Funding"
						/>
					</div>
				</div>
			</div>

			<div className="grid gap-8 lg:grid-cols-3">
				{/* Main Content */}
				<div className="space-y-8 lg:col-span-2">
					{distance.description && (
						<div className="border-border bg-card rounded-lg border p-6 sm:p-8">
							<h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
								About This Distance
							</h2>
							<div className="text-muted-foreground text-sm leading-relaxed sm:text-base">
								<PortableText
									value={
										Array.isArray(distance.description)
											? (distance.description as PortableTextBlock[])
											: []
									}
									components={portableTextComponents}
								/>
							</div>
						</div>
					)}

					{/* Course Description */}
					{distance.courseDescription && (
						<div className="border-border bg-card rounded-lg border p-6 sm:p-8">
							<h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
								Course Details
							</h2>
							<div className="text-muted-foreground text-sm leading-relaxed sm:text-base">
								<PortableText
									value={
										Array.isArray(distance.courseDescription)
											? (distance.courseDescription as PortableTextBlock[])
											: []
									}
									components={portableTextComponents}
								/>
							</div>
						</div>
					)}

					{/* Qualification Requirements */}
					{distance.qualificationRequired && (
						<div className="border-destructive/20 bg-destructive/10 rounded-lg border p-6 sm:p-8">
							<h2 className="text-destructive mb-4 text-2xl font-semibold sm:text-3xl">
								⚠️ Qualification Required
							</h2>
							<p className="text-foreground mb-2 text-sm font-medium sm:text-base">
								This race requires qualification to participate.
							</p>
							{distance.qualificationDescription && (
								<p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
									{distance.qualificationDescription}
								</p>
							)}
						</div>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-8">
					{/* Race Stats */}
					<div className="border-border bg-card rounded-lg border p-6 sm:p-8">
						<h3 className="text-foreground mb-4 text-lg font-semibold sm:text-xl">
							Race Statistics
						</h3>
						<div className="space-y-3">
							<div className="flex items-start justify-between">
								<span className="text-foreground text-sm font-medium sm:text-base">
									Distance
								</span>
								<span className="text-muted-foreground text-right text-sm sm:text-base">
									{distance.timeBased
										? `${distance.timeDurationHours ?? '—'} hours (timed)`
										: distance.distanceKm
											? `${distance.distanceKm} km${distance.distanceMiles ? ` / ${distance.distanceMiles.toFixed(1)} mi` : ''}`
											: distance.distanceMiles
												? `${distance.distanceMiles} mi`
												: distance.courseDistance
													? `${distance.courseDistance} miles`
													: '—'}
								</span>
							</div>
							<div className="flex items-start justify-between">
								<span className="text-foreground text-sm font-medium sm:text-base">
									Elevation Gain
								</span>
								<span className="text-muted-foreground text-right text-sm sm:text-base">
									{distance.elevationGain?.toLocaleString()} ft
								</span>
							</div>
							<div className="flex items-start justify-between">
								<span className="text-foreground text-sm font-medium sm:text-base">
									Cutoff Time
								</span>
								<span className="text-muted-foreground text-right text-sm sm:text-base">
									{distance.cutoffTime} hours
								</span>
							</div>
							<div className="flex items-start justify-between">
								<span className="text-foreground text-sm font-medium sm:text-base">
									Difficulty
								</span>
								<span className="bg-accent text-accent-foreground inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize">
									{distance.difficulty}
								</span>
							</div>
							{distance.startDate && (
								<div className="flex items-start justify-between">
									<span className="text-foreground text-sm font-medium sm:text-base">
										Start Time
									</span>
									<span className="text-muted-foreground text-right text-sm wrap-break-word sm:text-base">
										{new Date(distance.startDate).toLocaleString()}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Quick Actions */}
					<div className="border-border bg-card rounded-lg border p-6 sm:p-8">
						<h3 className="text-foreground mb-4 text-lg font-semibold sm:text-xl">
							Quick Links
						</h3>
						<div className="space-y-3">
							<Link
								href={`/races/${raceSeriesSlug}`}
								className="text-primary hover:text-primary/80 block text-sm sm:text-base"
							>
								← Back to {distance.raceSeries?.name}
							</Link>
							{distance.raceSeries?.company?.website && (
								<a
									href={distance.raceSeries.company.website}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:text-primary/80 block text-sm sm:text-base"
								>
									Visit Organizer Website ↗
								</a>
							)}
							<Link
								href="/fund"
								className="text-primary hover:text-primary/80 block text-sm sm:text-base"
							>
								Learn About BIPOC Athlete Fund →
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
