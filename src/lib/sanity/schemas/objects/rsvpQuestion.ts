import {defineField, defineType} from 'sanity'

/**
 * RSVP Question (object)
 *
 * Flexible, reusable schema to attach dynamic RSVP questions to Events.
 * Designed to be:
 * - Swappable across events (use the `key` to map saved answers)
 * - Compatible with shadcn/ui components (text, selects, checkboxes, etc.)
 * - Future-proof (sections, conditional visibility, attachments)
 *
 * Typical storage:
 * - Use the `key` as the JSON key when saving answers in your DB
 * - For multi-select answers, store an array of string values
 */
export const rsvpQuestion = defineType({
	name: 'rsvpQuestion',
	title: 'RSVP Question',
	type: 'object',
	fields: [
		// Stable storage key, required for DB mapping
		defineField({
			name: 'key',
			title: 'Key (storage id)',
			type: 'string',
			description:
				'Stable, URL-safe key used to store the answer in the DB (e.g., "movementOption", "dietaryRestrictions").',
			validation: (Rule) =>
				Rule.required()
					.regex(/^[a-z0-9_\-]+$/i, {
						name: 'url-safe',
						invert: false
					})
					.error(
						'Provide a URL-safe key using letters, numbers, dashes, or underscores.'
					)
		}),

		// Optional grouping for nicer UI layout in the app
		defineField({
			name: 'category',
			title: 'Section',
			type: 'string',
			options: {
				list: [
					{title: 'Participation Details', value: 'participation'},
					{title: 'Transportation', value: 'transportation'},
					{title: 'Health & Safety', value: 'healthSafety'},
					{title: 'Waiver & Media Release', value: 'waiverMedia'},
					{title: 'Other', value: 'other'}
				],
				layout: 'radio'
			},
			initialValue: 'participation'
		}),

		// Main question label and optional help text
		defineField({
			name: 'label',
			title: 'Question',
			type: 'string',
			validation: (Rule) => Rule.required().min(3).max(180)
		}),
		defineField({
			name: 'description',
			title: 'Help text',
			type: 'text',
			rows: 3
		}),

		// Input type — map these to shadcn/ui components in the app
		defineField({
			name: 'type',
			title: 'Input Type',
			type: 'string',
			options: {
				list: [
					{title: 'Short text', value: 'shortText'}, // Input
					{title: 'Long text', value: 'longText'}, // Textarea
					{title: 'Yes / No', value: 'yesNo'}, // Radio inline
					{title: 'Single select', value: 'singleSelect'}, // Radio or Select
					{title: 'Multi select (checkboxes)', value: 'multiSelect'}, // Checkbox group
					{title: 'Confirmation checkbox', value: 'checkbox'} // Single checkbox
				],
				layout: 'radio'
			},
			validation: (Rule) => Rule.required()
		}),

		// Required
		defineField({
			name: 'required',
			title: 'Required',
			type: 'boolean',
			initialValue: false
		}),

		// Options for selects and yes/no
		defineField({
			name: 'options',
			title: 'Options',
			type: 'array',
			of: [
				defineField({
					name: 'rsvpOption',
					title: 'Option',
					type: 'object',
					fields: [
						defineField({
							name: 'label',
							title: 'Label',
							type: 'string',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'value',
							title: 'Value',
							type: 'string',
							description:
								'If empty, the value will be derived from the label (lowercased, hyphenated).'
						}),
						defineField({
							name: 'description',
							title: 'Description (optional)',
							type: 'string'
						})
					],
					preview: {
						select: {title: 'label', subtitle: 'value'}
					}
				})
			],
			description:
				'Provide options for Single/Multi Select, or customize Yes/No labels if desired.',
			hidden: ({parent}) =>
				!(
					parent?.type === 'singleSelect' ||
					parent?.type === 'multiSelect' ||
					parent?.type === 'yesNo'
				),
			validation: (Rule) =>
				Rule.custom((val, ctx) => {
					const t = (ctx.parent as {type?: string} | undefined)?.type
					if (
						(t === 'singleSelect' || t === 'multiSelect') &&
						(!val || val.length < 1)
					) {
						return 'Provide at least one option'
					}
					return true
				})
		}),

		// Allow "Other" free-text for select types
		defineField({
			name: 'allowOther',
			title: 'Allow "Other" free text',
			type: 'boolean',
			initialValue: false,
			hidden: ({parent}) =>
				!(parent?.type === 'singleSelect' || parent?.type === 'multiSelect')
		}),
		defineField({
			name: 'otherLabel',
			title: '"Other" label',
			type: 'string',
			initialValue: 'Other',
			hidden: ({parent}) => !parent?.allowOther
		}),

		// Text UX
		defineField({
			name: 'placeholder',
			title: 'Placeholder',
			type: 'string',
			hidden: ({parent}) =>
				!(parent?.type === 'shortText' || parent?.type === 'longText')
		}),
		defineField({
			name: 'maxLength',
			title: 'Max Length',
			type: 'number',
			description: 'Optional character limit for text responses.',
			hidden: ({parent}) =>
				!(parent?.type === 'shortText' || parent?.type === 'longText')
		}),

		// Consent / Waiver content for checkbox or yes/no
		defineField({
			name: 'consentText',
			title: 'Consent text (for checkbox / yes-no)',
			type: 'text',
			rows: 4,
			hidden: ({parent}) =>
				!(parent?.type === 'checkbox' || parent?.type === 'yesNo')
		}),
		defineField({
			name: 'attachment',
			title: 'Attachment (PDF/Image)',
			type: 'file',
			options: {storeOriginalFilename: true},
			description:
				'Optional reference (e.g., waiver PDF, route map, or additional info).'
		}),

		// Conditional visibility
		defineField({
			name: 'visibleIf',
			title: 'Show only if…',
			type: 'object',
			options: {collapsible: true, collapsed: true},
			fields: [
				defineField({
					name: 'questionKey',
					title: 'Question key',
					type: 'string',
					description: 'Show this question only when another answer matches.'
				}),
				defineField({
					name: 'equals',
					title: 'Equals value',
					type: 'string',
					description:
						'Show when the referenced answer equals this value (string or boolean as string).'
				}),
				defineField({
					name: 'in',
					title: 'In values',
					type: 'array',
					of: [{type: 'string'}],
					description:
						'Alternatively, show when the referenced answer is one of these values.'
				})
			]
		}),

		// UI hints (non-functional metadata for the renderer)
		defineField({
			name: 'ui',
			title: 'UI Hints',
			type: 'object',
			options: {collapsible: true, collapsed: true},
			fields: [
				defineField({
					name: 'layout',
					title: 'Layout',
					type: 'string',
					options: {
						list: [
							{title: 'Auto', value: 'auto'},
							{title: 'Inline (compact)', value: 'inline'},
							{title: 'Stacked (default)', value: 'stacked'},
							{title: 'Two columns', value: 'twoColumn'}
						],
						layout: 'radio'
					},
					initialValue: 'stacked'
				})
			]
		}),

		// Manual ordering within a section
		defineField({
			name: 'order',
			title: 'Order',
			type: 'number',
			description: 'Optional manual order within its section.'
		})
	],
	preview: {
		select: {
			title: 'label',
			type: 'type',
			required: 'required',
			category: 'category'
		},
		prepare({title, type, required, category}) {
			const chips = [
				category ? String(category) : null,
				type ? String(type) : null,
				required ? 'required' : null
			]
				.filter(Boolean)
				.join(' • ')
			return {
				title: title || 'Untitled question',
				subtitle: chips
			}
		}
	}
})

export default rsvpQuestion
