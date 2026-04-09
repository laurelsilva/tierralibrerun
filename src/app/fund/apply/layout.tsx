import { type ReactNode } from 'react'
import { requireOnboardedUser } from '@/server/auth'

export default async function FundApplyLayout(props: { children: ReactNode }) {
	await requireOnboardedUser({ next: '/fund/apply' })
	return props.children
}
