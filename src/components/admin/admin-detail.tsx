import * as React from 'react'
import {cn} from '@/lib/utils'

/**
 * Admin Detail UI
 * Reusable primitives to compose clean, consistent detail pages with:
 * - Page header with status/actions
 * - Section blocks with titles and descriptions
 * - Key/value grid for metadata
 * - Labeled text blocks for long-form fields
 *
 * These components only handle layout/styling and accept ReactNode content.
 * They rely on theme variables defined in globals.css and shadcn-like utility classes.
 */

/* ===========================
 * AdminDetailHeader
 * ===========================
 * A compact page header for detail views with:
 * - Title + subtitle
 * - Optional status element (e.g., a badge)
 * - Optional right-aligned actions
 */
export interface AdminDetailHeaderProps {
	title: string
	subtitle?: string
	avatar?: React.ReactNode
	status?: React.ReactNode
	actions?: React.ReactNode
	className?: string
}

export function AdminDetailHeader({
	title,
	subtitle,
	avatar,
	status,
	actions,
	className
}: AdminDetailHeaderProps) {
	return (
		<header
			className={cn(
				'border-border/70 bg-card/90 rounded-2xl border px-5 py-6 shadow-sm md:px-7 md:py-7',
				className
			)}>
			<div className="flex flex-col gap-4">
				{/* Title + Subtitle */}
				<div className="flex min-w-0 items-start gap-3">
					{avatar ? <div className="shrink-0">{avatar}</div> : null}
					<div className="min-w-0">
						<h1 className="text-foreground text-[20px] leading-tight font-semibold tracking-tight md:text-[22px]">
							{title}
						</h1>
						{subtitle ? (
							<p className="text-muted-foreground mt-1.5 text-[13px] md:text-sm">
								{subtitle}
							</p>
						) : null}
					</div>
				</div>

				{/* Status + Actions */}
				<div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
					{status ? <div className="shrink-0">{status}</div> : <div />}
					{actions ? (
						<div className="flex w-full flex-wrap gap-2 md:w-auto">
							{actions}
						</div>
					) : null}
				</div>
			</div>
		</header>
	)
}

/* ===========================
 * AdminDetailSection
 * ===========================
 * A bordered block with a title, optional description, and content area.
 * Useful to group details (Applicant Information, Race Information, etc.)
 */
export interface AdminDetailSectionProps {
	title: string
	description?: string
	children: React.ReactNode
	className?: string
	footer?: React.ReactNode
}

export function AdminDetailSection({
	title,
	description,
	children,
	className,
	footer
}: AdminDetailSectionProps) {
	return (
		<section
			className={cn(
				'border-border/70 bg-card/90 rounded-xl border shadow-sm',
				className
			)}>
			<div className="px-5 py-6 md:px-6 md:py-6">
				<div className="mb-4 border-b border-border/50 pb-3 md:mb-5">
					<h2 className="text-foreground text-base font-semibold tracking-tight md:text-lg">
						{title}
					</h2>
					{description ? (
						<p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed md:text-sm">
							{description}
						</p>
					) : null}
				</div>
				<div className="space-y-4 md:space-y-5">{children}</div>
			</div>
			{footer ? (
				<div className="border-border/60 bg-muted/15 border-t px-5 py-4 md:px-6 md:py-5">
					{footer}
				</div>
			) : null}
		</section>
	)
}

/* ===========================
 * AdminKeyValueGrid
 * ===========================
 * Responsive grid for short key/value pairs.
 * - Keys are subdued; values are emphasized for readability
 * - Auto-wraps across 1-3 columns depending on viewport
 */
export interface KeyValueItem {
	key: string
	label: React.ReactNode
	value: React.ReactNode
	// Optional monospace style for IDs or technical values
	mono?: boolean
}

export interface AdminKeyValueGridProps {
	items: KeyValueItem[]
	columns?: 1 | 2 | 3
	className?: string
	dense?: boolean
}

export function AdminKeyValueGrid({
	items,
	columns = 3,
	className,
	dense = false
}: AdminKeyValueGridProps) {
	const cols =
		columns === 1
			? 'grid-cols-1'
			: columns === 2
				? 'grid-cols-1 sm:grid-cols-2'
				: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'

	return (
		<div className={cn('grid gap-5 md:gap-6', cols, className)}>
			{items.map((item) => (
				<div
					key={item.key}
					className={cn('rounded-lg', dense ? 'space-y-1' : 'space-y-2')}>
					<div className="text-muted-foreground text-xs font-medium tracking-normal">
						{item.label}
					</div>
					<div
						className={cn(
							'text-foreground text-[13px] leading-relaxed break-words md:text-sm',
							item.mono && 'font-mono'
						)}>
						{item.value}
					</div>
				</div>
			))}
		</div>
	)
}

/* ===========================
 * AdminLabeledText
 * ===========================
 * Presents a labeled long-form text block:
 * - Lighter background and border
 * - Preserves line breaks
 */
export interface AdminLabeledTextProps {
	label: string
	children?: React.ReactNode
	className?: string
	emptyFallback?: string
}

export function AdminLabeledText({
	label,
	children,
	className,
	emptyFallback = 'Not specified'
}: AdminLabeledTextProps) {
	return (
		<div className={cn('space-y-2.5', className)}>
			<div className="text-muted-foreground text-xs font-medium md:text-sm">
				{label}
			</div>
			<div className="bg-muted/35 border-border/60 text-foreground rounded-lg border p-4 md:p-5">
				<p className="text-[13px] leading-relaxed whitespace-pre-line md:text-sm">
					{children ?? emptyFallback}
				</p>
			</div>
		</div>
	)
}

/* ===========================
 * AdminSplitGrid
 * ===========================
 * Two-column responsive layout helper for detail pages.
 * Left and right accept arbitrary content (e.g., sections).
 */
export interface AdminSplitGridProps {
	left: React.ReactNode
	right: React.ReactNode
	className?: string
	gap?: 'md' | 'lg' | 'xl'
}

export function AdminSplitGrid({
	left,
	right,
	className,
	gap = 'lg'
}: AdminSplitGridProps) {
	const gapClass =
		gap === 'xl' ? 'gap-8 xl:gap-10' : gap === 'lg' ? 'gap-6 xl:gap-8' : 'gap-5'
	return (
		<div className={cn('grid grid-cols-1 xl:grid-cols-2', gapClass, className)}>
			<div className="space-y-6 md:space-y-8">{left}</div>
			<div className="space-y-6 md:space-y-8">{right}</div>
		</div>
	)
}

/* ===========================
 * AdminDetailActions
 * ===========================
 * Footer action bar for detail pages; keeps actions aligned/consistent.
 */
export interface AdminDetailActionsProps {
	children: React.ReactNode
	className?: string
}

export function AdminDetailActions({
	children,
	className
}: AdminDetailActionsProps) {
	return (
		<div
			className={cn(
				'mt-10 mb-8 flex flex-col-reverse items-stretch justify-between gap-6 md:mt-14 md:mb-12 md:flex-row md:items-center',
				className
			)}>
			{children}
		</div>
	)
}
