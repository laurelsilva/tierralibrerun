'use client'

import { UserButton, useUser, useClerk } from '@clerk/nextjs'
import { ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { AuthButton } from '@/components/auth/auth-button'
import { TrailMarkerLogo } from '@/components/trail-marker-logo'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { siteConfig } from '@/lib/config/site'
import { buildPostSignUpPath } from '@/lib/onboarding-routing'
import { cn } from '@/lib/utils'

const programItems = [
	{
		title: 'Athlete Fund',
		href: '/fund/',
		description: 'Funded race entries for athletes of color',
	},
	{
		title: 'Mentor Program',
		href: '/mentor',
		description: 'Mentorship for runners of color preparing for their first trail race',
	},
]

const exploreItems = [
	{
		title: 'Supported Races',
		href: '/races',
		description: 'Our race partner network across the Pacific Northwest',
	},
	{
		title: 'Blog',
		href: '/blog',
		description: 'Stories and field notes from the trail',
	},
]

function NavDropdown({
	label,
	items,
	pathname,
}: {
	label: string
	items: { title: string; href: string; description: string }[]
	pathname: string
}) {
	const isActive = items.some((item) => pathname.startsWith(item.href))

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className={cn(
						'text-primary-foreground/80 hover:text-primary-foreground inline-flex items-center gap-1 border-0 bg-transparent px-3 py-2 text-sm font-medium transition-colors outline-none',
						'hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10 rounded-md',
						isActive && 'text-primary-foreground bg-primary-foreground/10',
					)}
				>
					{label}
					<ChevronDown className="h-3.5 w-3.5 opacity-60" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" sideOffset={8} className="w-60 p-1">
				{items.map((item) => (
					<DropdownMenuItem
						key={item.href}
						asChild
						className="flex-col items-start gap-0.5 px-3 py-2.5"
					>
						<Link
							href={item.href}
							className={cn(pathname === item.href && 'bg-accent/50')}
						>
							<span className="w-full text-left text-sm font-medium">
								{item.title}
							</span>
							<span className="text-muted-foreground w-full text-left text-xs leading-tight">
								{item.description}
							</span>
						</Link>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export function Header() {
	const [isMobileOpen, setIsMobileOpen] = React.useState(false)
	const { isSignedIn, user, isLoaded } = useUser()
	const [isMounted, setIsMounted] = React.useState(false)
	const pathname = usePathname()
	const router = useRouter()
	const { openSignIn, openSignUp } = useClerk()

	React.useEffect(() => {
		setIsMounted(true)
	}, [])

	// Close mobile sheet on route change
	React.useEffect(() => {
		setIsMobileOpen(false)
	}, [pathname])

	// Auto-open Clerk modal based on ?auth=sign-in|sign-up
	React.useEffect(() => {
		if (typeof window === 'undefined' || isSignedIn) return

		const url = new URL(window.location.href)
		const authParam = url.searchParams.get('auth')
		if (authParam !== 'sign-in' && authParam !== 'sign-up') return

		const redirectTarget = url.searchParams.get('redirect_url') || undefined
		const postSignUpTarget = buildPostSignUpPath(redirectTarget)

		if (authParam === 'sign-in') {
			openSignIn(
				redirectTarget
					? {
							forceRedirectUrl: redirectTarget,
							fallbackRedirectUrl: redirectTarget,
							signUpForceRedirectUrl: postSignUpTarget,
							signUpFallbackRedirectUrl: postSignUpTarget,
						}
					: {
							signUpFallbackRedirectUrl: postSignUpTarget,
						},
			)
		} else {
			openSignUp(
				redirectTarget
					? {
							forceRedirectUrl: postSignUpTarget,
							fallbackRedirectUrl: postSignUpTarget,
							signInForceRedirectUrl: redirectTarget,
							signInFallbackRedirectUrl: redirectTarget,
						}
					: {
							fallbackRedirectUrl: postSignUpTarget,
						},
			)
		}

		// Clean URL params after opening modal
		url.searchParams.delete('auth')
		url.searchParams.delete('redirect_url')
		const cleanedSearch = url.searchParams.toString()
		const cleaned =
			url.pathname + (cleanedSearch ? `?${cleanedSearch}` : '') + url.hash
		router.replace(cleaned)
	}, [pathname, openSignIn, openSignUp, router, isSignedIn])

	// Hide header on onboarding page
	if (pathname === '/onboarding') return null

	// Skeleton while loading client
	if (!isMounted) {
		return (
			<div className="bg-primary border-primary-foreground/10 sticky top-0 z-50 border-b">
				<header className="container mx-auto px-4 md:px-6">
					<nav
						className="relative flex h-16 items-center gap-6"
						aria-label="Primary"
					>
						<Link href="/" className="flex items-center">
							<TrailMarkerLogo className="text-primary-foreground h-10 w-10" />
							<span className="text-primary-foreground ml-3 text-sm font-bold tracking-[0.2em] uppercase">
								{siteConfig.name}
							</span>
						</Link>
						<div className="hidden flex-1 items-center justify-between md:flex">
							<div className="flex items-center gap-1">
								<div className="bg-primary-foreground/10 h-8 w-24 animate-pulse rounded" />
								<div className="bg-primary-foreground/10 h-8 w-24 animate-pulse rounded" />
							</div>
							<div className="bg-primary-foreground/10 h-8 w-24 animate-pulse rounded-full" />
						</div>
						<div className="bg-primary-foreground/10 ml-auto h-9 w-9 rounded-full md:hidden" />
					</nav>
				</header>
			</div>
		)
	}

	const isAdmin = user?.publicMetadata?.role === 'admin'

	return (
		<div className="bg-primary border-primary-foreground/10 sticky top-0 z-50 border-b">
			<header className="container mx-auto px-4 md:px-6">
				<nav
					className="relative flex h-16 items-center gap-6"
					aria-label="Primary"
				>
					{/* Skip link */}
					<a
						href="#main-content"
						className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-60 focus:rounded focus:px-3 focus:py-2"
					>
						Skip to content
					</a>

					{/* Logo */}
					<Link href="/" className="flex shrink-0 items-center">
						<TrailMarkerLogo className="text-primary-foreground h-10 w-10" />
						<span className="text-primary-foreground ml-3 text-sm font-bold tracking-[0.2em] uppercase">
							{siteConfig.name}
						</span>
					</Link>

				{/* Desktop Navigation */}
				<div className="hidden flex-1 items-center md:flex">
					<div className="flex items-center gap-1">
						<NavDropdown
							label="Programs"
							items={programItems}
							pathname={pathname}
						/>
						<NavDropdown
							label="Explore"
							items={exploreItems}
							pathname={pathname}
						/>
						<Link
							href="/donate"
							className={cn(
								'text-primary-foreground/80 hover:text-primary-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors',
								'hover:bg-primary-foreground/10',
								pathname === '/donate' &&
									'text-primary-foreground bg-primary-foreground/10',
							)}
						>
							Donate
						</Link>
					</div>

					{/* Right side: auth */}
					<div className="ml-auto flex items-center gap-3">
						{isLoaded ? (
							isSignedIn ? (
								<>
									{isAdmin && (
										<Link
											href="/admin"
											className={cn(
												'text-primary-foreground/80 hover:text-primary-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors',
												'hover:bg-primary-foreground/10',
												pathname?.startsWith('/admin') &&
													'text-primary-foreground bg-primary-foreground/10',
											)}
										>
											Admin
										</Link>
									)}
									<Link
										href="/dashboard"
										className={cn(
											'text-primary-foreground/80 hover:text-primary-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors',
											'hover:bg-primary-foreground/10',
											pathname?.startsWith('/dashboard') &&
												'text-primary-foreground bg-primary-foreground/10',
										)}
									>
										Dashboard
									</Link>
									<UserButton afterSignOutUrl="/" />
								</>
							) : (
								<>
									<AuthButton
										action="sign-in"
										label="Sign In"
										variant="ghost"
										size="sm"
										className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
									/>
									<AuthButton
										action="sign-up"
										label="Apply"
										variant="outline"
										size="sm"
										className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
									/>
								</>
							)
						) : (
							<div className="bg-primary-foreground/10 h-8 w-24 animate-pulse rounded-full" />
						)}
					</div>
				</div>

					{/* Mobile Menu */}
					<div className="ml-auto md:hidden">
						<Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="text-primary-foreground hover:bg-primary-foreground/10"
									aria-label="Open menu"
								>
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-80">
								<SheetHeader className="text-left">
									<SheetTitle className="flex items-center gap-2">
										<TrailMarkerLogo className="h-6 w-6" />
										<span className="text-sm font-bold tracking-[0.15em] uppercase">
											{siteConfig.name}
										</span>
									</SheetTitle>
								</SheetHeader>

								<div className="mt-6 flex flex-col gap-1">
									{/* Programs */}
									<div className="mb-1">
										<p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
											Programs
										</p>
										{programItems.map((item) => (
											<Link
												key={item.href}
												href={item.href}
												onClick={() => setIsMobileOpen(false)}
												className={cn(
													'hover:bg-accent flex flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors',
													pathname === item.href && 'bg-accent',
												)}
											>
												<span className="text-sm font-medium">
													{item.title}
												</span>
												<span className="text-muted-foreground text-xs">
													{item.description}
												</span>
											</Link>
										))}
									</div>

									<div className="bg-border my-2 h-px" />

									{/* Explore */}
									<div className="mb-1">
										<p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
											Explore
										</p>
										{exploreItems.map((item) => (
											<Link
												key={item.href}
												href={item.href}
												onClick={() => setIsMobileOpen(false)}
												className={cn(
													'hover:bg-accent flex flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors',
													pathname === item.href && 'bg-accent',
												)}
											>
												<span className="text-sm font-medium">
													{item.title}
												</span>
												<span className="text-muted-foreground text-xs">
													{item.description}
												</span>
											</Link>
										))}
									</div>

									<div className="bg-border my-2 h-px" />

									{/* Donate */}
									<Link
										href="/donate"
										onClick={() => setIsMobileOpen(false)}
										className={cn(
											'hover:bg-accent flex flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors',
											pathname === '/donate' && 'bg-accent',
										)}
									>
										<span className="text-sm font-medium">Donate</span>
										<span className="text-muted-foreground text-xs">Support runner of color access</span>
									</Link>

									{/* Authenticated links */}
									{isSignedIn && (
										<>
											<div className="bg-border my-2 h-px" />
											<Link
												href="/dashboard"
												onClick={() => setIsMobileOpen(false)}
												className={cn(
													'hover:bg-accent rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
													pathname?.startsWith('/dashboard') && 'bg-accent',
												)}
											>
												Dashboard
											</Link>
											{isAdmin && (
												<Link
													href="/admin"
													onClick={() => setIsMobileOpen(false)}
													className={cn(
														'hover:bg-accent rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
														pathname?.startsWith('/admin') && 'bg-accent',
													)}
												>
													Admin
												</Link>
											)}
										</>
									)}

									{/* Auth */}
									<div className="bg-border my-2 h-px" />
									<div className="flex items-center gap-2 px-3 py-2">
										{isSignedIn ? (
											<div className="flex items-center gap-3">
												<span className="text-sm font-medium">Account</span>
												<UserButton afterSignOutUrl="/" />
											</div>
										) : (
											<div className="flex w-full gap-2">
												<AuthButton
													action="sign-in"
													label="Sign In"
													variant="outline"
													size="sm"
													className="flex-1"
												/>
												<AuthButton
													action="sign-up"
													label="Sign Up"
													variant="default"
													size="sm"
													className="flex-1"
												/>
											</div>
										)}
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</nav>
			</header>
		</div>
	)
}
