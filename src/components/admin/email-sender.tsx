'use client'

import { Eye, Loader2, Mail, Send } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as EmailActions from '@/app/admin/emails/actions'
import {
	useAdminReadOnly,
	adminDisabledProps,
} from '@/components/admin/admin-mode'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
	getFundAdminStatus,
	type FundWorkflowStage,
} from '@/lib/types/workflow'

// Server actions (called from client via "as any" shim)

type ApplicationType = 'FUND' | 'MENTOR'
type AppStatus = 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'PENDING'

type FundEmailProfileId =
	| 'CONFIRMATION_REQUEST'
	| 'WAITLIST_UPDATE'
	| 'REJECTION'
	| 'REGISTRATION_IN_PROGRESS'
	| 'REGISTRATION_COMPLETE'
	| 'POST_RACE_CLOSEOUT'
	| 'WITHDRAWAL_CLOSEOUT'

type FundEmailProfile = {
	id: FundEmailProfileId
	label: string
	description: string
	status: Exclude<AppStatus, 'PENDING'>
	tokenDefaults?: Record<string, unknown>
}

export interface EmailSenderProps {
	applicationId: string
	applicantName: string
	recipientEmail: string
	applicationType?: ApplicationType
	status?: AppStatus
	applicationWorkflowStage?: string
	applicationRecordStatus?: string | null
	triggerLabel?: string
	defaultTokens?: Record<string, unknown>
	onSent?: (result: { to: string; subject: string; id?: string }) => void
	className?: string
}

/**
 * EmailSender
 * - Lightweight dialog for sending STANDARD (templated)
 * - Minimal token editor per application type
 */
