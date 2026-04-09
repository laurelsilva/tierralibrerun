import { defineField, defineType } from 'sanity'

export const raceDistance = defineType({
	name: 'raceDistance',
	title: 'Race Distance',
	type: 'document',
	groups: [
		{
			name: 'basic',
			title: 'Basic Info',
		},
		{
			name: 'details',
			title: 'Race Details',
		},
		{
			name: 'timing',
			title: 'Timing & Cutoffs',
		},
	],
	fields: [
		defineField({
			name: 'distance',
			title: 'Distance',
			type: 'string',
			validation: (Rule) => Rule.required(),
			placeholder: 'e.g., 100 Miler, 100K, 50K, 14 Mile Fun Run',
			group: 'basic',
		}),
		defineField({
			name: 'timeBased',
			title: 'Time-Based Event',
			type: 'boolean',
			description:
				'Toggle for timed events (e.g., 6 Hour, 12 Hour) instead of fixed distance.',
			initialValue: false,
			group: 'basic',
		}),
		defineField({
			name: 'timeDurationHours',
			title: 'Timed Duration (hours)',
			type: 'number',
			description: 'Total event duration when timeBased is true.',
			group: 'basic',
			hidden: ({ document }) => !(document as any)?.timeBased,
		}),
		defineField({
			name: 'distanceKm',
			title: 'Distance (kilometers)',
			type: 'number',
			description:
				'Canonical numeric distance in kilometers (set either km or miles).',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const doc: any = context.document
					if (doc?.timeBased) return true
					const hasEither = Boolean(value || doc?.distanceMiles)
					return (
						hasEither || 'Provide distance in km or miles (or mark time-based)'
					)
				}).min(0),
			group: 'basic',
		}),
		defineField({
			name: 'distanceMiles',
			title: 'Distance (miles)',
			type: 'number',
			description:
				'Canonical numeric distance in miles (set either miles or km).',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const doc: any = context.document
					if (doc?.timeBased) return true
					const hasEither = Boolean(value || doc?.distanceKm)
					return (
						hasEither || 'Provide distance in miles or km (or mark time-based)'
					)
				}).min(0),
			group: 'basic',
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'distance',
				maxLength: 96,
			},
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'raceSeries',
			title: 'Race Series',
			type: 'reference',
			to: [{ type: 'raceSeries' }],
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'price',
			title: 'Price',
			type: 'number',
			validation: (Rule) => Rule.required().min(0),
			group: 'basic',
		}),
		defineField({
			name: 'description',
			title: 'Distance Description',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [
						{ title: 'Normal', value: 'normal' },
						{ title: 'H2', value: 'h2' },
						{ title: 'H3', value: 'h3' },
						{ title: 'Quote', value: 'blockquote' },
					],
					lists: [
						{ title: 'Bullet', value: 'bullet' },
						{ title: 'Numbered', value: 'number' },
					],
					marks: {
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Emphasis', value: 'em' },
							{ title: 'Code', value: 'code' },
						],
						annotations: [
							{
								name: 'link',
								type: 'object',
								title: 'Link',
								fields: [
									{
										name: 'href',
										type: 'url',
										title: 'URL',
										validation: (Rule) => Rule.uri({ allowRelative: true }),
									},
									{
										name: 'openInNewTab',
										title: 'Open in new tab',
										type: 'boolean',
										initialValue: false,
									},
								],
							},
						],
					},
				},
			],
			group: 'details',
		}),
		defineField({
			name: 'difficulty',
			title: 'Difficulty Level',
			type: 'string',
			description:
				'Choose a welcoming difficulty label that helps athletes find races that match their experience level.',
			options: {
				list: [
					{ title: 'Everyone Welcome', value: 'everyone-welcome' },
					{ title: 'Great First Trail Race', value: 'great-first-trail-race' },
					{ title: 'Ready for More', value: 'ready-for-more' },
					{ title: 'Going the Distance', value: 'going-the-distance' },
					{ title: 'Mountain Tested', value: 'mountain-tested' },
				],
			},
			group: 'details',
		}),
		defineField({
			name: 'elevationGain',
			title: 'Elevation Gain (ft)',
			type: 'number',
			group: 'details',
		}),
		defineField({
			name: 'courseDistance',
			title: 'Course Distance (miles)',
			type: 'number',
			group: 'details',
		}),
		defineField({
			name: 'startDate',
			title: 'Start Date',
			type: 'datetime',
			group: 'timing',
		}),
		defineField({
			name: 'cutoffTime',
			title: 'Cutoff Time (hours)',
			type: 'number',
			description: 'Total time allowed to complete the race',
			group: 'timing',
		}),
		defineField({
			name: 'courseDescription',
			title: 'Course Description',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [
						{ title: 'Normal', value: 'normal' },
						{ title: 'H2', value: 'h2' },
						{ title: 'H3', value: 'h3' },
						{ title: 'Quote', value: 'blockquote' },
					],
					lists: [
						{ title: 'Bullet', value: 'bullet' },
						{ title: 'Numbered', value: 'number' },
					],
					marks: {
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Emphasis', value: 'em' },
							{ title: 'Code', value: 'code' },
						],
						annotations: [
							{
								name: 'link',
								type: 'object',
								title: 'Link',
								fields: [
									{
										name: 'href',
										type: 'url',
										title: 'URL',
										validation: (Rule) => Rule.uri({ allowRelative: true }),
									},
									{
										name: 'openInNewTab',
										title: 'Open in new tab',
										type: 'boolean',
										initialValue: false,
									},
								],
							},
						],
					},
				},
			],
			description: 'Detailed description of the course terrain and highlights',
			group: 'details',
		}),
		defineField({
			name: 'qualificationRequired',
			title: 'Qualification Required',
			type: 'boolean',
			initialValue: false,
			group: 'details',
		}),
		defineField({
			name: 'qualificationDescription',
			title: 'Qualification Requirements',
			type: 'text',
			rows: 4,
			description: 'Details about qualification standards if required',
			group: 'details',
			hidden: ({ document }) => !document?.qualificationRequired,
		}),
	],
	preview: {
		select: {
			title: 'distance',
			subtitle: 'raceSeries.name',
			price: 'price',
			difficulty: 'difficulty',
			km: 'distanceKm',
			mi: 'distanceMiles',
		},
		prepare({ title, subtitle, price, difficulty, km, mi }) {
			const difficultyLabel = difficulty ? ` • ${difficulty}` : ''
			const numeric = km ? `${km} km` : mi ? `${mi} mi` : ''
			const distanceLabel = numeric ? `${title} • ${numeric}` : title
			return {
				title: distanceLabel,
				subtitle: `${subtitle || 'Unknown Race'} • $${price}${difficultyLabel}`,
			}
		},
	},
	orderings: [
		{
			title: 'Distance A-Z',
			name: 'distanceAsc',
			by: [{ field: 'distance', direction: 'asc' }],
		},
		{
			title: 'Price, Low to High',
			name: 'priceAsc',
			by: [{ field: 'price', direction: 'asc' }],
		},
		{
			title: 'Price, High to Low',
			name: 'priceDesc',
			by: [{ field: 'price', direction: 'desc' }],
		},
	],
})
