import {defineField, defineType} from 'sanity'

export const company = defineType({
	name: 'company',
	title: 'Company',
	type: 'document',
	groups: [
		{
			name: 'basic',
			title: 'Company Info'
		},
		{
			name: 'contact',
			title: 'Contact & Social'
		}
	],
	fields: [
		defineField({
			name: 'name',
			title: 'Company Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
			group: 'basic'
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'name',
				maxLength: 96
			},
			validation: (Rule) => Rule.required(),
			group: 'basic'
		}),
		defineField({
			name: 'description',
			title: 'Company Description',
			type: 'text',
			rows: 4,
			group: 'basic'
		}),
		defineField({
			name: 'companyType',
			title: 'Company Type',
			type: 'string',
			options: {
				list: [
					{title: 'Race Company', value: 'race-company'},
					{title: 'Sponsor', value: 'sponsor'},
					{title: 'Community Support', value: 'community-support'},
					{title: 'Other', value: 'other'}
				]
			},
			validation: (Rule) => Rule.required(),
			group: 'basic'
		}),
		defineField({
			name: 'logo',
			title: 'Company Logo',
			type: 'image',
			options: {
				hotspot: true
			},
			group: 'basic'
		}),
		defineField({
			name: 'website',
			title: 'Website',
			type: 'url',
			group: 'contact'
		}),
		defineField({
			name: 'email',
			title: 'Contact Email',
			type: 'email',
			group: 'contact'
		}),
		defineField({
			name: 'phone',
			title: 'Phone Number',
			type: 'string',
			group: 'contact'
		}),
		defineField({
			name: 'socialMedia',
			title: 'Social Media',
			type: 'object',
			group: 'contact',
			fields: [
				defineField({
					name: 'instagram',
					title: 'Instagram',
					type: 'url'
				}),
				defineField({
					name: 'facebook',
					title: 'Facebook',
					type: 'url'
				}),
				defineField({
					name: 'twitter',
					title: 'Twitter/X',
					type: 'url'
				}),
				defineField({
					name: 'strava',
					title: 'Strava',
					type: 'url'
				})
			]
		})
	],
	preview: {
		select: {
			title: 'name',
			media: 'logo',
			website: 'website',
			companyType: 'companyType'
		},
		prepare({title, media, website, companyType}) {
			const typeLabel = companyType ? ` • ${companyType}` : ''
			return {
				title: title,
				subtitle:
					(website ? new URL(website).hostname : 'No website') + typeLabel,
				media: media
			}
		}
	}
})
