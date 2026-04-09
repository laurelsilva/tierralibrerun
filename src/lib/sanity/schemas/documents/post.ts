import {defineField, defineType} from 'sanity'

export const post = defineType({
	name: 'post',
	title: 'Post',
	type: 'document',
	groups: [
		{name: 'basic', title: 'Basic Info'},
		{name: 'content', title: 'Content'},
		{name: 'relations', title: 'Relations'},
		{name: 'seo', title: 'SEO'}
	],
	fields: [
		// Basic
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule) => Rule.required().min(4).max(120),
			group: 'basic'
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'title',
				maxLength: 96
			},
			validation: (Rule) => Rule.required(),
			group: 'basic'
		}),
		defineField({
			name: 'excerpt',
			title: 'Excerpt',
			type: 'text',
			rows: 3,
			description: 'Short summary shown on listings and social previews',
			validation: (Rule) => Rule.max(240),
			group: 'basic'
		}),
		defineField({
			name: 'mainImage',
			title: 'Main Image',
			type: 'image',
			options: {hotspot: true},
			group: 'basic'
		}),
		defineField({
			name: 'imageCredit',
			title: 'Image Credit',
			type: 'string',
			description: 'Photo credit for the main image (e.g., @photographer)',
			group: 'basic'
		}),
		defineField({
			name: 'contributors',
			title: 'Contributors',
			type: 'array',
			description: 'Reference one or more contributors for this post',
			of: [
				{
					type: 'reference',
					to: [{type: 'contributor'}]
				}
			],
			validation: (Rule) => Rule.min(1),
			group: 'basic'
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published At',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
			validation: (Rule) => Rule.required(),
			group: 'basic'
		}),
		defineField({
			name: 'featured',
			title: 'Featured',
			type: 'boolean',
			initialValue: false,
			description: 'Featured posts can be highlighted in the UI',
			group: 'basic'
		}),
		defineField({
			name: 'tags',
			title: 'Tags',
			type: 'array',
			of: [{type: 'string'}],
			options: {layout: 'tags'},
			description: 'Topics or keywords for this post',
			group: 'basic'
		}),

		// Content
		defineField({
			name: 'content',
			title: 'Content',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [
						{title: 'Normal', value: 'normal'},
						{title: 'H2', value: 'h2'},
						{title: 'H3', value: 'h3'},
						{title: 'Quote', value: 'blockquote'}
					],
					lists: [
						{title: 'Bullet', value: 'bullet'},
						{title: 'Numbered', value: 'number'}
					],
					marks: {
						decorators: [
							{title: 'Strong', value: 'strong'},
							{title: 'Emphasis', value: 'em'},
							{title: 'Code', value: 'code'}
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
										validation: (Rule) => Rule.uri({allowRelative: true})
									},
									{
										name: 'openInNewTab',
										title: 'Open in new tab',
										type: 'boolean',
										initialValue: false
									}
								]
							}
						]
					}
				},
				{
					type: 'image',
					options: {hotspot: true},
					fields: [
						{
							name: 'alt',
							type: 'string',
							title: 'Alt text',
							validation: (Rule) =>
								Rule.required().error('Alt text helps with accessibility')
						},
						{
							name: 'caption',
							type: 'string',
							title: 'Caption'
						}
					]
				}
			],
			group: 'content',
			validation: (Rule) => Rule.required().min(1)
		}),

		// Relations (optional helpers for cross-linking to races)
		defineField({
			name: 'relatedRaceSeries',
			title: 'Related Race Series',
			type: 'reference',
			to: [{type: 'raceSeries'}],
			description: 'Optionally link this post to a race series',
			group: 'relations'
		}),
		defineField({
			name: 'relatedRaceDistance',
			title: 'Related Race Distance',
			type: 'reference',
			to: [{type: 'raceDistance'}],
			description: 'Optionally link this post to a race distance',
			group: 'relations'
		}),

		// SEO
		defineField({
			name: 'seo',
			title: 'SEO',
			type: 'object',
			options: {collapsible: true, collapsed: true},
			group: 'seo',
			fields: [
				defineField({
					name: 'title',
					title: 'SEO Title',
					type: 'string',
					description:
						'Overrides the default page title. Include primary keywords.',
					validation: (Rule) => Rule.max(60)
				}),
				defineField({
					name: 'description',
					title: 'Meta Description',
					type: 'text',
					rows: 3,
					description:
						'1–2 sentences summarizing the post for search results and social shares.',
					validation: (Rule) => Rule.max(160)
				}),
				defineField({
					name: 'ogImage',
					title: 'Open Graph Image',
					type: 'image',
					options: {hotspot: true},
					description:
						'Custom social share image. Falls back to main image if not provided.'
				})
			]
		})
	],
	preview: {
		select: {
			title: 'title',
			media: 'mainImage',
			contributor1: 'contributors.0.name',
			contributor2: 'contributors.1.name',
			publishedAt: 'publishedAt'
		},
		prepare({title, media, contributor1, contributor2, publishedAt}) {
			const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : ''
			const contributorLabel = [contributor1, contributor2]
				.filter(Boolean)
				.join(', ')
			const subtitle = [contributorLabel, date].filter(Boolean).join(' • ')
			return {
				title,
				subtitle,
				media
			}
		}
	},
	orderings: [
		{
			title: 'Publish date, Newest first',
			name: 'publishDateDesc',
			by: [{field: 'publishedAt', direction: 'desc'}]
		},
		{
			title: 'Publish date, Oldest first',
			name: 'publishDateAsc',
			by: [{field: 'publishedAt', direction: 'asc'}]
		},
		{
			title: 'Title A–Z',
			name: 'titleAsc',
			by: [{field: 'title', direction: 'asc'}]
		}
	]
})
