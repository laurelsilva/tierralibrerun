'use client'

import { Instagram } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrailMarkerLogo } from '@/components/trail-marker-logo'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Tierra Libre Run'
const siteTagline = process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Trail Access for BIPOC Athletes'
const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || ''
const taxId = process.env.NEXT_PUBLIC_TAX_ID || ''

export function Footer() {
	const pathname = usePathname()
	if (pathname === '/onboarding') return null
	return (
		<footer className="bg-card border-border/40 border-t">
			<div className="container mx-auto px-4 md:px-6">
				<div className="py-16 md:py-24">
					<div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16">
						{/* Brand Section */}
						<div className="md:col-span-3">
							<div className="space-y-4">
								<Link href="/" className="group flex items-center">
									<div className="flex items-center justify-start">
										<div className="relative">
											<TrailMarkerLogo className="h-12 w-12" />
										</div>
										<span className="text-foreground ml-4 text-base font-bold tracking-[0.2em] uppercase">
											{siteName}
										</span>
									</div>
								</Link>
								<p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
									{siteTagline}
								</p>
							</div>
						</div>

						{/* Navigation Links */}
						<div
							className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-9 md:grid-cols-6 lg:grid-cols-12 lg:gap-12"
							role="navigation"
							aria-label="Footer"
						>
							{/* Programs */}
							<div className="col-span-2 space-y-4 sm:col-span-1 lg:col-span-3">
								<h4 className="text-foreground text-sm font-semibold tracking-wider uppercase">
									Programs
								</h4>
								<ul className="space-y-3">
									<li>
										<Link
											href="/fund"
											className="text-muted-foreground hover:text-foreground text-sm transition-colors"
										>
											Athlete Fund
										</Link>
									</li>
									<li>
										<Link
											href="/mentor"
											className="text-muted-foreground hover:text-foreground text-sm transition-colors"
										>
											Mentor Program
										</Link>
									</li>
									<li>
										<Link
											href="/donate"
											className="text-muted-foreground hover:text-foreground text-sm transition-colors"
										>
											Donate
										</Link>
									</li>
								</ul>
							</div>

					{/* Races */}
					<div className="col-span-2 space-y-4 sm:col-span-1 lg:col-span-3">
						<h4 className="text-foreground text-sm font-semibold tracking-wider uppercase">
							Races
						</h4>
						<ul className="space-y-3">
							<li>
								<Link
									href="/races"
									className="text-muted-foreground hover:text-foreground text-sm transition-colors"
								>
									Supported Races
								</Link>
							</li>
							<li>
								<Link
									href="/companies"
									className="text-muted-foreground hover:text-foreground text-sm transition-colors"
								>
									Race Partners
								</Link>
							</li>
						</ul>
					</div>

							{/* Resources */}
							<div className="col-span-2 space-y-4 sm:col-span-1 lg:col-span-3">
								<h4 className="text-foreground text-sm font-semibold tracking-wider uppercase">
									Resources
								</h4>
								<ul className="space-y-3">
									<li>
										<Link
											href="/blog"
											className="text-muted-foreground hover:text-foreground text-sm transition-colors"
										>
											Field Notes
										</Link>
									</li>
									<li>
										<Link
											href="/code-of-conduct"
											className="text-muted-foreground hover:text-foreground text-sm transition-colors"
										>
											Code of Conduct
										</Link>
									</li>
								</ul>
							</div>

							{/* Connect */}
							<div className="col-span-2 space-y-4 sm:col-span-1 lg:col-span-3">
								<h4 className="text-foreground text-sm font-semibold tracking-wider uppercase">
									Connect
								</h4>
								<div className="flex items-center gap-4">
									{instagramUrl && (
										<a
											href={instagramUrl}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={`${siteName} on Instagram`}
											title={`${siteName} on Instagram`}
											className="bg-muted/50 hover:bg-muted flex h-10 w-10 items-center justify-center rounded-full transition-colors"
										>
											<Instagram className="text-muted-foreground h-5 w-5" />
										</a>
									)}
								</div>
							</div>
						</div>

						{/* Connect section consolidated into the navigation grid above */}
					</div>

					{/* Bottom Section */}
				<div className="border-border/40 mt-16 border-t pt-10">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<p className="text-muted-foreground text-xs">
							© {new Date().getFullYear()} {siteName}, Nonprofit Initiative
						</p>
						{taxId && (
							<p className="text-muted-foreground text-xs">
								501(c)(3) with fiscal sponsorship. Donations are tax-deductible. Tax ID:{' '}
								{taxId}
							</p>
						)}
					</div>
				</div>
				</div>
			</div>
		</footer>
	)
}
