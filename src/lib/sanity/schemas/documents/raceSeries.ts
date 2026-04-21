import { defineField, defineType } from 'sanity'

export const raceSeries = defineType({
	name: 'raceSeries',
	title: 'Race Series',
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
			name: 'fund',
			title: 'Fund Support',
		},
	],
	fields: [
		defineField({
			name: 'name',
			title: 'Race Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'name',
				maxLength: 96,
			},
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'company',
			title: 'Race Company',
			type: 'reference',
			to: [{ type: 'company' }],
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'coOrganizers',
			title: 'Co-organizers',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{ type: 'company' }],
				},
			],
			description: 'Additional organizing partners (e.g., your community org)',
			group: 'basic',
		}),
		defineField({
			name: 'date',
			title: 'Race Date',
			type: 'datetime',
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'string',
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'registrationUrl',
			title: 'Registration URL',
			type: 'url',
			validation: (Rule) => Rule.required(),
			group: 'basic',
		}),
		defineField({
			name: 'description',
			title: 'Race Description',
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
			name: 'image',
			title: 'Race Image',
			type: 'image',
			options: {
				hotspot: true,
			},
			group: 'details',
		}),
		defineField({
			name: 'imageCredit',
			title: 'Image Credit',
			type: 'string',
			description: 'Photo credit for the race image (e.g., @sn_imagery)',
			group: 'details',
		}),
		defineField({
			name: 'defaultStartTime',
			title: 'Default Start Time',
			type: 'datetime',
			description:
				'Default start time for all distances (can be overridden per distance)',
			group: 'details',
		}),
		defineField({
			name: 'terrain',
			title: 'Terrain Type',
			type: 'string',
			options: {
				list: [
					{ title: 'Trail', value: 'trail' },
					{ title: 'Road', value: 'road' },
					{ title: 'Mixed', value: 'mixed' },
					{ title: 'Track', value: 'track' },
				],
			},
			group: 'details',
		}),

		defineField({
			name: 'distances',
			title: 'Race Distances',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{ type: 'raceDistance' }],
				},
			],
			group: 'details',
		}),
		defineField({
			name: 'archived',
			title: 'Archived',
			type: 'boolean',
			initialValue: false,
			description:
				'Mark this race as archived to hide it from the main race listings',
			group: 'basic',
		}),
	],
	preview: {
		select: {
			title: 'name',
			subtitle: 'company.name',
			media: 'image',
			date: 'date',
		},
		prepare({ title, subtitle, media, date }) {
			const formattedDate = date
				? new Date(date).toLocaleDateString()
				: 'No date'
			return {
				title: title,
				subtitle: `${subtitle || 'Unknown Company'} • ${formattedDate}`,
				media,
			}
		},
	},
	orderings: [
		{
			title: 'Date, Latest',
			name: 'dateDesc',
			by: [{ field: 'date', direction: 'desc' }],
		},
		{
			title: 'Date, Earliest',
			name: 'dateAsc',
			by: [{ field: 'date', direction: 'asc' }],
		},
		{
			title: 'Name A-Z',
			name: 'nameAsc',
			by: [{ field: 'name', direction: 'asc' }],
		},
	],
})
