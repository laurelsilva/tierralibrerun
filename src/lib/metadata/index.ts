import { type PortableTextBlock } from '@portabletext/types'
import { type Metadata } from 'next'
import { siteConfig, socialConfig } from '@/lib/config/site'

export interface SEOConfig {
	title: string
	description: string
	keywords?: string[]
	image?: string
	url?: string
	type?: 'website' | 'article'
	author?: string
	publishedTime?: string
	modifiedTime?: string
}

const defaultConfig = {
	siteName: siteConfig.name,
	siteUrl: siteConfig.url,
	description: siteConfig.description,
	image: siteConfig.defaultOgImage,
	twitter: socialConfig.twitterHandle ? `@${socialConfig.twitterHandle}` : '',
	locale: siteConfig.locale,
}

export function generateMetadata(config: SEOConfig): Metadata {
	const {
		title,
		description,
		keywords = [],
		image = defaultConfig.image,
		url,
		type = 'website',
		author,
		publishedTime,
		modifiedTime,
	} = config

	const fullTitle = title.includes(defaultConfig.siteName)
		? title
		: `${title} | ${defaultConfig.siteName}`

	const fullUrl = url ? `${defaultConfig.siteUrl}${url}` : defaultConfig.siteUrl
	const fullImageUrl = image.startsWith('http')
		? image
		: `${defaultConfig.siteUrl}${image}`

	const metadata: Metadata = {
		title: fullTitle,
		description,
		keywords: keywords.length > 0 ? keywords.join(', ') : undefined,

		// Open Graph
		openGraph: {
			title: fullTitle,
			description,
			url: fullUrl,
			siteName: defaultConfig.siteName,
			locale: defaultConfig.locale,
			type,
			images: [
				{
					url: fullImageUrl,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},

		// Twitter
		twitter: {
			card: 'summary_large_image',
			title: fullTitle,
			description,
			images: [fullImageUrl],
			creator: defaultConfig.twitter,
		},

		// Additional metadata
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				'max-video-preview': -1,
				'max-image-preview': 'large',
				'max-snippet': -1,
			},
		},

		// Canonical URL
		alternates: {
			canonical: fullUrl,
		},
	}

	// Add article-specific metadata
	if (type === 'article') {
		metadata.openGraph = {
			...metadata.openGraph,
			type: 'article',
			authors: author ? [author] : undefined,
			publishedTime,
			modifiedTime,
		}
	}

	// Add author if provided
	if (author) {
		metadata.authors = [{ name: author }]
	}

	return metadata
}

// Static page metadata generators (for pages without dynamic Sanity data)
export const homeMetadata = generateMetadata({
	title: `${siteConfig.name} - Trail Running Community`,
	description:
		'Join our trail running community led by people of color, building authentic connections through nature. Apply for race funding and connect with fellow athletes.',
	keywords: [
		'trail running',
		'athletes',
		'community',
		'nature',
		'race funding',
	],
	url: '/',
})

export const fundMetadata = generateMetadata({
	title: 'Athlete Fund - Race Entry Fee Support',
	description:
		'Apply for funding to cover your trail race entry fees. Our athlete fund supports athletes at all levels and distances.',
	keywords: [
		'athlete fund',
		'race funding',
		'athletes',
		'trail running support',
		'entry fees',
	],
	url: '/fund',
})

export const donateMetadata = generateMetadata({
	title: `Support Our Mission - Donate to ${siteConfig.name}`,
	description:
		'Help us support athletes by donating to our athlete fund. Your contribution directly funds race entry fees and community programs.',
	keywords: [
		'donate',
		'support',
		'athletes',
		'trail running fund',
		'community support',
	],
	url: '/donate',
})

export const fundApplyMetadata = generateMetadata({
	title: 'Apply for Race Funding - Athlete Fund',
	description:
		'Apply for funding to cover your trail race entry fees through our athlete fund. Submit your application to get support for your next trail running adventure.',
	keywords: [
		'athlete fund application',
		'race funding',
		'athletes',
		'trail running support',
		'apply for funding',
	],
	url: '/fund/apply',
})

export const dashboardMetadata = generateMetadata({
	title: 'Account Dashboard - Manage Your Profile',
	description: `Manage your ${siteConfig.name} account, view your funding applications, and track your community involvement.`,
	keywords: ['dashboard', 'account', 'profile', 'applications', 'user account'],
	url: '/dashboard',
})

// Metadata generator for races page (uses Sanity data)
export function generateRacesMetadata(
	racesData?: Array<{ name: string; location: string }>,
) {
	const raceCount = racesData?.length || 0
	const locations =
		racesData
			?.map((race) => race.location)
			.slice(0, 3)
			.join(', ') || 'various locations'

	return generateMetadata({
		title: 'Trail Races - Find Your Next Adventure',
		description:
			raceCount > 0
				? `Discover ${raceCount} trail races in ${locations} and more. Browse race series, compare distances, and apply for funding through our athlete fund.`
				: 'Discover trail races across all distances and locations. Browse race series, compare distances, and apply for funding through our athlete fund.',
		keywords: [
			'trail races',
			'ultramarathon',
			'race registration',
			'trail running',
		],
		url: '/races',
	})
}

export const companiesMetadata = generateMetadata({
	title: 'Race Companies and Partners',
	description: `Explore the race companies partnering with ${siteConfig.name} and see the races they support through the Athlete Fund.`,
	keywords: ['race companies', 'race organizers', 'trail running partners'],
	url: '/companies',
})

