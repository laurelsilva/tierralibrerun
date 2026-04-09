'use client'

import {useRouter} from 'next/navigation'
import {MentorApplicationDeleteAction} from './mentor-application-delete-action'

interface MentorApplicationDeleteWithRedirectProps {
	applicationId: string
	applicantName: string
	email: string
	redirectTo: string
}

export function MentorApplicationDeleteWithRedirect({
	applicationId,
	applicantName,
	email,
	redirectTo
}: MentorApplicationDeleteWithRedirectProps) {
	const router = useRouter()

	const handleDelete = () => {
		// Add a small delay to allow the toast to show before redirect
		setTimeout(() => {
			router.push(redirectTo)
		}, 1000)
	}

	return (
		<MentorApplicationDeleteAction
			applicationId={applicationId}
			applicantName={applicantName}
			email={email}
			onDelete={handleDelete}
		/>
	)
}
