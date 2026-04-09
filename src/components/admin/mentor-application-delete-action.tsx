'use client'

import {Trash2} from 'lucide-react'
import {useState} from 'react'
import {toast} from 'sonner'
import {
	useAdminReadOnly,
	adminDisabledProps
} from '@/components/admin/admin-mode'
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {deleteMentorApplication} from '@/server/actions/admin'

interface MentorApplicationDeleteActionProps {
	applicationId: string
	applicantName: string
	email: string
	onDelete?: () => void
}

// Define error type
interface ErrorWithMessage {
	message: string
}

export function MentorApplicationDeleteAction({
	applicationId,
	applicantName,
	email,
	onDelete
}: MentorApplicationDeleteActionProps) {
	const [isDeleting, setIsDeleting] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const readOnly = useAdminReadOnly()
	const disabledMeta = adminDisabledProps(
		readOnly,
		'Read-only mode: changes are disabled'
	)

	const handleDelete = async () => {
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}
		setIsDeleting(true)

		try {
			const formData = new FormData()
			formData.append('applicationId', applicationId)

			const result = await deleteMentorApplication(formData)

			if (result.success) {
				// Close the dialog
				setIsOpen(false)

				// Show success message
				toast.success(
					result.message ||
						`Mentor application from ${applicantName} deleted successfully`,
					{
						duration: 5000,
						description: 'The mentor application has been permanently removed.'
					}
				)

				// Call onDelete callback if provided (for redirects)
				if (onDelete) {
					onDelete()
				}
			} else {
				toast.error(result.error || 'Unable to delete mentor application')
			}
		} catch (error: unknown) {
			console.error('Error deleting mentor application:', error)

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
					disabled={!!disabledMeta.disabled}
					title={disabledMeta.title}
					className="text-red-500 hover:bg-red-50 hover:text-red-700">
					<Trash2 className="h-4 w-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Mentor Application?</AlertDialogTitle>
					<AlertDialogDescription className="space-y-3">
						<p>
							You are about to permanently delete the mentor application from{' '}
							<span className="font-medium text-red-600">{applicantName}</span>:
						</p>
						<div className="rounded-lg border border-red-200 bg-red-50 p-3">
							<p className="font-medium text-red-800">{email}</p>
						</div>
						<p className="text-sm font-medium text-red-600">
							This action cannot be undone.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<Button
						variant="destructive"
						disabled={isDeleting || !!disabledMeta.disabled}
						title={disabledMeta.title}
						onClick={handleDelete}>
						{isDeleting ? 'Deleting...' : 'Delete Application'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
