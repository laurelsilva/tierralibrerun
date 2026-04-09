'use client'

import { Mail, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AdminDetailSection } from '@/components/admin/admin-detail'
import { Badge } from '@/components/ui/badge'

interface EmailLog {
	id: string
	emailType:
		| 'APPROVAL'
		| 'REJECTION'
		| 'WAITLIST'
		| 'CUSTOM'
		| 'UPDATE'
		| 'INVITE'
		| 'REMINDER'
		| 'ANNOUNCEMENT'
	recipientEmail: string
	status: 'SENT' | 'FAILED'
	sentAt: string
}

interface EmailLogsProps {
	applicationId: string
	applicationType: 'FUND' | 'MENTOR'
	className?: string
}

export function EmailLogs({
	applicationId,
	applicationType,
	className,
}: EmailLogsProps) {
	const [logs, setLogs] = useState<EmailLog[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchEmailLogs = async () => {
			try {
				const response = await fetch(
					`/api/admin/email-logs?applicationId=${applicationId}&applicationType=${applicationType}`,
				)
				if (response.ok) {
					const data = await response.json()
					setLogs(data as EmailLog[])
				}
			} catch (error) {
				console.error('Failed to fetch email logs:', error)
			} finally {
				setLoading(false)
			}
		}

		void fetchEmailLogs()
	}, [applicationId, applicationType])

	const getEmailTypeLabel = (type: string) => {
		switch (type) {
			case 'APPROVAL':
				return 'Approval'
			case 'REJECTION':
				return 'Rejection'
			case 'WAITLIST':
				return 'Waitlist'
			case 'CUSTOM':
				return 'Custom'
			case 'UPDATE':
				return 'Update'
			case 'INVITE':
				return 'Invite'
			case 'REMINDER':
				return 'Reminder'
			case 'ANNOUNCEMENT':
				return 'Announcement'
			default:
				return type
		}
	}

	const getEmailTypeColor = (type: string) => {
		switch (type) {
			case 'APPROVAL':
				return 'bg-secondary text-secondary-foreground'
			case 'REJECTION':
				return 'bg-destructive/15 text-destructive'
			case 'WAITLIST':
				return 'bg-accent text-accent-foreground'
			case 'CUSTOM':
				return 'bg-muted text-muted-foreground'
			case 'UPDATE':
				return 'bg-primary/15 text-primary'
			case 'INVITE':
				return 'bg-secondary text-secondary-foreground'
			case 'REMINDER':
				return 'bg-accent text-accent-foreground'
			case 'ANNOUNCEMENT':
				return 'bg-primary/15 text-primary'
			default:
				return 'bg-muted text-muted-foreground'
		}
	}

	const getStatusIcon = (status: string) => {
		return status === 'SENT' ? (
			<CheckCircle className="text-primary h-4 w-4" />
		) : (
			<XCircle className="text-destructive h-4 w-4" />
		)
	}

	if (loading) {
		return (
			<AdminDetailSection title="Email Log" className={className}>
				<div className="text-muted-foreground flex items-center gap-2 py-4">
					<Mail className="h-4 w-4 animate-pulse" />
					<span className="text-sm">Loading emails...</span>
				</div>
			</AdminDetailSection>
		)
	}

	if (logs.length === 0) {
		return (
			<AdminDetailSection title="Email Log" className={className}>
				<div className="text-muted-foreground flex items-center gap-2 py-4">
					<Mail className="h-4 w-4" />
					<span className="text-sm">No emails sent yet.</span>
				</div>
			</AdminDetailSection>
		)
	}

	return (
		<AdminDetailSection title="Email Log" className={className}>
			<div className="mt-10 space-y-3">
				{logs.map((log) => (
					<div
						key={log.id}
						className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
					>
						<div className="flex items-center gap-3">
							{getStatusIcon(log.status)}
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Badge
										variant="secondary"
										className={`text-xs font-medium ${getEmailTypeColor(
											log.emailType,
										)}`}
									>
										{getEmailTypeLabel(log.emailType)} Email
									</Badge>
									<span className="text-sm font-medium">
										{log.status === 'SENT' ? 'Sent' : 'Failed'}
									</span>
								</div>
								<div className="text-muted-foreground text-xs">
									Recipient: {log.recipientEmail}
								</div>
							</div>
						</div>
						<div className="text-muted-foreground flex items-center gap-1 text-xs">
							<Clock className="h-3 w-3" />
							{new Date(log.sentAt).toLocaleDateString()}{' '}
							{new Date(log.sentAt).toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</div>
					</div>
				))}
			</div>
		</AdminDetailSection>
	)
}
