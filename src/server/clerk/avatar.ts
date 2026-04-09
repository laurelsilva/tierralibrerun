import 'server-only'

import { clerkClient } from '@clerk/nextjs/server'
import { cache } from 'react'

function extractClerkUserId(clerkId: string) {
	const value = clerkId.trim()
	if (!value) return null
	const lastColon = value.lastIndexOf(':')
	return lastColon >= 0 ? value.slice(lastColon + 1) : value
}

const fetchClerkAvatarByUserId = cache(async (clerkUserId: string) => {
	try {
		const client = await clerkClient()
		const clerkUser = await client.users.getUser(clerkUserId)
		return clerkUser.imageUrl || null
	} catch {
		return null
	}
})

export async function getAvatarUrlFromClerkId(clerkId?: string | null) {
	if (!clerkId) return null
	const clerkUserId = extractClerkUserId(clerkId)
	if (!clerkUserId) return null
	return fetchClerkAvatarByUserId(clerkUserId)
}