export function generateCompanyMetadata(company: {
	name: string
	description?: string | PortableTextBlock[]
	slug: string
	raceSeries?: Array<{
		name: string
		slug: string
		date?: string
		location?: string
	}>
}) {
	const descriptionText = Array.isArray(company.description)
		? portableTextToPlainText(company.description)
		: company.description

	const raceNames =
		company.raceSeries?.slice(0, 3).map((race) => race.name) || []
	const racesSnippet =
		raceNames.length > 0
			? `Races: ${raceNames.join(', ')}.`
			: 'Race organizer supporting the BIPOC Athlete Fund.'

	return generateMetadata({
		title: `${company.name} - Race Company Profile`,
		description:
			descriptionText ||
			`Learn more about ${company.name}, a ${siteConfig.name} partner. ${racesSnippet}`,
		keywords: [company.name, 'race company', 'trail running', 'race organizer'],
		url: `/companies/${company.slug}`,
	})
}

// Dynamic metadata generators
export function generateRaceSeriesMetadata(series: {
	name: string
	description?: string | PortableTextBlock[]
	location: string
	date: string
	slug: string
	image?: { asset?: { url: string } }
	company?: { name: string }
}) {
	const title = `${series.name} - Trail Race Series`

	// Handle both string and PortableTextBlock[] descriptions
	const descriptionText = Array.isArray(series.description)
		? portableTextToPlainText(series.description)
		: series.description

	const description =
		descriptionText ||
		`Join the ${series.name} trail race in ${series.location}. Organized by ${series.company?.name || 'professional race organizers'}. Apply for funding through our athlete fund.`

	const image = series.image?.asset?.url || siteConfig.defaultOgImage

	return generateMetadata({
		title,
		description,
		keywords: ['trail race', series.name, series.location, 'race registration'],
		image,
		url: `/races/${series.slug}`,
		type: 'article',
		author: series.company?.name,
		publishedTime: series.date,
	})
}

/**
 * Extract plain text from Portable Text blocks
 */
function portableTextToPlainText(blocks?: PortableTextBlock[]): string {
	if (!blocks || !Array.isArray(blocks)) return ''

	return blocks
		.map((block) => {
			if (block._type === 'block' && block.children) {
				return block.children
					.map((child) => {
						if (typeof child === 'object' && 'text' in child) {
							return child.text
						}
						return ''
					})
					.join('')
			}
			return ''
		})
		.join(' ')
		.trim()
}

export function generateRaceDistanceMetadata(distance: {
	distance: string
	description?: string | PortableTextBlock[]
	price: number
	difficulty?: string
	courseDistance?: number
	distanceKm?: number
	distanceMiles?: number
	timeBased?: boolean
	timeDurationHours?: number
	slug: string
	raceSeries?: {
		name: string
		location: string
		slug: string
		company?: { name: string }
		image?: { asset?: { url: string } }
	}
}) {
	const raceName = distance.raceSeries?.name || 'Trail Race'
	const title = `${raceName} ${distance.distance} - Race Distance Details`

	// Handle both string and PortableTextBlock[] descriptions
	const descriptionText = Array.isArray(distance.description)
		? portableTextToPlainText(distance.description)
		: distance.description

	const distanceDetail = distance.timeBased
		? `${distance.timeDurationHours ?? 'Timed'} hours`
		: distance.distanceKm
			? `${distance.distanceKm} km${distance.distanceMiles ? ` / ${distance.distanceMiles.toFixed(1)} mi` : ''}`
			: distance.distanceMiles
				? `${distance.distanceMiles} mi`
				: distance.courseDistance
					? `${distance.courseDistance} miles`
					: 'Distance info'

	const description =
		descriptionText ||
		`Race details for the ${distance.distance} (${distanceDetail}) at ${raceName}. Entry fee: $${distance.price}. Apply for funding support.`

	const image =
		distance.raceSeries?.image?.asset?.url || siteConfig.defaultOgImage

	return generateMetadata({
		title,
		description,
		keywords: [
			'trail race',
			distance.distance,
			raceName,
			distance.raceSeries?.location || 'trail running',
			'race registration',
			distance.difficulty || 'running',
		].filter(Boolean),
		image,
		url: `/races/${distance.raceSeries?.slug}/${distance.slug}`,
		type: 'article',
		author: distance.raceSeries?.company?.name,
	})
}

//
// Blog metadata helpers
//
export const blogMetadata = generateMetadata({
	title: 'Blog',
	description: `Stories, updates, and community highlights from ${siteConfig.name}`,
	url: '/blog',
})

export function generateBlogListMetadata(opts?: {
	count?: number
	firstTags?: string[]
}) {
	const { count, firstTags = [] } = opts || {}
	const tagsSnippet =
		firstTags && firstTags.length > 0
			? ` Topics: ${firstTags.slice(0, 3).join(', ')}.`
			: ''
	const description =
		typeof count === 'number' && count > 0
			? `Read ${count} posts from our community.${tagsSnippet}`
			: `Stories, updates, and community highlights from ${siteConfig.name}.`
	return generateMetadata({
		title: 'Blog',
		description,
		url: '/blog',
	})
}

export function generatePostMetadata(post: {
	title: string
	excerpt?: string
	slug: string
	mainImage?: { asset?: { url: string } }
	authorName?: string
	publishedAt?: string
	seo?: {
		title?: string
		description?: string
		ogImage?: { asset?: { url: string } }
	}
}) {
	const image =
		post.seo?.ogImage?.asset?.url ||
		post.mainImage?.asset?.url ||
		siteConfig.defaultOgImage
	return generateMetadata({
		title: post.seo?.title || post.title,
		description:
			post.seo?.description ||
			post.excerpt ||
			`${siteConfig.name} blog article`,
		image,
		url: `/blog/${post.slug}`,
		type: 'article',
		author: post.authorName,
		publishedTime: post.publishedAt,
	})
}
