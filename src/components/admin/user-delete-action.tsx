'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteUser, getUserDeletionStats } from '@/server/actions/admin'

interface UserDeleteActionProps {
	userName: string
	userId: string
	clerkId: string
}

interface DeletionStats {
	fundApplications: number
	totalApplications: number
}

// Define error type
interface ErrorWithMessage {
	message: string
}

export function UserDeleteAction({
	userName,
	userId,
	clerkId,
}: UserDeleteActionProps) {
	const [isDeleting, setIsDeleting] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [stats, setStats] = useState<DeletionStats | null>(null)
	const [loadingStats, setLoadingStats] = useState(false)

	const loadDeletionStats = useCallback(async () => {
		setLoadingStats(true)
		try {
			const result = await getUserDeletionStats(userId)
			if (result.success && result.stats) {
				setStats(result.stats)
			}
		} catch (error) {
			console.error('Failed to load deletion stats:', error)
		} finally {
			setLoadingStats(false)
		}
	}, [userId])

	// Load deletion stats when dialog opens
	useEffect(() => {
		if (isOpen && !stats) {
			void loadDeletionStats()
		}
	}, [isOpen, stats, loadDeletionStats])

	const handleDelete = async () => {
		setIsDeleting(true)

		try {
			const formData = new FormData()
			formData.append('userId', userId)
			formData.append('clerkId', clerkId)

			const result = await deleteUser(formData)

			if (result.success) {
				// Close the dialog
				setIsOpen(false)

				// Show success message with details
				toast.success(
					result.message ||
						`User ${userName} and all data deleted successfully`,
					{
						duration: 6000,
						description:
							'User removed from database, authentication, and related records.',
					},
				)

				// Let the server revalidation handle the update
				// No redirect needed
			} else {
				toast.error(result.error || 'Unable to delete user')
			}
		} catch (error: unknown) {
			console.error('Error deleting user:', error)

			// Type guard to safely access message property
			const errorMessage =
				error && typeof error === 'object' && 'message' in error
					? (error as ErrorWithMessage).message
					: 'Unknown error'

			toast.error(`Error: ${errorMessage}`)
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-red-500 hover:bg-red-50 hover:text-red-700"
				>
					Delete
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Delete this user?
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-3">
						<p>
							You are about to permanently delete{' '}
							<span className="font-medium text-red-600">{userName}</span>.
						</p>
						{loadingStats ? (
							<div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
								<p className="text-sm text-gray-600">
									Loading impact details...
								</p>
							</div>
						) : stats ? (
							<div className="rounded-lg border border-red-200 bg-red-50 p-3">
								<p className="mb-2 font-medium text-red-800">
									This will remove:
								</p>
									<ul className="space-y-1 text-sm text-red-700">
										<li>• User account from database</li>
										<li>• User authentication from Clerk</li>
										<li>
											• {stats.fundApplications} fund application
											{stats.fundApplications !== 1 ? 's' : ''}
										</li>
										<li>• Newsletter subscription</li>
									</ul>
								{stats.totalApplications > 0 && (
									<div className="mt-2 rounded bg-red-100 p-2">
										<p className="text-xs font-medium text-red-800">
											{stats.totalApplications} application
											{stats.totalApplications !== 1 ? 's' : ''} will be
											permanently deleted
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="rounded-lg border border-red-200 bg-red-50 p-3">
								<p className="mb-2 font-medium text-red-800">
									This will remove:
								</p>
									<ul className="space-y-1 text-sm text-red-700">
										<li>• User account from database</li>
										<li>• User authentication from Clerk</li>
										<li>• All fund applications</li>
										<li>• Newsletter subscription</li>
									</ul>
								</div>
						)}
						<p className="text-sm font-medium text-red-600">
							This action cannot be undone.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<Button
						variant="destructive"
						disabled={isDeleting}
						onClick={handleDelete}
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
