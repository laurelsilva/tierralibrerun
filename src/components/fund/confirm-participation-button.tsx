'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { confirmFundParticipation } from '@/server/actions/workflow'

interface ConfirmParticipationButtonProps {
	applicationId: string
}

export function ConfirmParticipationButton({
	applicationId,
}: ConfirmParticipationButtonProps) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	return (
		<Button
			size="sm"
			onClick={() => {
				startTransition(async () => {
					const result = await confirmFundParticipation(applicationId)
					if (result.success) {
						toast.success('Participation confirmed. Thank you!')
						router.refresh()
					} else {
						toast.error(result.error || 'Failed to confirm participation')
					}
				})
			}}
			disabled={pending}
		>
			{pending ? 'Confirming...' : 'Confirm Participation'}
		</Button>
	)
}

export default ConfirmParticipationButton
