// Documents
export { company } from './documents/company'
export { raceSeries } from './documents/raceSeries'
export { raceDistance } from './documents/raceDistance'
export { post } from './documents/post'
export { contributor } from './documents/contributor'

// Export as array for sanity config
import { company } from './documents/company'
import { contributor } from './documents/contributor'
import { post } from './documents/post'
import { raceDistance } from './documents/raceDistance'
import { raceSeries } from './documents/raceSeries'

export const schemaTypes = [
	// Documents
	company,
	raceSeries,
	raceDistance,
	post,
	contributor,
]
