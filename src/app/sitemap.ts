import {type MetadataRoute} from 'next'
import {getAllRaceSeries} from '@/lib/sanity/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

	// Get all race series for dynamic URLs
	const raceSeries = await getAllRaceSeries()

	// Static pages
	const staticPages = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 1
		},
		{
			url: `${baseUrl}/races`,
			lastModified: new Date(),
			changeFrequency: 'daily' as const,
			priority: 0.9
		},
		{
			url: `${baseUrl}/fund`,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 0.8
		},
		{
			url: `${baseUrl}/fund/apply`,
			lastModified: new Date(),
			changeFrequency: 'monthly' as const,
			priority: 0.7
		},
		{
			url: `${baseUrl}/donate`,
			lastModified: new Date(),
			changeFrequency: 'monthly' as const,
			priority: 0.6
		}
	]

	// Dynamic race series pages
	const raceSeriesPages = raceSeries.map((series) => ({
		url: `${baseUrl}/races/${series.slug}`,
		lastModified: new Date(series.date),
		changeFrequency: 'weekly' as const,
		priority: 0.8
	}))

	// We can't easily get race distances without additional queries,
	// but we could add them here if needed for better SEO coverage
	return [...staticPages, ...raceSeriesPages]
}
