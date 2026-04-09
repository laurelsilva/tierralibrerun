'use client'

import {
	ArrowLeft,
	Eye,
	Loader2,
	Mail,
	Send,
	SendHorizonal,
	Users,
	UserCheck,
	Activity,
	UserMinus,
	Newspaper,
} from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { previewBroadcast, sendBroadcast, sendTestEmail } from './actions'

import {
	useAdminReadOnly,
	adminDisabledProps,
} from '@/components/admin/admin-mode'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import {
	type Recipient,
	type RaceGroup,
	type GroupId,
} from '@/server/admin/email-groups'

type VisibleGroupId = Exclude<GroupId, 'no-show-or-dropped-athletes'>

/* =======================================================
   Group metadata
   ======================================================= */

const GROUP_META: Record<
	VisibleGroupId,
	{ label: string; description: string; icon: React.ElementType }
> = {
	'active-athletes': {
		label: 'Active Participants',
		description: 'Participants currently in the program with upcoming races',
		icon: Activity,
	},
	'active-by-race-series': {
		label: 'By Race Series',
		description: 'Active participants grouped by race series',
		icon: Users,
	},
	'no-longer-active-athletes': {
		label: 'Race Completed',
		description: 'Participants who completed their supported race cycle',
		icon: UserMinus,
	},
	'active-mentors': {
		label: 'Active Mentors',
		description: 'Approved mentors in the program',
		icon: UserCheck,
	},
	newsletter: {
		label: 'Newsletter',
		description: 'All newsletter subscribers',
		icon: Newspaper,
	},
}

const GROUP_IDS: VisibleGroupId[] = [
	'active-athletes',
	'active-by-race-series',
	'no-longer-active-athletes',
	'active-mentors',
	'newsletter',
]

/* =======================================================
   Props
   ======================================================= */

interface BroadcastClientProps {
	activeAthletes: Recipient[]
	activeRaceGroups: RaceGroup[]
	noLongerActiveAthletes: Recipient[]
	mentors: Recipient[]
	subscribers: Recipient[]
}

/* =======================================================
   Component
   ======================================================= */

