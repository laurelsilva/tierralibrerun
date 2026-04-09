import {currentUser} from '@clerk/nextjs/server'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import React from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import {AuthButton} from '@/components/auth/auth-button'
import {Button} from '@/components/ui/button'
import {isAdmin, isReadOnlyAdmin} from '@/server/auth/admin'
import { syncPastRaceFundApplications } from '@/server/workflow/service'

function AccessDenied() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="bg-card border-border max-w-md rounded-lg border p-8 shadow-md">
				<h1 className="text-destructive mb-4 text-2xl font-bold">
					Access Denied
				</h1>
				<p className="text-card-foreground">
					You need admin access to view this page.
				</p>
				<div className="mt-6 flex items-center gap-2">
					<Button asChild>
						<Link href="/">Back to Site</Link>
					</Button>
					<AuthButton action="sign-in" label="Sign In" variant="outline" />
				</div>
			</div>
		</div>
	)
}

export default async function AdminLayout({
	children
}: {
	children: React.ReactNode
}) {
	// Require sign-in first
	const clerkUser = await currentUser()
	if (!clerkUser) {
		redirect('/?auth=sign-in')
	}

	// Single admin gate for all /admin routes
	const admin = await isAdmin()
	if (!admin) {
		return <AccessDenied />
	}

	const readOnly = await isReadOnlyAdmin()
	await syncPastRaceFundApplications()

	return <AdminShell readOnly={readOnly}>{children}</AdminShell>
}