export default function EmailSender(props: EmailSenderProps) {
	const {
		applicationId,
		applicantName,
		recipientEmail,
		applicationType: initialType = 'FUND',
		status: initialStatus = 'PENDING',
		applicationWorkflowStage,
		applicationRecordStatus,
		triggerLabel = 'Send Email',
		defaultTokens,
		onSent,
		className,
	} = props

	// Dialog
	const [open, setOpen] = useState(false)
	const readOnly = useAdminReadOnly()

	// Global fields
	const [toEmail] = useState(recipientEmail)
	const [bccRaw, setBccRaw] = useState('')

	const [status, setStatus] = useState<AppStatus>(initialStatus)

	// Tokens (simple object)
	const [tokens, setTokens] = useState<Record<string, unknown>>(() =>
		buildBaseTokens(applicantName, defaultTokens),
	)
	const tokensRev = useRef(0)
	// Read-only mode: keep UI mounted; disable actions via props and guards below
	const disabledProps = adminDisabledProps(
		readOnly,
		'Read-only admin: actions are disabled',
	)
	function applyTokens(
		patch:
			| Record<string, unknown>
			| ((prev: Record<string, unknown>) => Record<string, unknown>),
	) {
		setTokens((prev) => {
			const next =
				typeof patch === 'function'
					? (
							patch as (
								prev: Record<string, unknown>,
							) => Record<string, unknown>
						)(prev)
					: deepMerge(prev, patch as Record<string, unknown>)
			tokensRev.current += 1
			return next
		})
	}
	function deepMerge<T extends Record<string, unknown>>(
		target: T,
		source: Partial<T>,
	): T {
		const out: Record<string, unknown> = {
			...(target as Record<string, unknown>),
		}
		for (const [k, v] of Object.entries(source || {})) {
			if (v && typeof v === 'object' && !Array.isArray(v)) {
				const child = (out[k] ?? {}) as Record<string, unknown>
				out[k] = deepMerge(child, v as Record<string, unknown>)
			} else {
				out[k] = v as unknown
			}
		}
		return out as T
	}

	// CUSTOM fields

	// Preview state
	const [previewLoading, setPreviewLoading] = useState(false)
	const [gearItemDraft, setGearItemDraft] = useState('')
	const [previewSubject, setPreviewSubject] = useState('')
	const [previewHtml, setPreviewHtml] = useState('')
	const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview')
	const previewRef = useRef<HTMLIFrameElement | null>(null)
	const [iframeHeight, setIframeHeight] = useState<number>(960)
	const fundEmailProfiles = useMemo(
		() =>
			initialType === 'FUND'
				? getFundEmailProfiles(applicationWorkflowStage, applicationRecordStatus)
				: [],
		[applicationRecordStatus, applicationWorkflowStage, initialType],
	)
	const [fundEmailProfileId, setFundEmailProfileId] =
		useState<FundEmailProfileId | null>(fundEmailProfiles[0]?.id ?? null)
	function recalcIframeHeight() {
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
			// ignore
		}
	}

	// Debounce preview on changes
	useEffect(() => {
		if (!open) return
		const handle = setTimeout(() => {
			void buildStandardPreview()
		}, 300)
		return () => clearTimeout(handle)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, initialType, status, toEmail, JSON.stringify(tokens)])

	useEffect(() => {
		// Recalculate preview height when HTML changes
		recalcIframeHeight()
	}, [previewHtml])

	useEffect(() => {
		if (initialType !== 'FUND') return
		if (fundEmailProfiles.length === 0) {
			setFundEmailProfileId(null)
			return
		}
		setFundEmailProfileId((current) => {
			if (current && fundEmailProfiles.some((profile) => profile.id === current)) {
				return current
			}
			return fundEmailProfiles[0]?.id ?? null
		})
	}, [fundEmailProfiles, initialType])

	useEffect(() => {
		if (initialType !== 'FUND' || !fundEmailProfileId) return
		const selectedProfile = fundEmailProfiles.find(
			(profile) => profile.id === fundEmailProfileId,
		)
		if (!selectedProfile) return
		setStatus(selectedProfile.status)
		setTokens(
			applyEmailProfileDefaults(
				buildBaseTokens(applicantName, defaultTokens),
				selectedProfile,
			),
		)
	}, [
		applicantName,
		defaultTokens,
		fundEmailProfileId,
		fundEmailProfiles,
		initialType,
	])

	async function buildStandardPreview() {
		if (!toEmail || toEmail.trim().length === 0) return
		// status for STANDARD must not be PENDING
		if (status === 'PENDING') {
			toast.info(
				'Pick a decision (Approved, Waitlisted, or Rejected) before previewing.',
			)
			setPreviewSubject('')
			setPreviewHtml('')
			return
		}
		const stdStatus = status

		setPreviewLoading(true)
		try {
			const res = (await EmailActions.previewEmail({
				applicationType: initialType,
				applicationId,
				mode: 'STANDARD',
				status: stdStatus,
				category: 'STATUS',
				tokens,
			})) as {
				success: boolean
				subject?: string
				html?: string
				error?: string
			}
			if (res?.success) {
				setPreviewSubject(res.subject ?? '')
				setPreviewHtml(res.html ?? '')
			} else {
				toast.error(res?.error || 'Failed to build preview')
			}
		} catch (e) {
			console.error('previewEmail error', e)
			toast.error('Failed to build preview')
		} finally {
			setPreviewLoading(false)
		}
	}

	async function handleSend() {
		if (!toEmail || toEmail.trim().length === 0) {
			toast.error('Missing recipient email')
			return
		}

		const parsedBcc = parseEmailList(bccRaw)
		if ('error' in parsedBcc) {
			toast.error(parsedBcc.error)
			return
		}

		try {
			const stdStatus =
				status === 'PENDING'
					? ('APPROVED' as Exclude<AppStatus, 'PENDING'>)
					: status
			const result = (await EmailActions.sendEmail({
				applicationType: initialType,
				applicationId,
				mode: 'STANDARD',
				status: stdStatus,
				category: 'STATUS',
				to: toEmail.trim(),
				bcc: parsedBcc,
				tokens,
			})) as { success: boolean; id?: string; error?: string }

			if (result?.success) {
				toast.success('Email sent')
				onSent?.({
					to: toEmail.trim(),
					subject: previewSubject,
					id: result?.id,
				})
				setOpen(false)
			} else {
				toast.error(result?.error || 'Failed to send email')
			}
		} catch (e) {
			console.error('sendEmail error', e)
			toast.error('Failed to send email')
		}
	}

	function resetTokens() {
		const baseTokens = buildBaseTokens(applicantName, defaultTokens)
		if (initialType === 'FUND' && fundEmailProfileId) {
			const selectedProfile = fundEmailProfiles.find(
				(profile) => profile.id === fundEmailProfileId,
			)
			setTokens(
				selectedProfile
					? applyEmailProfileDefaults(baseTokens, selectedProfile)
					: baseTokens,
			)
			return
		}
		setTokens(baseTokens)
	}

	function parseEmailList(raw: string): string[] | { error: string } {
		const items = raw
			.split(/[\n,;]/g)
			.map((s) => s.trim())
			.filter(Boolean)
		if (items.length === 0) return []
		const invalid = items.filter((e) => !isValidEmail(e))
		if (invalid.length > 0) {
			return {
				error: `Invalid BCC email(s): ${invalid.slice(0, 4).join(', ')}${
					invalid.length > 4 ? '…' : ''
				}`,
			}
		}
		return Array.from(new Set(items))
	}

	function isValidEmail(email: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	}

	// Token helpers for quick edits per type
	const tokensKey = JSON.stringify(tokens)
	const typeSpecificEditor = useMemo(() => {
		const templateOverrides =
			initialType === 'FUND' || initialType === 'MENTOR' ? (
				<div className="grid gap-2">
					<div className="grid gap-1">
						<Label>Custom subject (optional)</Label>
						<Input
							placeholder="Optional subject override"
							value={String(
								(tokens as { customSubject?: string }).customSubject ?? '',
							)}
							onChange={(e) => applyTokens({ customSubject: e.target.value })}
						/>
						<div className="text-muted-foreground text-xs">
							Overrides the default subject for this decision.
						</div>
					</div>
					<div className="grid gap-1">
						<Label>Custom message (optional)</Label>
						<Textarea
							placeholder="Optional message override. Supports placeholders like {{firstName}}, {{raceName}}, {{raceDate}}, {{raceLocation}}.\n\nLeave blank to use the default template."
							value={String(
								(tokens as { customBody?: string }).customBody ?? '',
							)}
							onChange={(e) => applyTokens({ customBody: e.target.value })}
						/>
						<div className="text-muted-foreground text-xs">
							Replaces the default template body (greeting + footer stay).
						</div>
					</div>
					<div className="flex items-center justify-end">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => applyTokens({ customSubject: '', customBody: '' })}
						>
							Clear custom text
						</Button>
					</div>
				</div>
			) : null

		switch (initialType) {
			case 'FUND':
				if (status === 'WAITLISTED') {
					return (
						<div className="grid gap-4">
							{templateOverrides}
							<div className="grid gap-1">
								<Label>
									We recommend applying for funding for this race (optional)
								</Label>
								<div className="grid gap-2 sm:grid-cols-3">
									<Input
										type="text"
										placeholder="Race name"
										value={String(
											(tokens.recommendedRace as { name?: string } | undefined)
												?.name ?? '',
										)}
										onChange={(e) =>
											applyTokens({
												recommendedRace: {
													...((tokens.recommendedRace as
														| { name?: string; url?: string; info?: string }
														| undefined) || {}),
													name: e.target.value,
												},
											})
										}
									/>
									<Input
										type="text"
										placeholder="Race listing URL"
										value={String(
											(tokens.recommendedRace as { url?: string } | undefined)
												?.url ?? '',
										)}
										onChange={(e) =>
											applyTokens({
												recommendedRace: {
													...((tokens.recommendedRace as
														| { name?: string; url?: string; info?: string }
														| undefined) || {}),
													url: e.target.value,
												},
											})
										}
									/>
									<Input
										type="text"
										placeholder="Short info (e.g., date, location)"
										value={String(
											(tokens.recommendedRace as { info?: string } | undefined)
												?.info ?? '',
										)}
										onChange={(e) =>
											applyTokens({
												recommendedRace: {
													...((tokens.recommendedRace as
														| { name?: string; url?: string; info?: string }
														| undefined) || {}),
													info: e.target.value,
												},
											})
										}
									/>
								</div>
							</div>
						</div>
					)
				}
				if (status === 'REJECTED') {
					return (
						<div className="grid gap-4">
							{templateOverrides}
							<div className="grid gap-1">
								<Label>Decision notes (optional, shown in email)</Label>
								<Textarea
									placeholder="Add additional context about the decision (optional)"
									value={String(tokens.decisionNotes ?? '')}
									onChange={(e) =>
										applyTokens({ decisionNotes: e.target.value })
									}
								/>
							</div>
						</div>
					)
				}
				return (
					<div className="grid gap-2">
						{templateOverrides}
						<div className="grid gap-1">
							<Label>Race name</Label>
							<Input
								value={String(tokens.raceName ?? '')}
								onChange={(e) => applyTokens({ raceName: e.target.value })}
							/>
						</div>
						<div className="grid gap-1">
							<Label>Race date</Label>
							<Input
								placeholder="e.g., Saturday, May 10, 2025"
								value={String(tokens.raceDate ?? '')}
								onChange={(e) => applyTokens({ raceDate: e.target.value })}
							/>
						</div>
						<div className="grid gap-1">
							<Label>Race location</Label>
							<Input
								value={String(tokens.raceLocation ?? '')}
								onChange={(e) => applyTokens({ raceLocation: e.target.value })}
							/>
						</div>
						<div className="mt-3 border-t pt-3">
							<div className="mb-2 text-sm font-medium">Registration</div>
							<div className="grid gap-1">
								<Label>How should registration be handled?</Label>
								<select
									className="rounded border px-2 py-1 text-sm"
									value={String(tokens.registrationMode ?? 'ORG_REGISTERS')}
									onChange={(e) =>
										applyTokens({ registrationMode: e.target.value })
									}
								>
									<option value="ORG_REGISTERS">
										We will register the athlete
									</option>
									<option value="SELF_REGISTER">
										Athlete will self-register
									</option>
								</select>
							</div>
							{(tokens.registrationMode || 'ORG_REGISTERS') ===
								'SELF_REGISTER' && (
								<div className="mt-2 grid gap-2 sm:grid-cols-2">
									<div className="grid gap-1">
										<Label>Registration link</Label>
										<Input
											placeholder="https://registration.example.com"
											value={String(tokens.registrationLink ?? '')}
											onChange={(e) =>
												applyTokens({ registrationLink: e.target.value })
											}
										/>
									</div>
									<div className="grid gap-1">
										<Label>Discount/access code</Label>
										<Input
											placeholder="Optional code"
											value={String(tokens.registrationCode ?? '')}
											onChange={(e) =>
												applyTokens({ registrationCode: e.target.value })
											}
										/>
									</div>
								</div>
							)}
						</div>
						<div className="mt-3 border-t pt-3">
							<div className="mb-2 text-sm font-medium">Gear support</div>

							<div className="grid gap-2 sm:grid-cols-3">
								<div className="flex items-center gap-2">
									<Checkbox
										id="gear-tshirt"
										checked={
											!!(tokens.gear as { tshirt?: boolean } | undefined)
												?.tshirt
										}
										onCheckedChange={(v) =>
											applyTokens({
												gear: { ...(tokens.gear || {}), tshirt: Boolean(v) },
											})
										}
									/>
									<Label htmlFor="gear-tshirt">Running T-Shirt</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox
										id="gear-shorts"
										checked={
											!!(tokens.gear as { shorts?: boolean } | undefined)
												?.shorts
										}
										onCheckedChange={(v) =>
											applyTokens({
												gear: { ...(tokens.gear || {}), shorts: Boolean(v) },
											})
										}
									/>
									<Label htmlFor="gear-shorts">Running Shorts</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox
										id="gear-shoes"
										checked={
											!!(tokens.gear as { shoes?: boolean } | undefined)?.shoes
										}
										onCheckedChange={(v) =>
											applyTokens({
												gear: { ...(tokens.gear || {}), shoes: Boolean(v) },
											})
										}
									/>
									<Label htmlFor="gear-shoes">Trail Shoes</Label>
								</div>
							</div>

							<div className="mt-3 flex gap-2">
								<Input
									type="text"
									placeholder="Add custom gear (e.g., Headlamp)"
									autoComplete="off"
									value={gearItemDraft}
									onChange={(e) => setGearItemDraft(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											const val = (gearItemDraft || '').trim()
											if (!val) return
											const items = Array.isArray(
												(tokens.gear as { customItems?: string[] } | undefined)
													?.customItems,
											)
												? [
														...(((tokens.gear as { customItems?: string[] })
															.customItems as string[]) || []),
													]
												: []
											items.push(val)
											applyTokens({
												gear: {
													...(tokens.gear || {}),
													customItems: items,
												},
											})
											setGearItemDraft('')
										}
									}}
								/>
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										const val = (gearItemDraft || '').trim()
										if (!val) return
										const items = Array.isArray(
											(tokens.gear as { customItems?: string[] } | undefined)
												?.customItems,
										)
											? [
													...(((tokens.gear as { customItems?: string[] })
														.customItems as string[]) || []),
												]
											: []
										items.push(val)
										applyTokens({
											gear: {
												...(tokens.gear || {}),
												customItems: items,
											},
										})
										setGearItemDraft('')
									}}
								>
									Add
								</Button>
							</div>

							{Array.isArray(
								(tokens.gear as { customItems?: string[] } | undefined)
									?.customItems,
							) &&
								(
									(tokens.gear as { customItems?: string[] })
										.customItems as string[]
								).length > 0 && (
									<ul className="mt-2 list-disc pl-5 text-sm">
										{(
											((tokens.gear as { customItems?: string[] })
												.customItems as string[]) || []
										).map((c: string, idx: number) => (
											<li
												key={`${c}-${idx}`}
												className="flex items-center justify-between gap-2"
											>
												<span>{c}</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => {
														const items = Array.isArray(
															(
																tokens.gear as
																	| { customItems?: string[] }
																	| undefined
															)?.customItems,
														)
															? ([
																	...(((
																		tokens.gear as { customItems?: string[] }
																	).customItems as string[]) || []),
																] as string[])
															: ([] as string[])
														items.splice(idx, 1)
														applyTokens({
															gear: {
																...(tokens.gear || {}),
																customItems: items,
															},
														})
													}}
												>
													Remove
												</Button>
											</li>
										))}
									</ul>
								)}

							<div className="mt-3">
								<Label className="text-muted-foreground text-xs">
									Instructions to athlete (shown under gear)
								</Label>
								<Textarea
									value={String(
										(tokens.gear as { instructions?: string } | undefined)
											?.instructions ?? '',
									)}
									onChange={(e) =>
										applyTokens({
											gear: {
												...(tokens.gear || {}),
												instructions: e.target.value,
											},
										})
									}
								/>
							</div>
						</div>
					</div>
				)
			case 'MENTOR':
				return <div className="grid gap-2">{templateOverrides}</div>
			default:
				return null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fundEmailProfileId, initialType, status, tokensKey, gearItemDraft])

	const canSend =
		toEmail.trim().length > 0 &&
		status !== 'PENDING' &&
		previewSubject.trim().length > 0 &&
		previewHtml.trim().length > 0

	if (initialType === 'FUND' && fundEmailProfiles.length === 0) {
		return null
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!readOnly) setOpen(v)
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={className}
					{...disabledProps}
				>
					<Mail className="mr-2 h-4 w-4" />
					{triggerLabel}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[95vh] w-[95vw] overflow-hidden sm:!max-w-[95vw] lg:!max-w-[1200px]">
				<DialogHeader>
					<DialogTitle>Send Email</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 overflow-hidden md:grid-cols-[520px_minmax(0,1fr)]">
					{/* Left: Controls */}
					<div className="max-h-[75vh] space-y-4 overflow-y-auto pr-2 md:max-h-[85vh]">
						{/* Envelope */}
						<div className="rounded-lg border p-3">
							<div className="grid gap-2">
								<div className="grid gap-1">
									<Label>
										To{' '}
										<span
											className="text-muted-foreground text-xs"
											aria-hidden="true"
										>
											(read-only)
										</span>
									</Label>
									<Input
										value={toEmail}
										readOnly
										aria-readonly="true"
										aria-describedby="to-help"
										title="Recipient is locked for this email"
										placeholder="recipient@example.com"
										className="cursor-default"
									/>
									<div id="to-help" className="text-muted-foreground text-xs">
										Recipient locked: {applicantName} &lt;{recipientEmail}&gt;
									</div>
								</div>
								<div className="grid gap-1">
									<Label>BCC (optional)</Label>
									<Input
										value={bccRaw}
										onChange={(e) => setBccRaw(e.target.value)}
										placeholder="teammate1@example.com, teammate2@example.com"
										disabled={readOnly}
										aria-disabled={readOnly}
									/>
									<div className="text-muted-foreground text-xs">
										Comma-, semicolon-, or newline-separated.
									</div>
								</div>
							</div>
						</div>

						{/* STANDARD fields */}
						<div className="rounded-lg border p-3">
							<div className="grid gap-3">
								<div className="grid gap-1">
									<Label>{initialType === 'FUND' ? 'Email Type' : 'Decision'}</Label>
									{initialType === 'FUND' ? (
										<select
											className="rounded border px-2 py-1 text-sm"
											value={fundEmailProfileId ?? ''}
											onChange={(e) =>
												setFundEmailProfileId(
													e.target.value as FundEmailProfileId,
												)
											}
										>
											{fundEmailProfiles.map((profile) => (
												<option key={profile.id} value={profile.id}>
													{profile.label}
												</option>
											))}
										</select>
									) : (
										<select
											className="rounded border px-2 py-1 text-sm"
											value={status}
											onChange={(e) => setStatus(e.target.value as AppStatus)}
										>
											<option value="APPROVED">Approved</option>
											<option value="WAITLISTED">Waitlisted</option>
											<option value="REJECTED">Rejected</option>
											<option value="PENDING">Pending (cannot send)</option>
										</select>
									)}
									<div className="text-muted-foreground text-xs">
										{initialType === 'FUND'
											? fundEmailProfiles.find(
													(profile) => profile.id === fundEmailProfileId,
												)?.description ||
												'Choose the workflow email that matches this athlete’s current stage.'
											: 'Pick the outcome you want to communicate. PENDING cannot be sent.'}
									</div>
								</div>
							</div>
						</div>

						{/* Tokens */}
						<div className="rounded-lg border p-3">
							<div className="mb-2 flex items-center justify-between">
								<div>
									<div className="font-medium">Personalization</div>
									<div className="text-muted-foreground text-xs">
										These details personalize the template (e.g., name, race
										details, registration info).
									</div>
								</div>
								<Button
									variant="secondary"
									size="sm"
									type="button"
									onClick={resetTokens}
								>
									Reset fields
								</Button>
							</div>
							<Tabs
								value={activeTab}
								onValueChange={(v) => setActiveTab(v as 'preview' | 'editor')}
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="preview">Quick edit</TabsTrigger>
									<TabsTrigger value="editor">Advanced (JSON)</TabsTrigger>
								</TabsList>
								<TabsContent value="preview" className="mt-3">
									<div className="grid gap-2">
										<div className="grid gap-1">
											<Label>First name</Label>
											<Input
												value={String(tokens.firstName ?? '')}
												onChange={(e) =>
													setTokens((t) => ({
														...t,
														firstName: e.target.value,
													}))
												}
											/>
										</div>
										{typeSpecificEditor}
									</div>
								</TabsContent>
								<TabsContent value="editor" className="mt-3">
									<JsonEditor
										value={tokens}
										onChange={(obj) => applyTokens(obj)}
										height={220}
									/>
								</TabsContent>
							</Tabs>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-between">
							<Button
								type="button"
								variant="secondary"
								disabled={status === 'PENDING'}
								onClick={() => {
									void buildStandardPreview()
								}}
							>
								Build Preview
							</Button>
							<Button
								onClick={handleSend}
								disabled={!canSend}
								className="bg-primary text-primary-foreground hover:bg-primary/90"
							>
								<Send className="mr-2 h-4 w-4" />
								Send Email
							</Button>
						</div>
					</div>

					{/* Right: Preview */}
					<div className="space-y-3">
						<div className="rounded-lg border p-3">
							<div className="grid gap-1">
								<div className="text-sm">
									<strong>To:</strong> {applicantName} &lt;{toEmail}&gt;
								</div>
								<div className="text-sm">
									<strong>Subject:</strong> {previewSubject}
								</div>
								<div className="text-muted-foreground text-xs">
									Program: {initialType} • Decision: {status}
								</div>
							</div>
						</div>

						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							<Eye className="h-4 w-4" />
							Preview
							{previewLoading && (
								<span className="inline-flex items-center gap-1 text-xs">
									<Loader2 className="h-3 w-3 animate-spin" />
									building…
								</span>
							)}
						</div>

						<ScrollArea className="bg-card h-[80vh] rounded-lg border md:h-[90vh] lg:h-[92vh]">
							<iframe
								ref={previewRef}
								className="w-full"
								title="Email Preview"
								srcDoc={previewHtml}
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

