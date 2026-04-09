import { BroadcastClient } from './broadcast-client'

import {
	getFundLifecycleGroups,
	getActiveMentors,
	getNewsletterSubscribers,
} from '@/server/admin/email-groups'

/* =======================================================
   Server Component — data fetching layer

   getFundLifecycleGroups() runs ONE DB query + ONE Sanity query
   and splits lifecycle recipient groups in memory.
   Mentors + subscribers are fetched in parallel.
   ======================================================= */

export default async function BroadcastPage() {
	const [lifecycleGroups, mentors, subscribers] = await Promise.all([
		getFundLifecycleGroups(),
		getActiveMentors(),
		getNewsletterSubscribers(),
	])

	return (
		<BroadcastClient
			activeAthletes={lifecycleGroups.activeAthletes}
			activeRaceGroups={lifecycleGroups.activeRaceGroups}
			noLongerActiveAthletes={lifecycleGroups.noLongerActiveAthletes}
			mentors={mentors}
			subscribers={subscribers}
		/>
	)
}
