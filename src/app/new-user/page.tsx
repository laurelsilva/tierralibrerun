import { NewUserBridge } from './new-user-bridge'
import { resolveOnboardingReturnTarget } from '@/lib/onboarding-routing'

export default async function NewUserPage(props: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const sp = (await props.searchParams) || {}
	const next = resolveOnboardingReturnTarget(sp)

	return <NewUserBridge next={next} />
}
