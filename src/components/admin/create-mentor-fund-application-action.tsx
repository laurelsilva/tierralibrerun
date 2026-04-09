'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	adminDisabledProps,
	useAdminReadOnly,
} from '@/components/admin/admin-mode'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { createMentorFundApplication } from '@/server/actions/admin'

interface CreateMentorFundApplicationActionProps {
	userId: string
	userName: string
}

export function CreateMentorFundApplicationAction({
	userId,
	userName,
}: CreateMentorFundApplicationActionProps) {
	const router = useRouter()
	const [isOpen, setIsOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)
	const readOnly = useAdminReadOnly()
	const disabledMeta = adminDisabledProps(
		readOnly,
		'Read-only mode: changes are disabled',
	)

	const handleCreate = async () => {
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}

		setIsCreating(true)
		try {
			const formData = new FormData()
			formData.append('userId', userId)

			const result = await createMentorFundApplication(formData)
			if (!result.success) {
				toast.error(result.error || 'Failed to create mentor athlete application')
				return
			}

			setIsOpen(false)
			toast.success(result.message || 'Mentor athlete application created')
			if (result.applicationId) {
				router.push(`/admin/applications/${result.applicationId}`)
			} else {
				router.refresh()
			}
		} catch (error) {
			console.error('Error creating mentor athlete application:', error)
			toast.error('An error occurred while creating the application')
		} finally {
			setIsCreating(false)
		}
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={!!disabledMeta.disabled}
					title={disabledMeta.title}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					Create Mentor Athlete Application
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Create mentor athlete application?</AlertDialogTitle>
					<AlertDialogDescription className="space-y-3">
						<p>
							This creates an admin-generated athlete application for{' '}
							<span className="font-medium">{userName}</span>.
						</p>
						<p>
							Confirmation is auto-completed, then you can continue registration
							and the remaining workflow steps manually.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isCreating}>Cancel</AlertDialogCancel>
					<Button
						type="button"
						onClick={handleCreate}
						disabled={isCreating || !!disabledMeta.disabled}
						title={disabledMeta.title}
					>
						{isCreating ? 'Creating...' : 'Create'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
