'use client'

import { motion } from 'framer-motion'
import {
	Activity,
	BarChart2,
	CreditCard,
	Handshake,
	LayoutDashboard,
	Mail,
	Settings,
	UserCheck,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/lib/config/site'

type IconType = typeof LayoutDashboard

interface AdminShellProps {
	children: ReactNode
	readOnly: boolean
}

type NavItem = {
	href: string
	label: string
	icon: IconType
	badge?: number
}

const PRIMARY_NAV: NavItem[] = [
	{
		href: '/admin',
		label: 'Overview',
		icon: LayoutDashboard,
	},
	{
		href: '/admin/fund-applications',
		label: 'Athlete Applications',
		icon: CreditCard,
	},
	{
		href: '/admin/fund-athletes/active',
		label: 'Active Participants',
		icon: Activity,
	},
	{
		href: '/admin/mentor-applications',
		label: 'Mentor Applications',
		icon: UserCheck,
	},
	{
		href: '/admin/mentor-pairings',
		label: 'Mentor Pairings',
		icon: Handshake,
	},
	{
		href: '/admin/emails/broadcast',
		label: 'Email Broadcasts',
		icon: Mail,
	},
	{
		href: '/admin/users',
		label: 'Users',
		icon: Users,
	},
	{
		href: '/admin/debug',
		label: 'Debug Tools',
		icon: Settings,
	},
	{
		href: '/admin/metrics',
		label: 'Metrics',
		icon: BarChart2,
	},
]

function isActivePath(pathname: string, href: string) {
	if (href === '/admin') return pathname === '/admin'
	return pathname.startsWith(href)
}

function railLinkClass(active: boolean) {
	return active
		? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
		: 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground'
}

function getContextLinks(pathname: string) {
	if (
		pathname.startsWith('/admin/fund-applications') ||
		pathname.startsWith('/admin/applications') ||
		pathname.startsWith('/admin/fund-athletes')
	) {
		return [
			{ href: '/admin/fund-applications', label: 'Athlete Review Queue' },
			{ href: '/admin/fund-athletes/active', label: 'Active Participants' },
			{ href: '/admin/emails/broadcast', label: 'Athlete Broadcasts' },
		]
	}

	if (
		pathname.startsWith('/admin/mentor-pairings') ||
		pathname.startsWith('/admin/mentor-applications') ||
		pathname.startsWith('/admin/users')
	) {
		return [
			{ href: '/admin/mentor-applications', label: 'Mentor Review Queue' },
			{
				href: '/admin/mentor-pairings',
				label: 'Mentor Pairings',
			},
			{ href: '/admin/users', label: 'Users' },
			{ href: '/admin/emails/broadcast', label: 'Mentor Broadcasts' },
		]
	}

	return [
		{ href: '/admin/fund-applications', label: 'Athlete Review Queue' },
		{ href: '/admin/mentor-applications', label: 'Mentor Review Queue' },
		{ href: '/admin/mentor-pairings', label: 'Mentor Pairings' },
		{ href: '/admin/emails/broadcast', label: 'Email Broadcasts' },
	]
}

export function AdminShell({ children, readOnly }: AdminShellProps) {
	const pathname = usePathname()
	const contextLinks = getContextLinks(pathname)

	return (
		<div
			className="admin-root bg-background min-h-screen"
			data-admin-mode={readOnly ? 'readonly' : 'writer'}
		>
			<div className="mx-auto grid min-h-screen max-w-[2200px] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)]">
				<aside className="border-sidebar-border bg-sidebar/90 text-sidebar-foreground hidden border-r lg:block">
					<div className="sticky top-0 h-screen overflow-y-auto p-5">
						<div className="border-sidebar-border bg-background/70 mb-6 rounded-xl border p-4 shadow-sm">
							<p className="text-sidebar-foreground/70 text-xs font-semibold tracking-[0.12em] uppercase">
								{siteConfig.name}
							</p>
							<h2 className="mt-1 text-lg font-semibold">Operations Console</h2>
							<p className="text-sidebar-foreground/70 mt-2 text-xs">
								Review applications, move athletes through stages, and send
								communications.
							</p>
						</div>

						<nav aria-label="Primary admin navigation" className="space-y-1">
							{PRIMARY_NAV.map((item) => {
								const active = isActivePath(pathname, item.href)
								const Icon = item.icon
								return (
									<Link
										key={item.href}
										href={item.href}
										className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${railLinkClass(active)}`}
									>
										<span className="flex items-center gap-2">
											<Icon className="h-4 w-4" />
											{item.label}
										</span>
									</Link>
								)
							})}
						</nav>
					</div>
				</aside>

				<div className="min-w-0">
					<div className="border-border bg-card/80 border-b px-4 py-3 lg:hidden">
						<p className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
							Admin Navigation
						</p>
						<div className="mt-2 flex gap-2 overflow-x-auto pb-1">
							{PRIMARY_NAV.map((item) => {
								const active = isActivePath(pathname, item.href)
								const Icon = item.icon
								return (
									<Button
										asChild
										key={item.href}
										variant={active ? 'default' : 'outline'}
										size="sm"
										className="shrink-0"
									>
										<Link href={item.href}>
											<Icon className="mr-1.5 h-3.5 w-3.5" />
											{item.label}
										</Link>
									</Button>
								)
							})}
						</div>
					</div>
					<div className="border-border bg-card/70 hidden border-b px-6 py-3 lg:block xl:hidden">
						<div className="flex flex-wrap items-center gap-2">
							{contextLinks.map((link) => {
								const active = isActivePath(pathname, link.href)
								return (
									<Button
										asChild
										key={link.href}
										size="sm"
										variant={active ? 'secondary' : 'outline'}
									>
										<Link href={link.href}>{link.label}</Link>
									</Button>
								)
							})}
						</div>
					</div>

					<main className="px-4 py-5 sm:px-6 lg:px-7 lg:py-7 xl:px-8">
						{readOnly && (
							<div className="bg-accent text-accent-foreground border-border mb-4 rounded-lg border px-3 py-2 text-sm">
								Read-only mode: changes are disabled for this account.
							</div>
						)}
						<motion.div
							key={pathname}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.18, ease: 'easeOut' }}
							className="mx-auto w-full max-w-none"
						>
							{children}
						</motion.div>
					</main>
				</div>
			</div>
		</div>
	)
}

export default AdminShell
