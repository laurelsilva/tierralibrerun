'use client'

/**
 * Users Admin Page (refactored)
 * - Centralized layout handles auth (no per-page isAdmin/currentUser checks)
 * - Server-side pagination and DB counts via admin service layer
 * - Search and filters (name/email, userType, onboarding)
 * - Paginated table with prev/next controls
 */

import { Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMemo, useEffect, useState } from 'react'

import {
	AdminDataTable,
	AdminPageHeader,
	UserDeleteAction,
} from '@/components/admin'
import { type ColumnHeader } from '@/components/admin/admin-data-table'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import Skeleton from '@/components/ui/skeleton'
// Admin email check uses ADMIN_EMAILS env var
const ADMIN_EMAIL_LIST = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
	.split(',')
	.map((e: string) => e.trim().toLowerCase())
	.filter(Boolean)
const isAdminEmail = (email?: string) =>
	email ? ADMIN_EMAIL_LIST.includes(email.toLowerCase()) : false

// Server helpers (RSC fetchers via route handlers)
import { type PageResult, type UserRow } from '@/server/admin/service'

// We will fetch data via API routes to keep this file as a client component for snappy filters.
// You can convert this into a server component if you prefer SSR-only.
// API endpoints should use the same service layer and admin guard.

type UsersCounts = never

const USER_COLUMNS: ColumnHeader[] = [
	{ key: 'user', content: 'User', className: 'font-medium' },
	{ key: 'type', content: 'Type' },
	{ key: 'profile', content: 'Profile', hideOnMobile: true },
	{ key: 'signals', content: 'Status', hideOnMobile: true },
	{ key: 'created', content: 'Created' },
	{ key: 'actions', content: '', align: 'right' },
]

function qsFromObject(
	obj: Record<string, string | number | boolean | undefined>,
) {
	const sp = new URLSearchParams()
	Object.entries(obj).forEach(([k, v]) => {
		if (v === undefined || v === null || v === '') return
		sp.set(k, String(v))
	})
	return sp.toString()
}

function parseBoolean(v: string | null | undefined): boolean | undefined {
	if (v === 'true') return true
	if (v === 'false') return false
	return undefined
}

function useUsersQuery() {
	const searchParams = useSearchParams()

	const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
	const pageSize = Math.min(
		200,
		Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10) || 50),
	)

	const q = searchParams.get('q') || ''
	const userType = searchParams.get('userType') || ''
	const onboardingRaw = searchParams.get('onboarding') // 'true' | 'false' | null
	const onboarding = parseBoolean(onboardingRaw)

	return {
		page,
		pageSize,
		q,
		userType,
		onboarding,
	}
}

async function fetchUsersPage(input: {
	page: number
	pageSize: number
	q?: string
	userType?: string
	onboarding?: boolean
}): Promise<PageResult<UserRow>> {
	const query = qsFromObject({
		page: input.page,
		pageSize: input.pageSize,
		q: input.q || undefined,
		userType: input.userType || undefined,
		onboarding:
			typeof input.onboarding === 'boolean'
				? String(input.onboarding)
				: undefined,
	})
	const res = await fetch(`/api/admin/users?${query}`, { cache: 'no-store' })
	if (!res.ok) throw new Error('Failed to load users')
	return res.json() as Promise<PageResult<UserRow>>
}

