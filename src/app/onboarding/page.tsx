import { redirect } from 'next/navigation'
import { OnboardingFlow } from './onboarding-flow'
import {
	buildOnboardingPath,
	resolveOnboardingReturnTarget,
} from '@/lib/onboarding-routing'
import { requireUser } from '@/server/auth'

export const metadata = {
	title: 'Onboarding | Trail Running Community',
	robots: {
		index: false,
		follow: false,
		googleBot: {
			index: false,
			follow: false,
		},
	},
}

export default async function OnboardingPage(props: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	// Resolve searchParams (Next 15 provides it as a Promise)
	const sp = (await props.searchParams) || {}
	const next = resolveOnboardingReturnTarget(sp)
	const target = buildOnboardingPath(next)
	const dbUser = await requireUser({ next: target })

	// If user has already completed onboarding, redirect back to event (if provided) or dashboard
	if (dbUser.onboardingCompleted) {
		if (next) {
			redirect(next)
		}
		redirect('/dashboard')
	}

	// Get user data for pre-filling forms
	const userData = {
		name: dbUser.name ?? '',
		email: dbUser.email,
		userId: dbUser.id,
		profileImageUrl: dbUser.profileImageUrl,
	}

	return (
		<main
			className="bg-background text-foreground flex min-h-screen items-center justify-center"
			role="region"
			aria-label="Onboarding"
		>
			<div className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-2xl">
					<div className="mb-8 text-center">
						<p className="text-muted-foreground text-lg">
							Let's get you set up in our community. This will only take a few
							minutes.
						</p>
					</div>

					<OnboardingFlow userData={userData} nextUrl={next} />
				</div>
			</div>
		</main>
	)
}
