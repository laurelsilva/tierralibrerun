'use client'

import { Eye, Loader2, Mail, Send } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import * as EmailActions from '@/app/admin/emails/actions'
import {
	adminDisabledProps,
	useAdminReadOnly,
} from '@/components/admin/admin-mode'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

interface MentorPairingEmailButtonProps {
	fundApplicationId: string
	athleteName: string
	athleteEmail: string
	mentorName: string
	mentorEmail: string
}

type PreviewState = {
	subject: string
	html: string
	bcc?: string[]
	to: Array<{
		name: string
		email: string
	}>
}

export function MentorPairingEmailButton({
	fundApplicationId,
	athleteName,
	athleteEmail,
	mentorName,
	mentorEmail,
}: MentorPairingEmailButtonProps) {
	const readOnly = useAdminReadOnly()
	const disabledProps = adminDisabledProps(
		readOnly,
		'Read-only admin: actions are disabled',
	)
	const [open, setOpen] = useState(false)
	const [pending, startTransition] = useTransition()
	const [previewLoading, setPreviewLoading] = useState(false)
	const [subjectOverride, setSubjectOverride] = useState('')
	const [additionalContext, setAdditionalContext] = useState('')
	const [preview, setPreview] = useState<PreviewState | null>(null)
	const previewRef = useRef<HTMLIFrameElement | null>(null)
	const [iframeHeight, setIframeHeight] = useState(960)
	const bccDisplayValue =
		preview?.bcc?.length && preview.bcc.length > 0
			? preview.bcc.join(', ')
			: process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'Admin team'

	function recalcIframeHeight() {
		const el = previewRef.current
		if (!el) return
		try {
			const doc = el.contentDocument || el.contentWindow?.document || null
			if (!doc) return
			const body = doc.body
			const height = Math.max(
				body?.scrollHeight || 0,
				body?.offsetHeight || 0,
				doc.documentElement?.scrollHeight || 0,
				doc.documentElement?.offsetHeight || 0,
			)
			if (height && Number.isFinite(height)) {
				setIframeHeight(height + 96)
			}
		} catch {
			// ignore cross-frame sizing issues
		}
	}

	async function buildPreview() {
		setPreviewLoading(true)
		try {
			const result = await EmailActions.previewMentorshipPairingEmail({
				fundApplicationId,
				subjectOverride,
				additionalContext,
			})

			if (result.success) {
				setPreview(result)
				return
			}

			toast.error(result.error || 'Failed to build email preview')
		} catch (error) {
			console.error('previewMentorshipPairingEmail error', error)
			toast.error('Failed to build email preview')
		} finally {
			setPreviewLoading(false)
		}
	}

	useEffect(() => {
		if (!open) return
		const handle = setTimeout(() => {
			void buildPreview()
		}, 250)
		return () => clearTimeout(handle)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, subjectOverride, additionalContext])

	useEffect(() => {
		recalcIframeHeight()
	}, [preview?.html])

	function handleSend() {
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}

		startTransition(async () => {
			const result = await EmailActions.sendMentorshipPairingEmail({
				fundApplicationId,
				subjectOverride,
				additionalContext,
			})

			if (result.success) {
				toast.success('Pairing email sent.')
				setOpen(false)
				return
			}

			toast.error(result.error || 'Failed to send pairing email')
		})
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="secondary" size="sm" {...disabledProps}>
					<Mail className="h-4 w-4" />
					Send Pairing Email
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[95vh] w-[95vw] overflow-hidden sm:!max-w-[95vw] lg:!max-w-[1120px]">
				<DialogHeader>
					<DialogTitle>Send Pairing Email</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 overflow-hidden md:grid-cols-[420px_minmax(0,1fr)]">
					<div className="max-h-[75vh] space-y-4 overflow-y-auto pr-2 md:max-h-[85vh]">
						<div className="rounded-lg border p-3">
							<div className="grid gap-2">
								<div className="grid gap-1">
									<Label>To</Label>
									<Input
										readOnly
										value={`${athleteName} <${athleteEmail}>, ${mentorName} <${mentorEmail}>`}
										className="cursor-default"
									/>
								</div>
								<div className="grid gap-1">
									<Label>BCC</Label>
									<Input
										readOnly
										value={bccDisplayValue}
										className="text-muted-foreground cursor-default"
									/>
								</div>
								<p className="text-muted-foreground text-xs">
									Both the athlete and mentor receive the email directly. Admin
									team gets a blind copy.
								</p>
							</div>
						</div>

						<div className="rounded-lg border p-3">
							<div className="grid gap-3">
								<div className="grid gap-1">
									<Label>Subject</Label>
									<Input
										value={subjectOverride}
										onChange={(event) => setSubjectOverride(event.target.value)}
										placeholder="Leave blank to use the default introduction subject"
										disabled={pending || !!disabledProps.disabled}
									/>
								</div>
								<div className="grid gap-1">
									<Label>Additional context</Label>
									<Textarea
										value={additionalContext}
										onChange={(event) =>
											setAdditionalContext(event.target.value)
										}
										placeholder="Optional note to add on top of the default introduction. This is useful for timing notes, shared context, or anything specific about the pairing."
										rows={7}
										disabled={pending || !!disabledProps.disabled}
									/>
									<p className="text-muted-foreground text-xs">
										Leave blank to send the default pairing introduction.
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between gap-3">
							<Button
								type="button"
								variant="secondary"
								onClick={() => {
									void buildPreview()
								}}
								disabled={pending}
							>
								<Eye className="h-4 w-4" />
								Refresh Preview
							</Button>
							<Button
								onClick={handleSend}
								disabled={!preview || pending || !!disabledProps.disabled}
								title={disabledProps.title}
							>
								<Send className="h-4 w-4" />
								{pending ? 'Sending...' : 'Send Pairing Email'}
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						<div className="rounded-lg border p-3">
							<div className="grid gap-1 text-sm">
								<div>
									<strong>To:</strong>{' '}
									{preview
										? preview.to.map((r) => `${r.name} <${r.email}>`).join(', ')
										: `${athleteName} <${athleteEmail}>, ${mentorName} <${mentorEmail}>`}
								</div>
								<div>
									<strong>BCC:</strong>{' '}
									{bccDisplayValue}
								</div>
								<div>
									<strong>Subject:</strong>{' '}
									{preview?.subject || 'Building preview...'}
								</div>
							</div>
						</div>

						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							<Eye className="h-4 w-4" />
							Preview
							{previewLoading ? (
								<span className="inline-flex items-center gap-1 text-xs">
									<Loader2 className="h-3 w-3 animate-spin" />
									building…
								</span>
							) : null}
						</div>

						<ScrollArea className="bg-card h-[80vh] rounded-lg border md:h-[90vh]">
							<iframe
								ref={previewRef}
								className="w-full"
								title="Pairing Email Preview"
								srcDoc={preview?.html || ''}
								style={{
									border: 'none',
									display: 'block',
									height: iframeHeight,
								}}
								sandbox="allow-same-origin"
								onLoad={() => {
									recalcIframeHeight()
								}}
							/>
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
