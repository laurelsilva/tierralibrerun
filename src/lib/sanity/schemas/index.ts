// Documents
export {company} from './documents/company'
export {raceSeries} from './documents/raceSeries'
export {raceDistance} from './documents/raceDistance'
export {post} from './documents/post'
export {contributor} from './documents/contributor'
export {event} from './documents/event'
export {rsvpQuestion} from './objects/rsvpQuestion'

// Export as array for sanity config
import {company} from './documents/company'
import {contributor} from './documents/contributor'
import {event} from './documents/event'
import {post} from './documents/post'
import {raceDistance} from './documents/raceDistance'
import {raceSeries} from './documents/raceSeries'
import {rsvpQuestion} from './objects/rsvpQuestion'

export const schemaTypes = [
	// Documents
	company,
	raceSeries,
	raceDistance,
	post,
	contributor,
	event,
	// Objects
	rsvpQuestion
]
