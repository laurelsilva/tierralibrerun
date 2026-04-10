/**
 * Add Gorge Waterfalls races to BIPOC Athlete Fund (idempotent upsert).
 *
 * This script creates:
 * - Company: Daybreak Racing (if not exists)
 * - Race Series: Gorge Waterfalls
 * - Race Distances: 100K, 50K, 30K
 *
 * Usage:
 *  pnpm tsx scripts/add-gorge-waterfalls.ts
 *  pnpm tsx scripts/add-gorge-waterfalls.ts --dry-run
 */

// Load environment variables from .env then .env.local (local takes precedence)
import { config as dotenv } from 'dotenv'
dotenv({ path: '.env', override: false })
dotenv({ path: '.env.local', override: true })

import { createClient } from 'next-sanity'

const serverClient = createClient({
	projectId: 'qgy6qhm1',
	dataset: 'production',
	apiVersion: '2024-01-01',
	token:
		'sk80jBVRv4zjvYITc2j2ZaH4i77DX87ZYGCo622tLrX72eIIy8d1RamWTJiPD3XvR3553M5hqhU3jexBpEW4XLNQwV8AuI9IeUFG6nYyU32FiWYnoTCf8xctP55P5IKibkGEqwVOIA76S2Y7vI8aCEYvNeFZQf7tTwTW2GVWdOQWI9ZXeVky',
	useCdn: false,
	perspective: 'published',
})

// -----------------------------
// Utilities
// -----------------------------
function slugify(input: string) {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '')
}

// -----------------------------
// Sanity helpers
// -----------------------------
async function findCompanyByName(name: string): Promise<string | null> {
	try {
		const doc = await serverClient.fetch(
			`*[_type == "company" && name == $name][0]{_id}`,
			{ name },
		)
		return doc?._id || null
	} catch (err) {
		console.warn('⚠️  company lookup failed:', name, err)
		return null
	}
}

async function findOrCreateCompany(
	name: string,
	{ dryRun = false }: { dryRun?: boolean } = {},
): Promise<string | null> {
	const existing = await findCompanyByName(name)
	if (existing) {
		console.log(`✓ Company exists: ${name} (${existing})`)
		return existing
	}

	if (dryRun) {
		console.log(`📝 [dry-run] Would create company: ${name}`)
		return 'dry-run-company-id'
	}

	try {
		const created = await serverClient.create({
			_type: 'company',
			name,
			slug: { current: slugify(name) },
		} as unknown as { _type: 'company' } & Record<string, unknown>)
		console.log(`✓ Created company: ${name} (${created._id})`)
		return created._id
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: typeof err === 'string'
					? err
					: 'Unknown error'
		console.error(`✗ Failed to create company "${name}":`, message)
		return null
	}
}

async function findRaceSeriesBySlug(slug: string): Promise<string | null> {
	try {
		const doc = await serverClient.fetch(
			`*[_type == "raceSeries" && slug.current == $slug][0]{_id}`,
			{ slug },
		)
		return doc?._id || null
	} catch (err) {
		console.warn('⚠️  race series lookup failed:', slug, err)
		return null
	}
}

async function findRaceDistanceBySlug(
	seriesId: string,
	distanceSlug: string,
): Promise<string | null> {
	try {
		const doc = await serverClient.fetch(
			`*[_type == "raceDistance" && slug.current == $distanceSlug && raceSeries._ref == $seriesId][0]{_id}`,
			{ distanceSlug, seriesId },
		)
		return doc?._id || null
	} catch (err) {
		console.warn('⚠️  race distance lookup failed:', distanceSlug, err)
		return null
	}
}

