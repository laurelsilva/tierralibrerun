'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { buildNewUserPath } from '@/lib/onboarding-routing'

export function NewUserBridge({ next }: { next?: string }) {
	const { isLoaded, userId } = useAuth()
	const router = useRouter()
	const [attempts, setAttempts] = useState(0)
	const newUserHref = buildNewUserPath(next)

	useEffect(() => {
		if (!isLoaded) return

		if (!userId) {
			router.replace(
				`/?auth=sign-in&redirect_url=${encodeURIComponent(newUserHref)}`,
			)
			return
		}

		let isCancelled = false
		let timer: ReturnType<typeof setTimeout> | undefined

		const resolveSession = async (attempt: number) => {
			try {
				const response = await fetch(
					`/api/auth/new-user${
						next ? `?next=${encodeURIComponent(next)}` : ''
					}`,
					{
						cache: 'no-store',
						credentials: 'include',
					},
				)
				const payload = (await response.json()) as {
					redirectTo?: string
				}

				if (isCancelled) return

				if (response.ok && payload.redirectTo) {
					window.location.assign(payload.redirectTo)
					return
				}
			} catch {}

			if (isCancelled) return

			setAttempts(attempt + 1)
			timer = setTimeout(
				() => {
					void resolveSession(attempt + 1)
				},
				Math.min(300 + attempt * 150, 1500),
			)
		}

		void resolveSession(0)

		return () => {
			isCancelled = true
			if (timer) clearTimeout(timer)
		}
	}, [isLoaded, newUserHref, next, router, userId])

	return (
		<main className="bg-background text-foreground flex min-h-screen items-center justify-center">
			<div className="mx-auto max-w-md px-6 text-center">
				<h1 className="text-2xl font-semibold">Finishing Account Setup</h1>
				<p className="text-muted-foreground mt-3 text-sm">
					{attempts > 4
						? 'This is taking a little longer than usual while we secure your session.'
						: 'We&apos;re getting your onboarding flow ready.'}
				</p>
			</div>
		</main>
	)
}
