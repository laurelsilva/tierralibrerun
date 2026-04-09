import * as React from 'react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import {cn} from '@/lib/utils'

export type Align = 'left' | 'right' | 'center'

export interface ColumnHeader {
	key: string
	content: React.ReactNode
	className?: string
	align?: Align
	hideOnMobile?: boolean
	width?: string
}

export interface RowCell {
	key: string
	content: React.ReactNode
	className?: string
	align?: Align
	hideOnMobile?: boolean
}

export interface RowDef {
	id: string
	cells: RowCell[]
	stripedKey?: string | number
}

export interface AdminDataTableProps {
	// Structure
	columns: ColumnHeader[]
	rows: RowDef[]

	// Behavior
	isLoading?: boolean
	stickyHeader?: boolean
	compact?: boolean
	striped?: boolean

	// Empty/loading UI
	emptyState?: React.ReactNode
	loadingRowCount?: number

	// Header (optional)
	headerTitle?: string
	headerDescription?: string
	headerActions?: React.ReactNode

	// Top toolbar (below header, optional)
	leftActions?: React.ReactNode
	rightActions?: React.ReactNode

	// Styles
	className?: string
	containerClassName?: string
	tableClassName?: string
}

/**
 * AdminDataTable
 * A reusable table wrapper for admin listing pages that stays consistent
 * with the app's theme and patterns. It intentionally avoids new deps and
 * sticks to shadcn/ui components already in the codebase.
 */
export function AdminDataTable({
	columns,
	rows,
	isLoading = false,
	stickyHeader = true,
	compact = false,
	striped = true,
	emptyState,
	loadingRowCount = 6,
	headerTitle,
	headerDescription,
	headerActions,
	leftActions,
	rightActions,
	className,
	containerClassName,
	tableClassName
}: AdminDataTableProps) {
	const hasActionsBar = leftActions || rightActions
	const hasHeaderBlock = headerTitle || headerDescription || headerActions

	return (
		<Card className={cn('border-border/70 bg-card/90 overflow-hidden border shadow-sm', className)}>
			{hasHeaderBlock && (
				<CardHeader className="pb-4">
					<div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
						<div className="min-w-0">
							{headerTitle && (
								<CardTitle className="text-lg md:text-xl">
									{headerTitle}
								</CardTitle>
							)}
							{headerDescription && (
								<CardDescription className="mt-1 text-sm">
									{headerDescription}
								</CardDescription>
							)}
						</div>
						{headerActions && (
							<div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
								{headerActions}
							</div>
						)}
					</div>
				</CardHeader>
			)}

			{hasActionsBar && (
				<div className="px-5 pb-4 md:px-6">
					<div className="border-border/60 bg-muted/20 rounded-xl border p-3 md:p-4">
						<div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
							<div className="flex flex-1 flex-wrap items-center gap-2">
								{leftActions}
							</div>
							<div className="flex flex-wrap items-center gap-2">{rightActions}</div>
						</div>
					</div>
				</div>
			)}

			<CardContent className="pt-0 pb-5 md:pb-6">
				<div
					className={cn(
						// Container with themed border and scroll
						'border-border/60 overflow-auto rounded-xl border',
						containerClassName
					)}>
					<Table className={cn(tableClassName)}>
						<TableHeader
							className={cn(
								stickyHeader && 'sticky top-0 z-10',
								// keep header readable on scroll
								'bg-muted/60 supports-[backdrop-filter]:bg-muted/40 backdrop-blur'
							)}>
							<TableRow className="[&_th]:whitespace-nowrap">
								{columns.map((col) => (
									<TableHead
										key={col.key}
										className={cn(
											'text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase',
											col.align === 'right' && 'text-right',
											col.align === 'center' && 'text-center',
											col.hideOnMobile && 'hidden md:table-cell',
											col.className
										)}
										style={col.width ? {width: col.width} : undefined}>
										{col.content}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>

						<TableBody>
							{isLoading
								? renderLoadingRows(loadingRowCount, columns.length)
								: rows.length === 0
									? renderEmptyRow(columns.length, emptyState)
									: rows.map((row, rowIndex) => {
											const baseRowClasses = cn(
												'transition-colors hover:bg-muted/25',
												striped && rowIndex % 2 === 1 && 'bg-muted/30'
											)
											return (
												<TableRow
													key={row.id}
													className={baseRowClasses}
													data-row-id={row.id}>
													{row.cells.map((cell) => (
														<TableCell
															key={`${row.id}-${cell.key}`}
															className={cn(
																cell.align === 'right' && 'text-right',
																cell.align === 'center' && 'text-center',
																cell.hideOnMobile && 'hidden md:table-cell',
																compact ? 'py-2.5' : 'py-3.5',
																'align-middle',
																cell.className
															)}>
															{cell.content}
														</TableCell>
													))}
												</TableRow>
											)
										})}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	)
}

function renderEmptyRow(colSpan: number, emptyState?: React.ReactNode) {
	return (
		<TableRow>
			<TableCell colSpan={colSpan} className="py-10 text-center">
				{emptyState ?? (
					<div className="text-muted-foreground text-sm">No results found</div>
				)}
			</TableCell>
		</TableRow>
	)
}

function renderLoadingRows(count: number, colSpan: number) {
	return Array.from({length: count}).map((_, i) => (
		<TableRow key={`loading-${i}`} className="animate-pulse">
			<TableCell colSpan={colSpan} className="py-3">
				<div className="bg-muted h-6 w-full rounded" />
			</TableCell>
		</TableRow>
	))
}

/**
 * Example usage:
 *
 * <AdminDataTable
 *   headerTitle="Athlete Applications"
 *   headerDescription="Review funding requests; make changes in detail view"
 *   leftActions={<YourFilters />}
 *   rightActions={<Button variant="outline">Refresh</Button>}
 *   columns={[
 *     { key: 'name', header: 'Name', accessor: (r) => r.name },
 *     { key: 'email', header: 'Email', accessor: (r) => r.email, hideOnMobile: true },
 *     { key: 'race', header: 'Race', accessor: (r) => r.race },
 *     { key: 'status', header: 'Status', accessor: (r) => r.workflowStage },
 *   ]}
 *   data={rows}
 *   rowKey={(r) => r.id}
 *   rowHref={(r) => `/admin/applications/${r.id}`}
 *   rowAction={(r) => (
 *     <Link href={`/admin/applications/${r.id}`} className="text-primary text-sm hover:underline">
 *       View
 *     </Link>
 *   )}
 * />
 */
