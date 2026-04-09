import {currentUser,auth} from '@clerk/nextjs/server'

import Link from 'next/link'
import {Button} from '@/components/ui/button'

export default async function AdminDebugPage() {
	const clerkUser = await currentUser()
	const {userId, sessionClaims} = await auth()

	return (
		<div className="space-y-6">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Admin Debug</h1>
				<Link href="/admin" passHref>
					<Button variant="outline">Back to Admin</Button>
				</Link>
			</div>

			<div className="space-y-6">
				<div className="bg-card rounded-lg border p-6">
					<h2 className="mb-4 text-xl font-semibold">Access Check</h2>
					<div className="space-y-2">
						<p className="text-muted-foreground text-sm">
							Use this page to verify admin access data from Clerk and session claims.
						</p>
					</div>
				</div>

				<div className="bg-card rounded-lg border p-6">
					<h2 className="mb-4 text-xl font-semibold">Clerk User Data</h2>
					{clerkUser ? (
						<div className="space-y-2">
							<p>
								<strong>User ID:</strong> {clerkUser.id}
							</p>
							<p>
								<strong>Email:</strong>{' '}
								{clerkUser.emailAddresses?.[0]?.emailAddress || 'No email found'}
							</p>
							<p>
								<strong>Role (from publicMetadata):</strong>{' '}
								{(clerkUser.publicMetadata?.role as string) || 'No role set'}
							</p>
							<p>
								<strong>Public Metadata:</strong>
							</p>
							<pre className="bg-muted overflow-auto rounded p-3 text-sm">
								{JSON.stringify(clerkUser.publicMetadata, null, 2)}
							</pre>
							<p>
								<strong>Full User Object:</strong>
							</p>
							<pre className="bg-muted max-h-96 overflow-auto rounded p-3 text-sm">
								{JSON.stringify(clerkUser, null, 2)}
							</pre>
						</div>
					) : (
						<p>No Clerk user found</p>
					)}
				</div>

				<div className="bg-card rounded-lg border p-6">
					<h2 className="mb-4 text-xl font-semibold">
						Session Claims
					</h2>
					{sessionClaims ? (
						<div className="space-y-2">
							<p>
								<strong>User ID:</strong> {userId}
							</p>
							<p>
								<strong>Role (session publicMetadata):</strong>{' '}
								{(sessionClaims?.publicMetadata as {role?: string})?.role ||
									'No role set'}
							</p>
							<p>
								<strong>Session Claims publicMetadata:</strong>
							</p>
							<pre className="bg-muted overflow-auto rounded p-3 text-sm">
								{JSON.stringify(sessionClaims?.publicMetadata, null, 2)}
							</pre>
							<p>
								<strong>Full Session Claims:</strong>
							</p>
							<pre className="bg-muted max-h-96 overflow-auto rounded p-3 text-sm">
								{JSON.stringify(sessionClaims, null, 2)}
							</pre>
						</div>
					) : (
						<p>No session claims found</p>
					)}
				</div>

				<div className="bg-card rounded-lg border p-6">
					<h2 className="mb-4 text-xl font-semibold">Quick Checks</h2>
					<ol className="list-inside list-decimal space-y-2">
						<li>Confirm your Clerk user has the expected `publicMetadata.role`</li>
						<li>Confirm you are logged in with the correct account</li>
						<li>Refresh session by signing out and back in if role looks stale</li>
						<li>Compare Clerk user metadata with session claim metadata</li>
						<li>
							Check server logs if both sections look correct but access still fails
						</li>
					</ol>
				</div>
			</div>
		</div>
	)
}