/* ===========================
   Helpers + Subcomponents
   =========================== */

function deriveFirstName(name?: string) {
	if (!name) return ''
	const [first] = name.trim().split(/\s+/)
	return first || ''
}

function normalizeFundStage(stage?: string): FundWorkflowStage {
	const upper = (stage || 'SUBMITTED').toUpperCase() as FundWorkflowStage
	return upper
}

function buildBaseTokens(
	applicantName: string,
	defaultTokens?: Record<string, unknown>,
) {
	return {
		applicantName,
		firstName: deriveFirstName(applicantName),
		...(defaultTokens || {}),
	}
}

function applyEmailProfileDefaults(
	baseTokens: Record<string, unknown>,
	profile: FundEmailProfile,
) {
	return {
		...baseTokens,
		customSubject: '',
		customBody: '',
		...(profile.tokenDefaults || {}),
	}
}

function getFundEmailProfiles(
	stage: string | undefined,
	recordStatus: string | null | undefined,
): FundEmailProfile[] {
	const normalizedStage = normalizeFundStage(stage)
	const adminStatus = getFundAdminStatus(normalizedStage, {
		status: recordStatus,
	})

	if (normalizedStage === 'SUBMITTED' || normalizedStage === 'IN_REVIEW') {
		return []
	}

	if (normalizedStage === 'WAITLISTED') {
		return [
			{
				id: 'WAITLIST_UPDATE',
				label: 'Hold / Reapply Update',
				description:
					'Explains that this specific race is not moving forward and encourages a new application for another race.',
				status: 'WAITLISTED',
			},
		]
	}

	if (normalizedStage === 'AWAITING_CONFIRMATION') {
		return [
			{
				id: 'CONFIRMATION_REQUEST',
				label: 'Confirmation Request',
				description:
					'Uses the standard approval email that asks for DOB and UltraSignup account email.',
				status: 'APPROVED',
			},
		]
	}

	if (
		normalizedStage === 'CONFIRMED' ||
		normalizedStage === 'REGISTRATION_IN_PROGRESS'
	) {
		return [
			{
				id: 'REGISTRATION_IN_PROGRESS',
				label: 'Registration In Progress',
				description:
					'Confirms the athlete replied and lets them know race registration is being handled now.',
				status: 'APPROVED',
				tokenDefaults: {
					customSubject: 'Next steps for {{raceName}}',
					customBody: `We received your confirmation for {{raceName}}.\n\nRace date: {{raceDate}}\n\nWe are now handling race registration on our side.\n\nWe will follow up again once registration is complete and your Slack and mentorship handoff are ready.\n\nIf anything changes and you can no longer attend, please reply as soon as possible so we can update the registration cleanly.`,
				},
			},
		]
	}

	if (
		normalizedStage === 'REGISTERED' ||
		normalizedStage === 'ONBOARDING_IN_PROGRESS' ||
		normalizedStage === 'ACTIVE_IN_PROGRAM'
	) {
		return [
			{
				id: 'REGISTRATION_COMPLETE',
				label: 'Registered + Community Handoff',
				description:
					'Confirms registration is complete and covers Slack plus mentorship handoff.',
				status: 'APPROVED',
				tokenDefaults: {
					customSubject: "You're registered for {{raceName}}",
					customBody: `You are officially registered for {{raceName}}.\n\nRace date: {{raceDate}}\n\nWe are sending your Slack invite, and if you requested mentorship, we are handing you off for mentor pairing now.\n\nIf your plans change and you can no longer attend, please reply right away so we can update both registration and mentorship support.`,
				},
			},
		]
	}

	if (normalizedStage === 'NO_SHOW_OR_DROPPED') {
		return [
			{
				id: 'WITHDRAWAL_CLOSEOUT',
				label: 'Closeout After Withdrawal',
				description:
					'Closes the cycle when the athlete did not start or had to back out.',
				status: 'APPROVED',
				tokenDefaults: {
					customSubject: 'Closing out your {{raceName}} race cycle',
					customBody: `We have closed out your {{raceName}} race cycle in our system.\n\nWe understand that plans change. Thank you for letting us know, and please keep an eye on future races if you want to apply again when the timing is better.`,
				},
			},
		]
	}

	if (adminStatus === 'ARCHIVED') {
		return [
			{
				id: 'POST_RACE_CLOSEOUT',
				label: 'Post-Race Closeout',
				description:
					'Closes the race cycle after the athlete completed their supported race.',
				status: 'APPROVED',
				tokenDefaults: {
					customSubject: 'Thank you for being part of the community',
					customBody: `Thank you for being part of our community for {{raceName}}.\n\nWe have closed this race cycle in our system. We are grateful you ran with support from the Athlete Fund, and we would love to stay connected for future races and community opportunities.`,
				},
			},
		]
	}

	if (adminStatus === 'REJECTED') {
		return [
			{
				id: 'REJECTION',
				label: 'Not Moving Forward',
				description:
					'Lets the athlete know this application is not moving forward.',
				status: 'REJECTED',
			},
		]
	}

	return []
}

