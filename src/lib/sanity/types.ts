import { type PortableTextBlock } from '@portabletext/types'

export interface SanityImage {
	asset: {
		_id: string
		url: string
	}
}

export interface Company {
	_id: string
	name: string
	slug: string
	description?: string
	companyType?: string
	website?: string
	email?: string
	phone?: string
	socialMedia?: {
		instagram?: string
		facebook?: string
		twitter?: string
		strava?: string
	}
	logo?: SanityImage
}

export interface RaceSeriesListItem {
	_id: string
	name: string
	slug: string
	date: string
	location: string
	description?: string
	terrain?: string
	company?: {
		name: string
		slug: string
		logo?: SanityImage
	}
	distances?: RaceDistanceListItem[]
}

export interface RaceDistanceListItem {
	_id: string
	distance: string
	slug: string
	price: number
	difficulty?: string
	elevationGain?: number
	courseDistance?: number
	distanceKm?: number
	distanceMiles?: number
	timeBased?: boolean
	timeDurationHours?: number
	startDate?: string
	cutoffTime?: number
}

export interface RaceSeriesDetail {
	_id: string
	name: string
	slug: string
	date: string
	location: string
	registrationUrl?: string
	description?: PortableTextBlock[]
	terrain?: string
	defaultStartTime?: string
	image?: SanityImage
	imageCredit?: string
	company?: {
		name: string
		slug: string
		website?: string
		email?: string
		logo?: SanityImage
	}
	coOrganizers?: Array<{
		name: string
		slug: string
		website?: string
		email?: string
		logo?: SanityImage
	}>
	distances?: RaceDistanceListItem[]
}

export interface RaceDistanceDetail {
	_id: string
	distance: string
	slug: string
	price: number
	description?: PortableTextBlock[]
	difficulty?: string
	elevationGain?: number
	courseDistance?: number
	distanceKm?: number
	distanceMiles?: number
	timeBased?: boolean
	timeDurationHours?: number
	startDate?: string
	cutoffTime?: number
	courseDescription?: PortableTextBlock[]
	qualificationRequired?: boolean
	qualificationDescription?: string
	raceSeries?: {
		_id: string
		name: string
		slug: string
		date: string
		location: string
		registrationUrl?: string
		imageCredit?: string
		company?: {
			name: string
			website?: string
			logo?: SanityImage
		}
	}
}

export interface CompanyWithRaces extends Company {
	raceSeries?: Array<{
		_id: string
		name: string
		slug: string
		date: string
		location: string
		terrain?: string
		description?: string
		image?: SanityImage
	}>
}

export interface RaceOptionForApplication {
	_id: string
	distance: string
	slug: string
	price: number
	difficulty?: string
	elevationGain?: number
	courseDistance?: number
	distanceKm?: number
	distanceMiles?: number
	timeBased?: boolean
	timeDurationHours?: number
	startDate?: string
	cutoffTime?: number
	description?: string
	raceSeries: {
		_id: string
		name: string
		slug: string
		date: string
		location: string
		registrationUrl?: string
		description?: string
		terrain?: string
		company: {
			name: string
			slug: string
			logo?: SanityImage
		}
	}
}

export interface PostListItem {
	_id: string
	title: string
	slug: string
	excerpt?: string
	mainImage?: SanityImage
	imageCredit?: string
	contributors?: Array<{
		_id: string
		name: string
		slug: string
		picture?: SanityImage
		twitterHandle?: string
		links?: Array<{ label?: string; url?: string }>
	}>
	publishedAt: string
	featured?: boolean
	tags?: string[]
	relatedRaceSeries?: {
		_id: string
		name: string
		slug: string
	} | null
	relatedRaceDistance?: {
		_id: string
		distance: string
		slug: string
	} | null
}

export interface PostDetail extends PostListItem {
	content: unknown[]
	seo?: {
		title?: string
		description?: string
		ogImage?: SanityImage
	}
}

export interface EventListItem {
	_id: string
	title: string
	slug: string
	eventType?: string
	startDateTime: string
	endDateTime?: string
	locationName?: string
	address?: string
	mapUrl?: string
	isVirtual?: boolean
	image?: SanityImage
	imageCredit?: string
	audience: 'bipoc-only' | 'everyone'
	relatedRaceSeries?: {
		_id: string
		name: string
		slug: string
	} | null
	relatedRaceDistance?: {
		_id: string
		distance: string
		slug: string
	} | null
	primaryOrganizer?: {
		name: string
		slug: string
	} | null
	collaborators?: Array<{
		name: string
		slug: string
	}> | null
	externalRsvp?: boolean
	externalRsvpUrl?: string
	rsvpEnabled?: boolean
}

export interface RsvpQuestionOption {
	label: string
	value?: string
	description?: string
}

export interface RsvpQuestion {
	key: string
	label: string
	description?: string
	type:
		| 'shortText'
		| 'longText'
		| 'yesNo'
		| 'singleSelect'
		| 'multiSelect'
		| 'checkbox'
	required?: boolean
	category?:
		| 'participation'
		| 'transportation'
		| 'healthSafety'
		| 'waiverMedia'
		| 'other'
	options?: RsvpQuestionOption[]
	allowOther?: boolean
	otherLabel?: string
	placeholder?: string
	maxLength?: number
	consentText?: string
	attachmentUrl?: string
	visibleIf?: {
		questionKey?: string
		equals?: string
		in?: string[]
	}
	ui?: {
		layout?: 'auto' | 'inline' | 'stacked' | 'twoColumn'
	}
	order?: number
}

export interface EventDetail extends EventListItem {
	excerpt?: string
	content?: unknown[]
	advancedRsvp?: boolean
	rsvpQuestions?: RsvpQuestion[]
	rsvpQuestionsPreset?: string
	rsvpLimit?: number
	rsvpStart?: string
	rsvpEnd?: string
	isCancelled?: boolean
	publishedAt?: string
}
