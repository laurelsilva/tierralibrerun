import {defineField, defineType} from 'sanity'

/**
 * Community Event
 * - Publish simple community events (group runs, shakeouts, workshops, volunteering, etc.)
 * - Supports linking to a race (series and optional distance)
 * - RSVP can be handled internally (enabled flag) or by linking to an external site (e.g., UltraSignup)
 * - Access control: specify if event is BIPOC-only or open to everyone (including allies)
 * - Collaborators: reference organizations (companies) already modeled in the codebase
 */
export const event = defineType({
	name: 'event',
	title: 'Event',
	type: 'document',
	groups: [
		{name: 'basic', title: 'Basic Info'},
		{name: 'details', title: 'Details'},
		{name: 'relations', title: 'Relations'},
		{name: 'rsvp', title: 'RSVP'},
		{name: 'access', title: 'Access & Audience'}
	],
	fields: [
		// Basic
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule) => Rule.required().min(3).max(140),
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
			name: 'eventType',
			title: 'Event Type',
			type: 'string',
			options: {
				list: [
					{title: 'Group Run', value: 'group-run'},
					{title: 'Shakeout Run', value: 'shakeout'},
					{title: 'Workshop', value: 'workshop'},
					{title: 'Trail Work / Volunteering', value: 'volunteering'},
					{title: 'Social / Community', value: 'social'},
					{title: 'Meetup', value: 'meetup'},
					{title: 'Virtual', value: 'virtual'}
				],
				layout: 'radio'
			},
			initialValue: 'group-run',
			validation: (Rule) => Rule.required(),
			group: 'basic'
		}),
		defineField({
			name: 'excerpt',
			title: 'Short Summary',
			type: 'text',
			rows: 3,
			description: 'Short description for listings and previews.',
			validation: (Rule) => Rule.max(240),
			group: 'basic'
		}),
		defineField({
			name: 'image',
			title: 'Cover Image',
			type: 'image',
			options: {hotspot: true},
			group: 'basic'
		}),
		defineField({
			name: 'imageCredit',
			title: 'Image Credit',
			type: 'string',
			group: 'basic'
		}),

		// Details
		defineField({
			name: 'startDateTime',
			title: 'Start Date & Time',
			type: 'datetime',
			validation: (Rule) => Rule.required(),
			group: 'details'
		}),
		defineField({
			name: 'endDateTime',
			title: 'End Date & Time',
			type: 'datetime',
			description: 'Optional end date/time (leave empty for open-ended events)',
			group: 'details'
		}),
		defineField({
			name: 'locationName',
			title: 'Location Name',
			type: 'string',
			description: 'e.g., Forest Park, Gas Works Park, Zoom, etc.',
			group: 'details'
		}),
		defineField({
			name: 'address',
			title: 'Address / Meeting Point',
			type: 'string',
			description: 'Simple address or meeting point description',
			group: 'details'
		}),
		defineField({
			name: 'mapUrl',
			title: 'Map URL',
			type: 'url',
			description: 'Link to Google Maps, AllTrails, etc.',
			group: 'details'
		}),
		defineField({
			name: 'isVirtual',
			title: 'Virtual Event',
			type: 'boolean',
			initialValue: false,
			group: 'details'
		}),
		defineField({
			name: 'content',
			title: 'Details / Notes',
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
				}
			],
			group: 'details'
		}),

		// Relations
		defineField({
			name: 'relatedRaceSeries',
			title: 'Related Race (Series)',
			type: 'reference',
			to: [{type: 'raceSeries'}],
			description: 'Optionally link this event to a supported race.',
			group: 'relations'
		}),
		defineField({
			name: 'relatedRaceDistance',
			title: 'Related Race Distance',
			type: 'reference',
			to: [{type: 'raceDistance'}],
			description: 'Optional distance for the linked race (if applicable).',
			group: 'relations'
		}),
		defineField({
			name: 'primaryOrganizer',
			title: 'Primary Organizer',
			type: 'reference',
			to: [{type: 'company'}],
			description:
				'Main organizer for this event. If your organization is the primary host, you can leave empty.',
			group: 'relations'
		}),
		defineField({
			name: 'collaborators',
			title: 'Collaborating Orgs',
			type: 'array',
			of: [{type: 'reference', to: [{type: 'company'}]}],
			description:
				'Organizations collaborating on this event (companies/orgs schema already exists).',
			group: 'relations'
		}),

		// RSVP
		defineField({
			name: 'rsvpEnabled',
			title: 'Enable Internal RSVP',
			type: 'boolean',
			initialValue: true,
			description:
				'If enabled, users can RSVP (Yes) inside our app after creating an account.',
			group: 'rsvp'
		}),
		defineField({
			name: 'rsvpLimit',
			title: 'RSVP Limit',
			type: 'number',
			description: 'Optional cap on attendees; leave empty for unlimited.',
			hidden: ({document}) =>
				document?.externalRsvp === true || document?.rsvpEnabled === false,
			group: 'rsvp'
		}),
		defineField({
			name: 'rsvpStart',
			title: 'RSVP Opens',
			type: 'datetime',
			description: 'Optional start date/time for RSVP window.',
			hidden: ({document}) => document?.externalRsvp === true,
			group: 'rsvp'
		}),
		defineField({
			name: 'rsvpEnd',
			title: 'RSVP Closes',
			type: 'datetime',
			description: 'Optional end date/time for RSVP window.',
			hidden: ({document}) => document?.externalRsvp === true,
			group: 'rsvp'
		}),
		defineField({
			name: 'externalRsvp',
			title: 'Use External RSVP',
			type: 'boolean',
			initialValue: false,
			description:
				'If true, internal RSVP is disabled and attendees will use an external link (e.g., UltraSignup, Google Form).',
			group: 'rsvp'
		}),
		defineField({
			name: 'externalRsvpUrl',
			title: 'External RSVP URL',
			type: 'url',
			description:
				'Link to the external RSVP/registration page. If set, we will show “RSVP externally” and not collect internal RSVPs.',
			hidden: ({document}) => document?.externalRsvp !== true,
			validation: (Rule) =>
				Rule.custom((val, ctx) => {
					if (ctx.document?.externalRsvp && !val) {
						return 'External RSVP is enabled; please provide a URL.'
					}
					return true
				}),
			group: 'rsvp'
		}),
		// Advanced RSVP
		defineField({
			name: 'advancedRsvp',
			title: 'Enable Advanced RSVP Questions',
			type: 'boolean',
			initialValue: false,
			description:
				'When enabled, attendees will be shown a questionnaire before confirming RSVP.',
			group: 'rsvp'
		}),
		defineField({
			name: 'rsvpQuestions',
			title: 'RSVP Questions',
			type: 'array',
			of: [{type: 'rsvpQuestion'}],
			hidden: ({document}) => document?.advancedRsvp !== true,
			group: 'rsvp'
		}),
		defineField({
			name: 'rsvpQuestionsPreset',
			title: 'Preset',
			type: 'string',
			options: {
				list: [
					{title: 'None', value: 'none'},
					{title: 'Adventure Run — Standard', value: 'adventure-standard'}
				],
				layout: 'radio'
			},
			initialValue: 'none',
			description:
				'Optional preset to quickly scaffold common questions; you can still edit the array.',
			hidden: ({document}) => document?.advancedRsvp !== true,
			group: 'rsvp'
		}),

		// Access
		defineField({
			name: 'audience',
			title: 'Audience',
			type: 'string',
			options: {
				list: [
					{title: 'BIPOC-only', value: 'bipoc-only'},
					{
						title: 'Everyone (including allies)',
						value: 'everyone'
					}
				],
				layout: 'radio'
			},
			initialValue: 'everyone',
			description:
				'Choose whether this event is BIPOC-only or open to everyone (including allies).',
			validation: (Rule) => Rule.required(),
			group: 'access'
		}),
		defineField({
			name: 'isCancelled',
			title: 'Cancelled',
			type: 'boolean',
			initialValue: false,
			description:
				'Mark the event as cancelled (will still appear with status).',
			group: 'access'
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published At',
			type: 'datetime',
			description:
				'Optional publishing timestamp (Sanity publish still controls visibility).',
			group: 'access'
		})
	],
	preview: {
		select: {
			title: 'title',
			startDateTime: 'startDateTime',
			locationName: 'locationName',
			image: 'image',
			eventType: 'eventType'
		},
		prepare({title, startDateTime, locationName, image, eventType}) {
			const date = startDateTime
				? new Date(startDateTime).toLocaleString()
				: 'Date TBD'
			const typeLabel = eventType ? ` • ${eventType}` : ''
			const subtitle = [date, locationName].filter(Boolean).join(' • ')
			return {
				title: `${title || 'Untitled'}${typeLabel}`,
				subtitle,
				media: image
			}
		}
	},
	orderings: [
		{
			title: 'Date, Upcoming first',
			name: 'startDateAsc',
			by: [{field: 'startDateTime', direction: 'asc'}]
		},
		{
			title: 'Date, Latest first',
			name: 'startDateDesc',
			by: [{field: 'startDateTime', direction: 'desc'}]
		},
		{
			title: 'Title A–Z',
			name: 'titleAsc',
			by: [{field: 'title', direction: 'asc'}]
		}
	]
})

export default event
