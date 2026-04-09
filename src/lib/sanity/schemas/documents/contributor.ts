import {defineField, defineType} from 'sanity'

export const contributor = defineType({
	name: 'contributor',
	title: 'Contributor',
	// icon removed to avoid dependency on @sanity/icons
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required().min(2).max(120)
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			validation: (Rule) => Rule.required(),
			options: {
				source: 'name',
				maxLength: 96
			}
		}),
		defineField({
			name: 'twitterHandle',
			title: 'Twitter handle',
			type: 'string',
			description: 'Without @ symbol (e.g., myhandle)',
			validation: (Rule) =>
				Rule.custom((val) => {
					if (!val) return true
					return String(val).startsWith('@')
						? 'Do not include the @ symbol'
						: true
				})
		}),
		defineField({
			name: 'saleAnnounceChannel',
			title: 'Slack Sale Announce Channel',
			type: 'string',
			description: 'The Ding Ding channel to announce sales (optional)'
		}),
		defineField({
			name: 'slackChannel',
			title: 'CC Slack Contributor Channel',
			type: 'string',
			description: 'The contributors work group in Slack (optional)'
		}),
		defineField({
			name: 'userId',
			title: 'User ID',
			type: 'string',
			description: 'The contributor ID in our database (optional)'
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			description: 'A short bio about the author.',
			type: 'text',
			rows: 4,
			validation: (Rule) => Rule.max(500)
		}),
		defineField({
			name: 'picture',
			title: 'Picture',
			type: 'image',
			options: {hotspot: true},
			fields: [
				defineField({
					name: 'alt',
					type: 'string',
					title: 'Alternative text',
					description: 'Important for accessibility.',
					validation: (Rule) => Rule.required()
				})
			],
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'links',
			title: 'Links',
			type: 'array',
			of: [
				defineField({
					type: 'object',
					name: 'link',
					title: 'Link',
					fields: [
						defineField({
							name: 'label',
							type: 'string',
							title: 'Label',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'url',
							type: 'url',
							title: 'URL',
							validation: (Rule) =>
								Rule.uri({
									allowRelative: false,
									scheme: ['http', 'https']
								}).required()
						})
					],
					preview: {
						select: {title: 'label', subtitle: 'url'}
					}
				})
			]
		})
	],
	preview: {
		select: {
			title: 'name',
			media: 'picture',
			twitter: 'twitterHandle'
		},
		prepare({title, media, twitter}) {
			const subtitle = twitter ? `@${twitter}` : undefined
			return {
				title,
				subtitle,
				media
			}
		}
	}
})