export default function UsersPage() {
	const router = useRouter()
	const { page, pageSize, q, userType, onboarding } = useUsersQuery()

	// Data loaders (client-side)
	const pagePromise = useMemo(
		() => fetchUsersPage({ page, pageSize, q, userType, onboarding }),
		[page, pageSize, q, userType, onboarding],
	)

	function setParams(
		next: Partial<{
			page: number
			pageSize: number
			q: string
			userType: string
			onboarding: string
		}>,
	) {
		const query = qsFromObject({
			page,
			pageSize,
			q,
			userType,
			onboarding:
				typeof onboarding === 'boolean' ? String(onboarding) : undefined,
			...next,
		})
		router.push(`/admin/users?${query}`)
	}

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = e.currentTarget
		const formData = new FormData(form)
		const nextQ = String(formData.get('q') || '')
		const nextUserType = String(formData.get('userType') || '')
		const nextOnboarding = String(formData.get('onboarding') || '')
		setParams({
			page: 1, // reset page on filter change
			q: nextQ || undefined,
			userType: nextUserType || undefined,
			onboarding: nextOnboarding || undefined,
		})
	}

	return (
		<div className="space-y-8">
			<AdminPageHeader
				backHref="/admin"
				backLabel="Back to Admin"
				title="Users"
				description="Search members, check onboarding, and open user profiles."
				icon={<Users className="h-6 w-6" />}
				accent="blue"
			/>


			{/* Filters */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle>Filters</CardTitle>
					<CardDescription>Use filters to find members quickly</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<form
						className="grid grid-cols-1 items-end gap-3 md:grid-cols-12"
						onSubmit={onSubmit}
					>
						<div className="space-y-1.5 md:col-span-3">
							<Label htmlFor="q">Search</Label>
							<Input
								id="q"
								name="q"
								placeholder="Name or email..."
								defaultValue={q}
							/>
						</div>

						<div className="space-y-1.5 md:col-span-3">
							<Label htmlFor="userType">Member Type</Label>
							<Select
								defaultValue={userType || 'any'}
								name="userType"
								onValueChange={(val) =>
									setParams({ page: 1, userType: val === 'any' ? '' : val })
								}
							>
								<SelectTrigger id="userType" className="w-full">
									<SelectValue placeholder="Any" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="any">Any</SelectItem>
									<SelectItem value="bipoc">BIPOC</SelectItem>
									<SelectItem value="ally">Ally</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5 md:col-span-3">
							<Label htmlFor="onboarding">Onboarding</Label>
							<Select
								defaultValue={
									typeof onboarding === 'boolean' ? String(onboarding) : 'any'
								}
								name="onboarding"
								onValueChange={(val) => {
									if (val === 'any') setParams({ page: 1, onboarding: '' })
									else setParams({ page: 1, onboarding: val })
								}}
							>
								<SelectTrigger id="onboarding" className="w-full">
									<SelectValue placeholder="Any" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="any">Any</SelectItem>
									<SelectItem value="true">Complete</SelectItem>
									<SelectItem value="false">Incomplete</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex w-full gap-2 self-end justify-self-end md:col-span-3 md:w-auto">
							<Button type="submit" className="w-full md:w-auto">
								Update
							</Button>
							<Button
								variant="outline"
								type="button"
								onClick={() =>
									setParams({ page: 1, q: '', userType: '', onboarding: '' })
								}
								className="w-full md:w-auto"
							>
								Clear
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Users table with pagination */}
			<SuspenseUsers
				pagePromise={pagePromise}
				onPageChange={(nextPage) => setParams({ page: nextPage })}
				onPageSizeChange={(nextSize) =>
					setParams({ page: 1, pageSize: nextSize })
				}
			/>
		</div>
	)
}

/* --------------------------- Suspense-like wrappers --------------------------- */