export function BroadcastClient({
	activeAthletes,
	activeRaceGroups,
	noLongerActiveAthletes,
	mentors,
	subscribers,
}: BroadcastClientProps) {
	const readOnly = useAdminReadOnly()
	const disabledProps = adminDisabledProps(readOnly)

	// Group selection
	const [activeGroup, setActiveGroup] =
		useState<VisibleGroupId>('active-athletes')
	const [selectedRace, setSelectedRace] = useState<string>('')
	const [showAllRecipients, setShowAllRecipients] = useState(false)

	// Composer
	const [subject, setSubject] = useState('')
	const [body, setBody] = useState('')
	const [ctaUrl, setCtaUrl] = useState('')
	const [ctaLabel, setCtaLabel] = useState('')

	// Preview
	const [previewHtml, setPreviewHtml] = useState('')
	const [previewLoading, setPreviewLoading] = useState(false)
	const previewRef = useRef<HTMLIFrameElement | null>(null)
	const [iframeHeight, setIframeHeight] = useState(600)

	// Sending
	const [sending, setSending] = useState(false)
	const [sendingTest, setSendingTest] = useState(false)

	/* -------------------------------------------------------
	   Derived data
	   ------------------------------------------------------- */

	const recipientMap = useMemo<Record<VisibleGroupId, Recipient[]>>(
		() => ({
			'active-athletes': activeAthletes,
			'active-by-race-series': activeAthletes, // filtered below if race selected
			'no-longer-active-athletes': noLongerActiveAthletes,
			'active-mentors': mentors,
			newsletter: subscribers,
		}),
		[
			activeAthletes,
			noLongerActiveAthletes,
			mentors,
			subscribers,
		],
	)

	const raceGroupOptions = useMemo(
		() => (activeGroup === 'active-by-race-series' ? activeRaceGroups : []),
		[activeGroup, activeRaceGroups],
	)

	const activeRecipients = useMemo(() => {
		if (activeGroup === 'active-by-race-series' && selectedRace) {
			const group = raceGroupOptions.find((g) => g.raceName === selectedRace)
			return group?.athletes ?? []
		}
		return recipientMap[activeGroup]
	}, [activeGroup, selectedRace, raceGroupOptions, recipientMap])

	const visibleRecipients = useMemo(() => {
		if (showAllRecipients) return activeRecipients
		return activeRecipients.slice(0, 10)
	}, [activeRecipients, showAllRecipients])

	/* -------------------------------------------------------
	   Preview builder (debounced)
	   ------------------------------------------------------- */

	const recalcIframeHeight = useCallback(() => {
		const el = previewRef.current
		if (!el) return
		try {
			const doc = el.contentDocument || el.contentWindow?.document || null
			if (!doc) return
			const b = doc.body
			const h = Math.max(
				b?.scrollHeight || 0,
				b?.offsetHeight || 0,
				doc.documentElement?.scrollHeight || 0,
				doc.documentElement?.offsetHeight || 0,
			)
			if (h && Number.isFinite(h)) setIframeHeight(h + 96)
		} catch {
			// cross-origin safety
		}
	}, [])

	useEffect(() => {
		if (!body.trim()) {
			setPreviewHtml('')
			return
		}
		const handle = setTimeout(async () => {
			setPreviewLoading(true)
			try {
				const res = await previewBroadcast({
					body,
					ctaUrl: ctaUrl || undefined,
					ctaLabel: ctaLabel || undefined,
				})
				setPreviewHtml(res.html)
			} catch {
				toast.error('Failed to build preview')
			} finally {
				setPreviewLoading(false)
			}
		}, 300)
		return () => clearTimeout(handle)
	}, [body, ctaUrl, ctaLabel])

	useEffect(() => {
		recalcIframeHeight()
	}, [previewHtml, recalcIframeHeight])

	// Reset race filter and recipient list when group changes
	useEffect(() => {
		setSelectedRace('')
		setShowAllRecipients(false)
	}, [activeGroup])

	/* -------------------------------------------------------
	   Send handlers
	   ------------------------------------------------------- */

	async function handleSend() {
		if (!subject.trim() || !body.trim() || activeRecipients.length === 0) return

		setSending(true)
		try {
			const result = await sendBroadcast({
				recipients: activeRecipients.map((r) => ({
					id: r.id,
					email: r.email,
					name: r.name,
				})),
				subject: subject.trim(),
				body,
				ctaUrl: ctaUrl || undefined,
				ctaLabel: ctaLabel || undefined,
				groupId: activeGroup,
			})

			if (result.success) {
				toast.success(
					`Sent ${result.sent} email${result.sent !== 1 ? 's' : ''} successfully`,
				)
				// Reset composer after successful send
				setSubject('')
				setBody('')
				setCtaUrl('')
				setCtaLabel('')
				setPreviewHtml('')
			} else {
				const errorSummary =
					result.errors.length > 0
						? result.errors.slice(0, 3).join('; ')
						: 'Send failed'
				toast.error(
					`${result.sent} sent, ${result.failed} failed. ${errorSummary}`,
				)
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to send broadcast',
			)
		} finally {
			setSending(false)
		}
	}

	async function handleSendTest() {
		if (!subject.trim() || !body.trim()) {
			toast.error('Write a subject and message before sending a test')
			return
		}

		setSendingTest(true)
		try {
			const result = await sendTestEmail({
				subject: subject.trim(),
				body,
				ctaUrl: ctaUrl || undefined,
				ctaLabel: ctaLabel || undefined,
			})

			if (result.success) {
				toast.success(`Test email sent to ${result.sentTo}`)
			} else {
				toast.error(result.error || 'Failed to send test email')
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to send test email',
			)
		} finally {
			setSendingTest(false)
		}
	}

	/* -------------------------------------------------------
	   Validation
	   ------------------------------------------------------- */

	const canSend =
		!readOnly &&
		!sending &&
		subject.trim().length > 0 &&
		body.trim().length > 0 &&
		activeRecipients.length > 0

	const canSendTest =
		!readOnly &&
		!sendingTest &&
		subject.trim().length > 0 &&
		body.trim().length > 0

	const groupLabel = GROUP_META[activeGroup].label
	const recipientCount = activeRecipients.length
	const showRaceColumn =
		activeGroup === 'active-athletes' ||
		activeGroup === 'active-by-race-series' ||
		activeGroup === 'no-longer-active-athletes'

	/* -------------------------------------------------------
	   Render
	   ------------------------------------------------------- */

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/admin">
							<ArrowLeft className="mr-1 h-4 w-4" />
							Admin
						</Link>
					</Button>
					<Separator orientation="vertical" className="h-6" />
					<div>
						<h1 className="text-2xl font-bold">Email Broadcasts</h1>
						<p className="text-muted-foreground text-sm">
							Send one message to a selected group
						</p>
					</div>
				</div>
			</div>

			{/* Group selector tabs */}
			<Tabs
				value={activeGroup}
				onValueChange={(v) => setActiveGroup(v as VisibleGroupId)}
			>
				<TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2 xl:grid-cols-5">
					{GROUP_IDS.map((id) => {
						const meta = GROUP_META[id]
						const Icon = meta.icon
						const count =
							id === 'active-by-race-series'
								? activeRaceGroups.reduce(
										(sum, g) => sum + g.athletes.length,
										0,
									)
								: recipientMap[id].length
						return (
							<TabsTrigger
								key={id}
								value={id}
								className="bg-card/70 border-border/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex h-auto w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left"
							>
								<span className="flex min-w-0 items-center gap-1.5">
									<Icon className="h-3.5 w-3.5 shrink-0" />
									<span className="truncate">{meta.label}</span>
								</span>
								<span
									className="bg-muted text-muted-foreground data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium"
									data-state={activeGroup === id ? 'active' : 'inactive'}
								>
									{count}
								</span>
							</TabsTrigger>
						)
					})}
				</TabsList>

				{/* All tab content shares the same layout */}
				{GROUP_IDS.map((id) => (
					<TabsContent key={id} value={id} className="mt-4">
						<p className="text-muted-foreground mb-4 text-sm">
							{GROUP_META[id].description}
						</p>
					</TabsContent>
				))}
			</Tabs>

			{/* Main two-column layout */}
			<div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
				{/* Left column: Controls */}
				<div className="space-y-4">
					{/* Race filter (conditional) */}
					{activeGroup === 'active-by-race-series' &&
						raceGroupOptions.length > 0 && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Filter by Race Series</CardTitle>
								<CardDescription>
									Pick one series to narrow recipients
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Select
									value={selectedRace}
									onValueChange={setSelectedRace}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="All series" />
									</SelectTrigger>
									<SelectContent>
										{raceGroupOptions.map((group) => (
											<SelectItem key={group.raceName} value={group.raceName}>
												{group.raceName}
												<span className="text-muted-foreground ml-2 text-xs">
													({group.athletes.length} athlete
													{group.athletes.length !== 1 ? 's' : ''})
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{selectedRace && (
									<Button
										variant="ghost"
										size="sm"
										className="mt-2"
										onClick={() => setSelectedRace('')}
									>
										Clear
									</Button>
								)}
							</CardContent>
						</Card>
					)}

					{/* Recipients list */}
					<Card className="overflow-hidden">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">Recipients</CardTitle>
								<Badge variant="outline">
									{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							{recipientCount === 0 ? (
								<p className="text-muted-foreground py-4 text-center text-sm">
									No recipients in this group
								</p>
							) : (
								<>
									<div className="max-h-[300px] overflow-y-auto rounded-md border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="sticky top-0 bg-background">Name</TableHead>
													<TableHead className="sticky top-0 bg-background">Email</TableHead>
													{showRaceColumn && (
														<TableHead className="sticky top-0 bg-background">Race</TableHead>
													)}
												</TableRow>
											</TableHeader>
											<TableBody>
												{visibleRecipients.map((r) => (
													<TableRow key={r.id}>
														<TableCell className="py-2 font-medium">
															{r.name || '—'}
														</TableCell>
														<TableCell className="text-muted-foreground py-2 text-sm">
															{r.email}
														</TableCell>
														{showRaceColumn && (
															<TableCell className="text-muted-foreground py-2 text-sm">
																{r.race || '—'}
															</TableCell>
														)}
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									{activeRecipients.length > 10 && (
										<Button
											variant="ghost"
											size="sm"
											className="mt-2 w-full"
											onClick={() => setShowAllRecipients((v) => !v)}
										>
											{showAllRecipients
												? 'Show fewer'
												: `Show all ${activeRecipients.length} recipients`}
										</Button>
									)}
								</>
							)}
						</CardContent>
					</Card>

					{/* Email composer */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Message</CardTitle>
							<CardDescription>
								Write one message for this group. The greeting is personalized with first name.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Subject */}
							<div className="space-y-1.5">
								<Label htmlFor="broadcast-subject">Subject</Label>
								<Input
									id="broadcast-subject"
									placeholder="Post-race check-in"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									{...disabledProps}
								/>
							</div>

							{/* Body */}
							<div className="space-y-1.5">
								<Label htmlFor="broadcast-body">Message</Label>
								<Textarea
									id="broadcast-body"
									placeholder={`Write your message...\n\nUse a blank line between paragraphs.`}
									value={body}
									onChange={(e) => setBody(e.target.value)}
									className="min-h-[160px]"
									{...disabledProps}
								/>
								<p className="text-muted-foreground text-xs">
									Plain text only. Use blank lines for new paragraphs.
								</p>
							</div>

							<Separator />

							{/* CTA Link */}
							<div className="space-y-1.5">
								<Label htmlFor="broadcast-cta-url">
									Link URL{' '}
									<span className="text-muted-foreground font-normal">
										(optional)
									</span>
								</Label>
								<Input
									id="broadcast-cta-url"
									type="url"
									placeholder="https://..."
									value={ctaUrl}
									onChange={(e) => setCtaUrl(e.target.value)}
									{...disabledProps}
								/>
							</div>

							{/* CTA Label */}
							{ctaUrl.trim() && (
								<div className="space-y-1.5">
									<Label htmlFor="broadcast-cta-label">Button Text</Label>
									<Input
										id="broadcast-cta-label"
										placeholder="Take the Survey"
										value={ctaLabel}
										onChange={(e) => setCtaLabel(e.target.value)}
										{...disabledProps}
									/>
									<p className="text-muted-foreground text-xs">
										Shows as a button in the email. Defaults to &ldquo;Learn More&rdquo; if blank.
									</p>
								</div>
							)}

							<Separator />

							{/* Send area */}
							<div className="space-y-3">
								<div className="text-muted-foreground text-sm">
									{recipientCount > 0
										? `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''} in ${groupLabel}`
										: 'No recipients selected'}
								</div>

								<div className="flex flex-wrap items-center gap-2">
									{/* Send test to myself */}
									<Button
										variant="outline"
										size="sm"
										disabled={!canSendTest}
										onClick={handleSendTest}
										className="gap-1.5"
										{...disabledProps}
									>
										{sendingTest ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
												Sending test…
											</>
										) : (
											<>
												<SendHorizonal className="h-3.5 w-3.5" />
												Send Test
											</>
										)}
									</Button>

									{/* Send broadcast with confirmation */}
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												disabled={!canSend}
												className="gap-2"
												{...disabledProps}
											>
												{sending ? (
													<>
														<Loader2 className="h-4 w-4 animate-spin" />
														Sending…
													</>
												) : (
													<>
														<Send className="h-4 w-4" />
														Send to {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
													</>
												)}
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Confirm Send
												</AlertDialogTitle>
												<AlertDialogDescription className="space-y-2">
													<span className="block">
														You are about to send this email to{' '}
														<strong>
															{recipientCount} recipient
															{recipientCount !== 1 ? 's' : ''}
														</strong>{' '}
														in <strong>{groupLabel}</strong>.
													</span>
													<span className="block">
														<strong>Subject:</strong>{' '}
														{subject || '(empty)'}
													</span>
													<span className="block text-sm">
														This send cannot be undone.
													</span>
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={handleSend}
													disabled={sending}
												>
													{sending ? (
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Sending…
														</>
													) : (
														`Send to ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`
													)}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right column: Preview */}
				<div className="space-y-3">
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Eye className="text-muted-foreground h-4 w-4" />
									<CardTitle className="text-base">Preview</CardTitle>
									{previewLoading && (
										<Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
									)}
								</div>
								<Badge variant="outline" className="text-xs">
									{groupLabel}
								</Badge>
							</div>
							{subject && (
								<CardDescription className="truncate pt-1">
									<strong>Subject:</strong> {subject}
								</CardDescription>
							)}
						</CardHeader>
						<CardContent>
							{previewHtml ? (
								<ScrollArea className="bg-card rounded-lg border">
									<iframe
										ref={previewRef}
										className="w-full"
										title="Email Preview"
										srcDoc={previewHtml}
										style={{
											border: 'none',
											display: 'block',
											height: iframeHeight,
											minHeight: 400,
										}}
										sandbox="allow-same-origin"
										onLoad={recalcIframeHeight}
									/>
								</ScrollArea>
							) : (
								<div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
									<Mail className="mb-3 h-8 w-8 opacity-40" />
									<p className="text-sm">
										Start writing to see the preview
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
