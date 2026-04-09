'use client'

import {
	type ColumnDef,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { type RaceSeriesListItem } from '@/lib/sanity/types'

interface RacesTableProps {
	races: RaceSeriesListItem[]
	columns: ColumnDef<RaceSeriesListItem>[]
}

export function RacesTable({ races, columns }: RacesTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: 'date', desc: false },
	])

	const table = useReactTable({
		data: races,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	})

	return (
		<div className="w-full">
			<div className="border-border bg-card overflow-x-auto rounded-lg border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="border-border bg-muted/30 border-b"
							>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											className="text-muted-foreground h-14 px-6 text-xs font-semibold tracking-wider uppercase"
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
									className="border-border/50 hover:bg-muted/20 border-b transition-colors last:border-0"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="px-6 py-5">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="text-muted-foreground h-32 px-6 text-center"
								>
									No races found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
