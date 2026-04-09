import { type ReactNode } from 'react'
import { requireOnboardedUser } from '@/server/auth'

export default async function DashboardLayout(props: { children: ReactNode }) {
	await requireOnboardedUser({ next: '/dashboard' })
	return props.children
}