function JsonEditor({
	value,
	onChange,
	height = 200,
}: {
	value: Record<string, unknown>
	onChange: (obj: Record<string, unknown>) => void
	height?: number
}) {
	const [text, setText] = useState<string>(() => safeStringify(value))
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		setText(safeStringify(value))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(value)])

	return (
		<div className="grid gap-1">
			<Textarea
				value={text}
				onChange={(e) => {
					const v = e.target.value
					setText(v)
					try {
						const parsed = JSON.parse(v || '{}')
						if (typeof parsed === 'object' && parsed !== null) {
							setError(null)
							onChange(parsed as Record<string, unknown>)
						} else {
							setError('Root must be an object')
						}
					} catch {
						setError('Invalid JSON')
					}
				}}
				style={{ minHeight: height }}
				className={error ? 'border-destructive' : ''}
				placeholder='{"firstName":"Ava","raceName":"Rogue Gorge 50K"}'
			/>
			{error ? (
				<div className="text-destructive text-xs">{error}</div>
			) : (
				<div className="text-muted-foreground text-xs">
					Advanced: edit full token JSON. Invalid JSON will not apply.
				</div>
			)}
		</div>
	)
}

function safeStringify(v: unknown) {
	try {
		return JSON.stringify(v ?? {}, null, 2)
	} catch {
		return '{}'
	}
}
