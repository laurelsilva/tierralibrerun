'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	useAdminReadOnly,
	adminDisabledProps,
} from '@/components/admin/admin-mode'
import { Button } from '@/components/ui/button'
import { setUserFundApplicationLimitExempt } from '@/server/actions/admin'

interface UserFundLimitExemptionToggleProps {
	userId: string
	initialValue: boolean
}

export function UserFundLimitExemptionToggle({
	userId,
	initialValue,
}: UserFundLimitExemptionToggleProps) {
	const router = useRouter()
	const [value, setValue] = useState(initialValue)
	const [isSaving, setIsSaving] = useState(false)

	const readOnly = useAdminReadOnly()
	const disabledMeta = adminDisabledProps(
		readOnly,
		'Read-only admin: actions are disabled',
	)

	const handleToggle = async () => {
		if (readOnly) {
			toast.error('Read-only admin: actions are disabled.')
			return
		}

		setIsSaving(true)
		const next = !value

		try {
			const result = await setUserFundApplicationLimitExempt(userId, next)
			if (!result.success) {
				toast.error(result.error || 'Failed to update exemption')
				return
			}

			setValue(next)
			toast.success(
				next
					? '6-month limit exemption enabled'
					: '6-month limit exemption disabled',
			)
			router.refresh()
		} catch (error) {
			console.error('Error updating exemption:', error)
			toast.error('An error occurred while updating the exemption')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="flex items-center gap-3">
			<div className="text-sm">
				<span className="text-muted-foreground">Exempt: </span>
				<span className="font-medium">{value ? 'Yes' : 'No'}</span>
			</div>
			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={handleToggle}
				disabled={isSaving || !!disabledMeta.disabled}
				title={disabledMeta.title}
			>
				{isSaving ? 'Saving...' : value ? 'Disable' : 'Enable'}
			</Button>
		</div>
	)
}
