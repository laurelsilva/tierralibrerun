import { type ReactNode } from 'react'
import { requireOnboardedUser } from '@/server/auth'

export default async function MentorApplyLayout(props: {
	children: ReactNode
}) {
	await requireOnboardedUser({ next: '/mentor/apply' })
	return props.children
}