// -----------------------------
// Portable Text helpers
// -----------------------------
function makeDescriptionPortableText(text: string): Record<string, unknown>[] {
	const blocks: Record<string, unknown>[] = []
	const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0)

	for (const para of paragraphs) {
		const trimmed = para.trim()

		if (trimmed.startsWith('## ')) {
			blocks.push({
				_type: 'block',
				style: 'h2',
				markDefs: [],
				children: [
					{ _type: 'span', text: trimmed.replace(/^##\s+/, ''), marks: [] },
				],
			})
		} else if (trimmed.startsWith('### ')) {
			blocks.push({
				_type: 'block',
				style: 'h3',
				markDefs: [],
				children: [
					{ _type: 'span', text: trimmed.replace(/^###\s+/, ''), marks: [] },
				],
			})
		} else if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
			const items = trimmed
				.split(/\n/)
				.map((line) => line.replace(/^[•\-]\s+/, '').trim())
				.filter((item) => item.length > 0)

			for (const item of items) {
				blocks.push({
					_type: 'block',
					style: 'normal',
					listItem: 'bullet',
					level: 1,
					markDefs: [],
					children: [{ _type: 'span', text: item, marks: [] }],
				})
			}
		} else {
			blocks.push({
				_type: 'block',
				style: 'normal',
				markDefs: [],
				children: [{ _type: 'span', text: trimmed, marks: [] }],
			})
		}
	}

	return blocks
}

// -----------------------------
// Upsert logic
// -----------------------------
type UpsertResult =
	| { ok: true; created: boolean; id: string }
	| { ok: false; error: string }

async function upsertRaceSeries(
	input: {
		name: string
		slug: string
		companyId: string
		tierraLibreId: string | null
		date: string
		location: string
		registrationUrl: string
		description?: string
		terrain?: 'trail' | 'road' | 'mixed' | 'track'
		difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
	},
	{ dryRun = false }: { dryRun?: boolean } = {},
): Promise<UpsertResult> {
	const {
		name,
		slug,
		companyId,
		tierraLibreId,
		date,
		location,
		registrationUrl,
		description,
		terrain = 'trail',
		difficulty = 'intermediate',
	} = input

	const existing = await findRaceSeriesBySlug(slug)

	const descriptionBlocks = description
		? makeDescriptionPortableText(description)
		: undefined

	const docBase: Record<string, unknown> = {
		_type: 'raceSeries',
		name,
		slug: { current: slug },
		company: { _type: 'reference', _ref: companyId },
		date,
		location,
		registrationUrl,
		terrain,
		difficulty,
		...(descriptionBlocks &&
			descriptionBlocks.length > 0 && { description: descriptionBlocks }),
	}

	if (tierraLibreId) {
		docBase['coOrganizers'] = [{ _type: 'reference', _ref: tierraLibreId }]
	}

	if (dryRun) {
		console.log(
			`📝 [dry-run] Would ${existing ? 'update' : 'create'} race series: ${name}`,
		)
		return { ok: true, created: !existing, id: existing || 'dry-run-series-id' }
	}

	try {
		if (existing) {
			await serverClient.patch(existing).set(docBase).commit()
			console.log(`✓ Updated race series: ${name}`)
			return { ok: true, created: false, id: existing }
		} else {
			const created = await serverClient.create({
				...docBase,
				publishedAt: new Date().toISOString(),
			} as unknown as { _type: 'raceSeries' } & Record<string, unknown>)
			console.log(`✓ Created race series: ${name} (${created._id})`)
			return { ok: true, created: true, id: created._id }
		}
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: typeof err === 'string'
					? err
					: 'Unknown error'
		console.error(`✗ Failed to upsert race series "${name}":`, message)
		return { ok: false, error: message }
	}
}

async function upsertRaceDistance(
	input: {
		distance: string
		slug: string
		raceSeriesId: string
		price: number
		description?: string
		difficulty?: 'fun-run' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
		elevationGain?: number
		courseDistance?: number
		cutoffTime?: number
		courseDescription?: string
	},
	{ dryRun = false }: { dryRun?: boolean } = {},
): Promise<UpsertResult> {
	const {
		distance,
		slug,
		raceSeriesId,
		price,
		description,
		difficulty = 'intermediate',
		elevationGain,
		courseDistance,
		cutoffTime,
		courseDescription,
	} = input

	const existing = await findRaceDistanceBySlug(raceSeriesId, slug)

	const descriptionBlocks = description
		? makeDescriptionPortableText(description)
		: undefined
	const courseDescriptionBlocks = courseDescription
		? makeDescriptionPortableText(courseDescription)
		: undefined

	const docBase: Record<string, unknown> = {
		_type: 'raceDistance',
		distance,
		slug: { current: slug },
		raceSeries: { _type: 'reference', _ref: raceSeriesId },
		price,
		difficulty,
		...(descriptionBlocks &&
			descriptionBlocks.length > 0 && { description: descriptionBlocks }),
		...(elevationGain !== undefined && { elevationGain }),
		...(courseDistance !== undefined && { courseDistance }),
		...(cutoffTime !== undefined && { cutoffTime }),
		...(courseDescriptionBlocks &&
			courseDescriptionBlocks.length > 0 && {
				courseDescription: courseDescriptionBlocks,
			}),
	}

	if (dryRun) {
		console.log(
			`📝 [dry-run] Would ${existing ? 'update' : 'create'} race distance: ${distance}`,
		)
		return {
			ok: true,
			created: !existing,
			id: existing || 'dry-run-distance-id',
		}
	}

	try {
		if (existing) {
			await serverClient.patch(existing).set(docBase).commit()
			console.log(`✓ Updated race distance: ${distance}`)
			return { ok: true, created: false, id: existing }
		} else {
			const created = await serverClient.create({
				...docBase,
				publishedAt: new Date().toISOString(),
			} as unknown as { _type: 'raceDistance' } & Record<string, unknown>)
			console.log(`✓ Created race distance: ${distance} (${created._id})`)
			return { ok: true, created: true, id: created._id }
		}
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: typeof err === 'string'
					? err
					: 'Unknown error'
		console.error(`✗ Failed to upsert race distance "${distance}":`, message)
		return { ok: false, error: message }
	}
}

// -----------------------------
// Script entry
// -----------------------------
export async function addGorgeWaterfalls({
	dryRun = false,
}: { dryRun?: boolean } = {}) {
	console.log(
		`\n🚀 Adding Gorge Waterfalls to BIPOC Athlete Fund${dryRun ? ' (dry-run mode)' : ''}...\n`,
	)

	const [daybreakCompanyId, tierraLibreId] = await Promise.all([
		findOrCreateCompany('Daybreak Racing', { dryRun }),
		findCompanyByName('Tierra Libre Run'),
	])

	if (!daybreakCompanyId) {
		console.error('✗ Failed to find or create Daybreak Racing company')
		process.exit(1)
	}

	if (!tierraLibreId) {
		console.warn(
			'⚠️  Tierra Libre Run company not found, continuing without co-organizer',
		)
	}

	// Race date: April 26, 2026 (100K start at 5:00 AM PST)
	const raceDate = new Date('2026-04-26T12:00:00Z') // 5 AM PST = 12 PM UTC

	const seriesSlug = slugify('Gorge Waterfalls')
	const seriesResult = await upsertRaceSeries(
		{
			name: 'Gorge Waterfalls',
			slug: seriesSlug,
			companyId: daybreakCompanyId,
			tierraLibreId,
			date: raceDate.toISOString(),
			location: 'Cascade Locks, OR',
			registrationUrl: 'http://ultrasignup.com/register.aspx?eid=2728',
			description:
				'Trail races through the iconic Columbia River Gorge, featuring spectacular waterfalls and challenging terrain. One of the premier trail running events in the Pacific Northwest.',
			terrain: 'trail',
			difficulty: 'advanced',
		},
		{ dryRun },
	)

	if (!seriesResult.ok) {
		console.error(`✗ Failed to create race series: ${seriesResult.error}`)
		process.exit(1)
	}

	const seriesId = seriesResult.id

	// Define all three distances
	const distances = [
		{
			distance: '100K',
			slug: '100k',
			price: 275,
			description:
				'A 62-mile ultra marathon through the heart of the Columbia River Gorge. Experience iconic waterfalls, old-growth forests, and challenging climbs with stunning views of the Columbia River.',
			difficulty: 'expert' as const,
			elevationGain: 11500,
			courseDistance: 62,
			cutoffTime: 17,
			courseDescription:
				'Start at Marine Park in Cascade Locks before dawn. Climb through dense forest to reach the Historic Columbia River Highway, passing multiple iconic waterfalls including Multnomah Falls, Wahkeena Falls, and Horsetail Falls.\n\n' +
				'The course features sustained climbs to viewpoints overlooking the Columbia River Gorge, technical single track through old-growth forest, and stream crossings. Navigate steep descents and ascents while experiencing some of the most spectacular scenery in the Pacific Northwest. Return to Marine Park for the finish after a full day in the mountains.',
		},
		{
			distance: '50K',
			slug: '50k',
			price: 195,
			description:
				'A 31-mile point-to-point journey showcasing the best of Gorge waterfall country. Technical trails, significant elevation gain, and world-class scenery.',
			difficulty: 'advanced' as const,
			elevationGain: 6800,
			courseDistance: 31,
			cutoffTime: 9,
			courseDescription:
				'Start at Wahkeena Day Use Area and run west along the Historic Columbia River Highway trail system. Pass numerous waterfalls including Wahkeena Falls, Multnomah Falls, Oneonta Gorge, and Horsetail Falls.\n\n' +
				"Climb to high viewpoints with panoramic vistas of the Columbia River and surrounding peaks. Navigate technical single track through lush forest, cross wooden bridges over cascading streams, and experience the raw power of the Gorge's famous waterfalls. Finish at Marine Park in Cascade Locks.",
		},
		{
			distance: '30K',
			slug: '30k',
			price: 155,
			description:
				"An 18.6-mile point-to-point race featuring the Gorge's most iconic waterfalls. Challenging yet accessible terrain for those ready to experience world-class trail running.",
			difficulty: 'intermediate' as const,
			elevationGain: 4200,
			courseDistance: 18.6,
			cutoffTime: 6,
			courseDescription:
				"Begin at Wahkeena Day Use Area and head west on the Historic Columbia River Highway trail network. Run past Wahkeena Falls, Multnomah Falls (Oregon's tallest waterfall at 620 feet), and other stunning cascades.\n\n" +
				'The course features rolling terrain with moderate climbs, technical descents, and spectacular viewpoints overlooking the Columbia River. Experience the unique microclimate of the Gorge with its lush vegetation and dramatic rock formations. Finish at Marine Park in Cascade Locks with views of the Bridge of the Gods.',
		},
	]

	const distanceResults: UpsertResult[] = []

	for (const dist of distances) {
		const result = await upsertRaceDistance(
			{
				...dist,
				raceSeriesId: seriesId,
			},
			{ dryRun },
		)
		distanceResults.push(result)
	}

	// Update race series with distance references
	if (!dryRun && seriesResult.ok && seriesId !== 'dry-run-series-id') {
		const successfulDistances = distanceResults
			.filter((r) => r.ok && r.id !== 'dry-run-distance-id')
			.map((r) => ({
				_type: 'reference',
				_ref: (r as { ok: true; id: string }).id,
			}))

		if (successfulDistances.length > 0) {
			try {
				await serverClient
					.patch(seriesId)
					.set({
						distances: successfulDistances,
					})
					.commit()
				console.log(
					`✓ Linked ${successfulDistances.length} distances to race series`,
				)
			} catch (err) {
				console.warn('⚠️  Failed to link distances to race series:', err)
			}
		}
	}

	// Summary
	const summary = {
		company: daybreakCompanyId ? 'created/found' : 'failed',
		series: seriesResult.ok
			? seriesResult.created
				? 'created'
				: 'updated'
			: 'failed',
		'100K': distanceResults[0]?.ok
			? distanceResults[0].created
				? 'created'
				: 'updated'
			: 'failed',
		'50K': distanceResults[1]?.ok
			? distanceResults[1].created
				? 'created'
				: 'updated'
			: 'failed',
		'30K': distanceResults[2]?.ok
			? distanceResults[2].created
				? 'created'
				: 'updated'
			: 'failed',
	}

	console.log('\n──────── Summary ────────')
	console.log(`Company: ${summary.company}`)
	console.log(`Race Series: ${summary.series}`)
	console.log(`100K: ${summary['100K']}`)
	console.log(`50K: ${summary['50K']}`)
	console.log(`30K: ${summary['30K']}`)

	const failures = distanceResults
		.map((result, index) => ({ result, distance: distances[index] }))
		.filter(({ result }) => !result.ok)

	if (failures.length > 0) {
		console.log('\nErrors:')
		failures.forEach(({ result, distance }) => {
			if (!result.ok) {
				const distanceLabel = distance?.distance ?? 'Unknown distance'
				console.log(`  - ${distanceLabel}: ${result.error}`)
			}
		})
		process.exitCode = 1
	} else {
		console.log('\n✓ Gorge Waterfalls successfully added to BIPOC Athlete Fund')
	}
}

// Run if called directly
if (require.main === module) {
	const dryRun = process.argv.includes('--dry-run')
	addGorgeWaterfalls({ dryRun }).catch((e) => {
		console.error('Script failed fatally:', e)
		process.exit(1)
	})
}
