export interface SocialMedia {
	instagram?: string
	facebook?: string
	twitter?: string
	strava?: string
}

export interface Company {
	_id: string
	_type: 'company'
	name: string
	slug: {
		current: string
	}
	description?: string
	logo?: {
		asset: {
			_ref: string
			_type: 'reference'
		}
		hotspot?: boolean
	}
	website?: string
	email?: string
	phone?: string
	socialMedia?: SocialMedia
}

export interface RaceSeries {
	_id: string
	_type: 'raceSeries'
	name: string
	slug: {
		current: string
	}
	company: Company
	date: string
	location: string
	registrationUrl: string
	description?: string
	image?: {
		asset: {
			_ref: string
			_type: 'reference'
		}
		hotspot?: boolean
	}
	defaultStartTime?: string
	terrain?: 'trail' | 'road' | 'mixed' | 'track'
	difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
	distances?: RaceDistance[]
}

export interface RaceDistance {
	_id: string
	_type: 'raceDistance'
	distance: string
	slug: {
		current: string
	}
	raceSeries: RaceSeries
	price: number
	description?: string
	difficulty?: 'fun-run' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
	elevationGain?: number
	courseDistance?: number
	distanceKm?: number
	distanceMiles?: number
	timeBased?: boolean
	timeDurationHours?: number
	startDate?: string
	cutoffTime?: number
	courseDescription?: string
	qualificationRequired?: boolean
	qualificationDescription?: string
}

export interface SanityImage {
	asset: {
		_ref: string
		_type: 'reference'
	}
	hotspot?: boolean
}