function SuspenseUsers({
	pagePromise,
	onPageChange,
	onPageSizeChange,
}: {
	pagePromise: Promise<PageResult<UserRow>>
	onPageChange: (nextPage: number) => void
	onPageSizeChange: (nextSize: number) => void
}) {
	const [data, setData] = useState<PageResult<UserRow> | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		setData(null) // show skeleton during refetch
		pagePromise
			.then((d) => {
				if (mounted) setData(d)
			})
			.catch((e) => {
				if (mounted) {
					if (e instanceof Error) setError(e.message)
					else if (
						typeof e === 'object' &&
						e !== null &&
						'message' in e &&
						typeof (e as any).message === 'string'
					)
						setError((e as any).message)
					else setError('Failed to load users')
				}
			})
		return () => {
			mounted = false
		}
	}, [pagePromise])

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Error loading users</CardTitle>
					<CardDescription>{error}</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Users</CardTitle>
					<CardDescription>Loading user list...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-6 w-64" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>
		)
	}

	const start = (data.page - 1) * data.pageSize + 1
	const end = Math.min(data.page * data.pageSize, data.total)

	return (
		<Card>
			<CardContent>
				<AdminDataTable
					rightActions={
						<div className="flex items-center gap-2">
							<Label htmlFor="pageSize" className="text-muted-foreground text-sm">
								Rows
							</Label>
							<Select
								value={String(data.pageSize)}
								onValueChange={(val) => onPageSizeChange(parseInt(val, 10))}
							>
								<SelectTrigger id="pageSize" className="w-[90px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="25">25</SelectItem>
									<SelectItem value="50">50</SelectItem>
									<SelectItem value="100">100</SelectItem>
									<SelectItem value="200">200</SelectItem>
								</SelectContent>
							</Select>
						</div>
					}
					columns={USER_COLUMNS}
					rows={data.items.map((user) => ({
						id: user.id,
						cells: [
							{
								key: 'user',
								content: (
									<div className="flex flex-col gap-0.5">
										<Link
											href={`/admin/users/${user.id}`}
											className="text-foreground hover:text-primary font-medium hover:underline"
										>
											{user.name || 'No name'}
										</Link>
										<span className="text-muted-foreground text-xs">{user.email}</span>
										<span className="text-muted-foreground/80 font-mono text-[11px]">
											{user.id.substring(0, 8)}...
										</span>
									</div>
								),
							},
							{
								key: 'type',
								content: user.userType === 'bipoc' ? (
									<span className="bg-primary/15 text-primary inline-flex rounded-md px-2 py-1 text-xs font-medium">
										BIPOC
									</span>
								) : user.userType === 'ally' ? (
									<span className="bg-secondary text-secondary-foreground inline-flex rounded-md px-2 py-1 text-xs font-medium">
										Ally
									</span>
								) : (
									<span className="bg-muted text-muted-foreground inline-flex rounded-md px-2 py-1 text-xs font-medium">
										Not set
									</span>
								),
							},
							{
								key: 'profile',
								hideOnMobile: true,
								content: (
									<div className="text-muted-foreground text-sm">
										<div>{user.age ? `Age ${user.age}` : 'Age not provided'}</div>
										<div>{user.genderIdentity || 'Gender not provided'}</div>
										<div>{user.locationRegion || 'Region not provided'}</div>
									</div>
								),
							},
							{
								key: 'signals',
								hideOnMobile: true,
								content: (
									<div className="flex flex-wrap gap-1.5">
										<BooleanPill label="Onboarding" value={user.onboardingCompleted} />
										<BooleanPill
											label="Code"
											value={user.acceptedCodeOfConduct}
										/>
										<BooleanPill label="Slack" value={user.slackJoined} />
										<BooleanPill label="Strava" value={user.stravaJoined} />
										<BooleanPill
											label="Instagram"
											value={user.instagramFollowed}
										/>
										<BooleanPill
											label="Newsletter"
											value={user.newsletterSubscribed}
										/>
									</div>
								),
							},
							{
								key: 'created',
								content: (
									<span className="text-muted-foreground text-sm whitespace-nowrap">
										{new Date(user.createdAt).toLocaleDateString()}
									</span>
								),
							},
							{
								key: 'actions',
								align: 'right',
								content: !isAdminEmail(user.email) ? (
									<UserDeleteAction
										userName={user.name || user.email}
										userId={user.id}
										clerkId={user.clerkId}
									/>
								) : (
									<span className="text-muted-foreground text-sm">Admin</span>
								),
							},
						],
					}))}
					emptyState={
						<div className="text-muted-foreground py-6 text-center text-sm">
							No users match these filters.
						</div>
					}
				/>

				{/* Pagination */}
				<div className="mt-4 flex items-center justify-between">
					<div className="text-muted-foreground text-sm">
						Showing {start}–{end} of {data.total}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!data.hasPrev}
							onClick={() => onPageChange(data.page - 1)}
						>
							Previous
						</Button>
						<div className="text-sm">
							Page {data.page} of {data.totalPages}
						</div>
						<Button
							variant="outline"
							size="sm"
							disabled={!data.hasNext}
							onClick={() => onPageChange(data.page + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function BooleanPill({ label, value }: { label: string; value: boolean }) {
	return (
		<span
			className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${
				value
					? 'bg-secondary text-secondary-foreground'
					: 'bg-muted text-muted-foreground'
			}`}
		>
			{label}
		</span>
	)
}
