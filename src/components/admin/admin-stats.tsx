import * as React from 'react'
import {cn} from '@/lib/utils'

/**
 * AdminStatsGrid
 * A reusable, theme-aware stat grid for admin dashboards.
 *
 * - Consistent sizing and spacing
 * - Accent-aware variants that align with globals.css theme tokens
 * - Graceful truncation for labels
 * - Optional trend/extra slot
 *
 * Usage:
 * <AdminStatsGrid
 *   items={[
 *     {label: 'Total Applications', value: total},
 *     {label: 'Pending Review', value: pending, variant: 'amber'},
 *     {label: 'Approved Mentors', value: approved, variant: 'green'},
 *     {label: 'Rejected', value: rejected, variant: 'red'},
 *   ]}
 * />
 */

type Variant =
	| 'default'
	| 'amber'
	| 'green'
	| 'purple'
	| 'blue'
	| 'red'
	| 'muted'

export interface AdminStatItem {
	label: string
	value: React.ReactNode
	hint?: string
	icon?: React.ReactNode
	variant?: Variant
	className?: string
	// Optional small content rendered under the label (e.g., mini trend, sub-label)
	extra?: React.ReactNode
}

export interface AdminStatsGridProps {
	items: AdminStatItem[]
	columns?: 1 | 2 | 3 | 4 | 5 | 6
	className?: string
	// Compact makes the stat more dense vertically
	compact?: boolean
}

export function AdminStatsGrid({
	items,
	columns = 4,
	className,
	compact = false
}: AdminStatsGridProps) {
	const cols = getGridCols(columns)

	return (
		<div className={cn('grid gap-3 md:gap-4', cols, className)}>
			{items.map((item, idx) => {
				const variant = item.variant ?? 'default'
				const {chip, valueText, card, rule} = getVariantClasses(variant)

				return (
					<div
						key={`${item.label}-${idx}`}
						className={cn(
							'border-border/70 bg-card/90 relative overflow-hidden rounded-xl border',
							'shadow-sm transition-colors',
							card,
							item.className
						)}>
						<div
							className={cn(
								'flex items-start gap-3 p-4 md:p-5',
								compact && 'p-4'
							)}>
							{item.icon ? (
								<div
									className={cn('ring-border/50 rounded-lg p-2 ring-1', chip)}>
									{/* icon color provided by chip container bg + currentColor */}
									<div className="h-5 w-5 text-current md:h-6 md:w-6">
										{item.icon}
									</div>
								</div>
							) : (
								<div
									className={cn('hidden h-0 w-0 md:block')}
									aria-hidden="true"
								/>
							)}

							<div className="min-w-0 flex-1">
								{/* Label + extra (e.g., trend) */}
								<div className="mb-1 flex items-center justify-between gap-3">
									<div className="text-muted-foreground truncate text-[11px] font-medium tracking-[0.12em] uppercase">
										{item.label}
									</div>
									{item.extra && (
										<div className="text-muted-foreground/80 text-xs whitespace-nowrap">
											{item.extra}
										</div>
									)}
								</div>

								{/* Value */}
								<div
									className={cn(
										'leading-none font-semibold',
										compact ? 'text-2xl' : 'text-[30px]',
										valueText
									)}>
									{item.value}
								</div>

								{/* Hint */}
								{item.hint && (
									<div className="text-muted-foreground mt-2 text-xs md:text-sm">
										{item.hint}
									</div>
								)}
							</div>
						</div>

						{/* Subtle top/border accent */}
						<div
							className={cn(
								'absolute inset-x-0 top-0 h-0.5 rounded-t-xl',
								rule
							)}
						/>
					</div>
				)
			})}
		</div>
	)
}

function getGridCols(columns: AdminStatsGridProps['columns']) {
	switch (columns) {
		case 1:
			return 'grid-cols-1'
		case 2:
			return 'grid-cols-1 md:grid-cols-2'
		case 3:
			return 'grid-cols-1 md:grid-cols-3'
		case 4:
			return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
		case 5:
			return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-5'
		case 6:
			return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6'
		default:
			return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
	}
}

function getVariantClasses(variant: Variant) {
	switch (variant) {
		case 'amber':
			return {
				chip: 'bg-primary/10 text-primary',
				valueText: 'text-foreground',
				card: 'bg-card',
				rule: 'bg-primary/60'
			}
		case 'green':
			return {
				chip: 'bg-secondary text-secondary-foreground',
				valueText: 'text-foreground',
				card: 'bg-card',
				rule: 'bg-secondary'
			}
		case 'purple':
			return {
				chip: 'bg-accent text-accent-foreground',
				valueText: 'text-foreground',
				card: 'bg-card',
				rule: 'bg-accent'
			}
		case 'blue':
			return {
				chip: 'bg-muted text-foreground',
				valueText: 'text-foreground',
				card: 'bg-card',
				rule: 'bg-muted-foreground/35'
			}
		case 'red':
			return {
				chip: 'bg-destructive/15 text-destructive',
				valueText: 'text-foreground',
				card: 'bg-card',
				rule: 'bg-destructive/60'
			}
		case 'muted':
			return {
				chip: 'bg-muted text-foreground',
				valueText: 'text-foreground',
				card: 'bg-muted/25',
				rule: 'bg-muted-foreground/25'
			}
		case 'default':
		default:
			return {
				chip: 'bg-muted text-foreground',
				valueText: 'text-foreground',
				card: 'bg-card',
				rule: 'bg-border'
			}
	}
}
