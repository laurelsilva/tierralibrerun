import {ChevronLeft} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import {cn} from '@/lib/utils'

type Accent = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'amber'

export interface AdminPageHeaderProps {
	title: string
	description?: string
	icon?: React.ReactNode
	backHref?: string
	backLabel?: string
	actions?: React.ReactNode
	eyebrow?: string
	accent?: Accent
	className?: string
	children?: React.ReactNode
}

/**
 * AdminPageHeader
 * Reusable header for admin listing/detail pages with:
 * - Optional back link
 * - Icon badge with accent color
 * - Title + description
 * - Right-aligned actions (any React nodes)
 *
 * Uses theme tokens and existing UI components to stay consistent with the app.
 */
export function AdminPageHeader({
	title,
	description,
	icon,
	backHref,
	backLabel = 'Back',
	actions,
	eyebrow,
	accent = 'default',
	className,
	children
}: AdminPageHeaderProps) {
	const accentClasses = getAccentClasses(accent)

	return (
		<header className={cn('w-full space-y-4', className)}>
			{/* Back link */}
			{backHref && (
				<div>
					<Link
						href={backHref}
						className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors">
						<ChevronLeft className="h-4 w-4" />
						{backLabel}
					</Link>
				</div>
			)}

			<div className="border-border/70 bg-card/90 relative overflow-hidden rounded-2xl border shadow-sm">
				<div
					aria-hidden="true"
					className={cn('absolute inset-x-0 top-0 h-1', accentClasses.rule)}
				/>
				<div className="relative p-4 md:p-6 lg:p-7">
					<div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
						{/* Icon badge */}
						<div className="flex items-start gap-4">
							<div
								className={cn(
									'ring-border/50 rounded-xl p-2.5 ring-1',
									accentClasses.container
								)}
								aria-hidden="true">
								<div className={cn('h-5 w-5 md:h-6 md:w-6', accentClasses.icon)}>
									{/* If no icon provided, show a simple marker */}
									{icon ?? (
										<svg
											viewBox="0 0 24 24"
											className="h-6 w-6"
											fill="none"
											stroke="currentColor"
											strokeWidth={2}
											strokeLinecap="round"
											strokeLinejoin="round">
											<path d="M12 22s8-4.5 8-11a8 8 0 1 0-16 0c0 6.5 8 11 8 11z" />
											<circle cx="12" cy="11" r="3" />
										</svg>
									)}
								</div>
							</div>

							{/* Title / Description */}
							<div className="min-w-0">
								{eyebrow && (
									<div className="text-muted-foreground mb-1 text-xs font-medium tracking-[0.12em] uppercase">
										{eyebrow}
									</div>
								)}
								<h1 className="text-foreground text-xl leading-tight font-semibold tracking-tight md:text-2xl">
									{title}
								</h1>
								{description && (
									<p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
										{description}
									</p>
								)}
							</div>
						</div>

						{/* Actions */}
						{actions && (
							<div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
								{actions}
							</div>
						)}
					</div>

					{/* Optional extra content (e.g., filters, secondary actions) */}
					{children && (
						<div className="border-border/60 mt-5 border-t pt-4">{children}</div>
					)}
				</div>
			</div>
		</header>
	)
}

function getAccentClasses(accent: Accent) {
	switch (accent) {
		case 'blue':
			return {
				container: 'bg-secondary text-secondary-foreground',
				icon: 'text-secondary-foreground',
				rule: 'bg-secondary'
			}
		case 'green':
			return {
				container: 'bg-primary/15 text-primary',
				icon: 'text-primary',
				rule: 'bg-primary'
			}
		case 'purple':
			return {
				container: 'bg-accent text-accent-foreground',
				icon: 'text-accent-foreground',
				rule: 'bg-accent'
			}
		case 'orange':
			return {
				container: 'bg-secondary text-secondary-foreground',
				icon: 'text-secondary-foreground',
				rule: 'bg-secondary'
			}
		case 'amber':
			// aligns with primary palette in globals.css
			return {
				container: 'bg-primary/10',
				icon: 'text-primary',
				rule: 'bg-primary'
			}
		case 'default':
		default:
			return {
				container: 'bg-primary/10',
				icon: 'text-primary',
				rule: 'bg-primary/60'
			}
	}
}

/**
 * Example usage:
 *
 * <AdminPageHeader
 *   backHref="/admin"
 *   backLabel="Back to Admin"
 *   title="Athlete Applications"
 *   description="Review funding requests; changes happen in detail views"
 *   icon={<CreditCard className="h-6 w-6" />}
 *   accent="green"
 *   actions={
 *     <>
 *       <Button asChild variant="outline"><Link href="/admin">Admin Home</Link></Button>
 *     </>
 *   }
 * >
 *   // Optional: filters / search / quick-actions block
 * </AdminPageHeader>
 */
