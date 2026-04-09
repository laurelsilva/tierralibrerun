'use client'

import {useRouter} from 'next/navigation'
import {ApplicationDeleteAction} from './application-delete-action'

interface ApplicationDeleteWithRedirectProps {
	applicationId: string
	applicantName: string
	race: string
	redirectTo: string
}

export function ApplicationDeleteWithRedirect({
	applicationId,
	applicantName,
	race,
	redirectTo
}: ApplicationDeleteWithRedirectProps) {
	const router = useRouter()

	const handleDelete = () => {
		// Add a small delay to allow the toast to show before redirect
		setTimeout(() => {
			router.push(redirectTo)
		}, 1000)
	}

	return (
		<ApplicationDeleteAction
			applicationId={applicationId}
			applicantName={applicantName}
			race={race}
			onDelete={handleDelete}
		/>
	)
}
