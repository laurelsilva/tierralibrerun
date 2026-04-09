import { type PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from 'next-sanity'
import { type ReactNode } from 'react'
import CompanyLogo from '@/components/company-logo'
import { FundApplyButton } from '@/components/fund-apply-button'
import { Button } from '@/components/ui/button'
import { generateRaceSeriesMetadata } from '@/lib/metadata'
import { getRaceSeriesBySlug } from '@/lib/sanity/queries'
import { type RaceDistanceListItem } from '@/lib/sanity/types'

export const revalidate = 60

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
			children: ReactNode
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

export async function generateMetadata({
	params,
}: {
	params: Promise<{ raceSeriesSlug: string }>
}) {
	const { raceSeriesSlug } = await params
	const series = await getRaceSeriesBySlug(raceSeriesSlug)

	if (!series) {
		return {
			title: 'Race Not Found | Trail Running Community',
			description: 'The requested race series could not be found.',
		}
	}

	return generateRaceSeriesMetadata(series)
}

export default async function RaceSeriesPage({
	params,
}: {
	params: Promise<{ raceSeriesSlug: string }>
}) {
	const { raceSeriesSlug } = await params
	const series = await getRaceSeriesBySlug(raceSeriesSlug)

	if (!series) {
		notFound()
	}

	return (
		<div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
			{/* Breadcrumb */}
			<nav className="mb-8">
				<Link
					href="/races"
					className="text-muted-foreground hover:text-primary text-sm"
				>
					← Back to All Races
				</Link>
			</nav>

			{/* Hero Section with Background Image */}
			{series.image?.asset?.url ? (
				<div className="relative mb-12 w-full overflow-hidden rounded-2xl">
					{/* Image Container */}
					<div className="relative h-[75vh] max-h-[700px] min-h-[500px]">
						<Image
							src={`${series.image.asset.url}?w=1920&h=1080&fit=crop&auto=format`}
							alt={series.name}
							fill
							priority
							quality={85}
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
							className="object-cover object-top"
							placeholder="blur"
							blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
						/>
						{/* Gradient Overlay - dark at bottom for text */}
						<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
					</div>

					{/* Content - Positioned at bottom */}
					<div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
						<div className="max-w-4xl">
							{/* Company Logo */}
							<div className="mb-6">
								<CompanyLogo
									logo={series.company?.logo}
									companyName={series.company?.name || 'Unknown Company'}
									width={64}
									height={64}
									variant="hero"
								/>
							</div>

							{/* Title */}
							<h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
								{series.name}
							</h1>

							{/* Meta info */}
							<p className="mb-5 text-base text-white/80 sm:text-lg">
								{new Date(series.date).toLocaleDateString('en-US', {
									weekday: 'long',
									month: 'long',
									day: 'numeric',
									year: 'numeric',
								})}{' '}
								• {series.location}
							</p>

							{/* Badge */}
							<span className="bg-primary text-primary-foreground inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium">
								BIPOC Athlete Fund Supported
							</span>
						</div>
					</div>

					{/* Photo Credit */}
					{series.imageCredit && (
						<div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
							📷 {series.imageCredit}
						</div>
					)}
				</div>
			) : (
				<div className="bg-card border-border mb-8 rounded-lg border p-6 sm:p-8">
					<div className="text-center">
						<CompanyLogo
							logo={series.company?.logo}
							companyName={series.company?.name || 'Unknown Company'}
							width={80}
							height={80}
							className="mx-auto mb-6 sm:h-30 sm:w-30"
						/>
						<h1 className="text-foreground mb-4 text-3xl font-bold wrap-break-word sm:text-4xl lg:text-6xl">
							{series.name}
						</h1>
						<p className="text-muted-foreground mb-4 text-lg wrap-break-word sm:text-xl">
							Organized by {series.company?.name}
						</p>
						{series.coOrganizers && series.coOrganizers.length > 0 && (
							<p className="text-muted-foreground mb-6 text-sm sm:text-base">
								{series.coOrganizers.map((org) => org.name).join(', ')}
							</p>
						)}
						<div>
							<span className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium">
								BIPOC Athlete Fund Supported
							</span>
						</div>
					</div>
				</div>
			)}

			<div className="border-border mb-8 border-b pb-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
						<div>
							<dt className="text-muted-foreground text-xs font-medium">
								Date
							</dt>
							<dd className="text-foreground mt-1 text-sm font-semibold">
								{new Date(series.date).toLocaleDateString('en-US', {
									weekday: 'short',
									month: 'short',
									day: 'numeric',
								})}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs font-medium">
								Location
							</dt>
							<dd className="text-foreground mt-1 text-sm font-semibold wrap-break-word">
								{series.location}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs font-medium">
								Terrain
							</dt>
							<dd className="text-foreground mt-1 text-sm font-semibold capitalize">
								{series.terrain || '—'}
							</dd>
						</div>
						{series.defaultStartTime && (
							<div>
								<dt className="text-muted-foreground text-xs font-medium">
									Start time
								</dt>
								<dd className="text-foreground mt-1 text-sm font-semibold">
									{new Date(series.defaultStartTime).toLocaleTimeString([], {
										hour: 'numeric',
										minute: '2-digit',
									})}
								</dd>
							</div>
						)}
					</dl>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						{series.registrationUrl && (
							<Button asChild>
								<a
									href={series.registrationUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									Register ↗
								</a>
							</Button>
						)}
						<FundApplyButton label="Apply for Support" />
						<Button variant="outline" asChild>
							<Link href="/fund">Fund Info</Link>
						</Button>
					</div>
				</div>
			</div>

			<div className="space-y-8">
				{/* Description */}
				{series.description && (
					<div className="border-border bg-card rounded-lg border p-6 sm:p-8">
						<h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
							About This Race
						</h2>
						<div className="prose prose-sm sm:prose-base max-w-none">
							<PortableText
								value={
									Array.isArray(series.description)
										? (series.description as PortableTextBlock[])
										: []
								}
								components={portableTextComponents}
							/>
						</div>
					</div>
				)}

				{/* Race Distances */}
				<div className="border-border bg-card rounded-lg border p-6 sm:p-8">
					<h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
						Race Distances
					</h2>
					<p className="text-muted-foreground mb-6 text-sm sm:text-base">
					All distances are supported by our Athlete Fund. Click on any
					distance to view details and apply for funding.
					</p>
					<div className="space-y-4">
						{series.distances?.map((distance: RaceDistanceListItem) => (
							<Link
								key={distance._id}
								href={`/races/${raceSeriesSlug}/${distance.slug}`}
								prefetch={true}
								className="block"
							>
								<div className="group border-border bg-background hover:border-primary/50 hover:bg-accent/20 rounded-lg border p-4 transition-all sm:p-5">
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0 flex-1">
											<h3 className="text-foreground group-hover:text-primary mb-1 text-lg font-semibold wrap-break-word transition-colors sm:text-xl">
												{distance.distance}
											</h3>
										</div>
										<div className="flex shrink-0 items-center gap-3">
											<span className="text-foreground text-lg font-bold sm:text-xl">
												${distance.price}
											</span>
											<span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize">
												{distance.difficulty}
											</span>
										</div>
									</div>
									<div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3 sm:gap-4">
										<div>
											<span className="text-muted-foreground font-medium">
												Distance:
											</span>
											<span className="text-foreground ml-2">
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
										<div>
											<span className="text-muted-foreground font-medium">
												Elevation:
											</span>
											<span className="text-foreground ml-2">
												{distance.elevationGain?.toLocaleString()} ft
											</span>
										</div>
										<div>
											<span className="text-muted-foreground font-medium">
												Cutoff:
											</span>
											<span className="text-foreground ml-2">
												{distance.cutoffTime} hours
											</span>
										</div>
									</div>

									<div className="mt-4 flex items-center justify-end">
										<span className="text-primary group-hover:text-primary/80 text-sm font-medium">
											View Details →
										</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>

			</div>
		</div>
	)
}
