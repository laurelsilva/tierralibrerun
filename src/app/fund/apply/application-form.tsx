'use client'

import {
	ChevronRight,
	ChevronLeft,
	Check,
	Users,
	ArrowRight,
	Mountain,
	Save,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { submitApplication } from './actions'
import RaceSelector from '@/components/race-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

import { type RaceOptionForApplication } from '@/lib/sanity/types'

/* =======================================================
   Types & Constants
   ======================================================= */

interface ApplicationFormProps {
	userData: {
		name: string
		email: string
		userId: string
	}
	applicationStatus: {
		applications: Array<{
			id: string
			race: string
			status: string
			workflowStage?: string
			createdAt: Date
		}>
		applicationCount: number
		remainingApplications: number
		appliedRaces: string[]
	}
	raceOptions: RaceOptionForApplication[]
}

interface ApplicationFormData {
	race: string
	firstRace: string
	reason: string
	experience: string
	goals: string
	communityContribution: string
	tierraLibreContribution: string
	wantsMentor: string
	mentorGenderPreference: string
	needsAssistance: string
}

const TOTAL_STEPS = 6
const DRAFT_KEY = 'app-fund-application-draft-v3'

const CHAR_MIN_STANDARD = 300
const CHAR_MIN_RACE = 300
const CHAR_MIN_COMMUNITY = 350
const CHAR_MIN_MENTOR_DETAIL = 150

const CHAR_MAX_LONG = 2000
const CHAR_MAX_MEDIUM = 1500
const CHAR_MAX_SHORT = 800

const STEP_LABELS = [
	'Your Race',
	'About You',
	'Why This Race',
	'The Ripple',
	'Mentorship',
	'Review',
] as const

const STEP_SUBTITLES = [
	'Which race would you like us to support?',
	'Help us understand who you are',
	'What makes this race matter to you right now?',
	'How will this experience move beyond you?',
	'Would you like to be paired with a mentor?',
	'Take a moment to review before submitting',
] as const

/* =======================================================
   Component
   ======================================================= */

export default function ApplicationForm({
	userData,
	applicationStatus,
	raceOptions,
}: ApplicationFormProps) {
	const [started, setStarted] = useState(false)
	const [currentStep, setCurrentStep] = useState(1)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<ApplicationFormData>({
		race: '',
		firstRace: '',
		reason: '',
		experience: '',
		goals: '',
		communityContribution: '',
		tierraLibreContribution: '',
		wantsMentor: '',
		mentorGenderPreference: '',
		needsAssistance: '',
	})
	const router = useRouter()
	const searchParams = useSearchParams()
	const mainRef = useRef<HTMLDivElement>(null)

	const scrollToTop = useCallback(() => {
		mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}, [])

	// Pre-fill race from URL parameter
	useEffect(() => {
		const raceParam = searchParams.get('race')
		if (raceParam && !formData.race && raceOptions.length > 0) {
			const decoded = decodeURIComponent(raceParam)
			const match =
				raceOptions.find(
					(o) => `${o.raceSeries.name} - ${o.distance}` === decoded,
				) ??
				raceOptions.find(
					(o) =>
						o.raceSeries.name.toLowerCase().includes(decoded.toLowerCase()) ||
						o.distance.toLowerCase().includes(decoded.toLowerCase()),
				)
			if (match) {
				setFormData((prev) => ({
					...prev,
					race: `${match.raceSeries.name} - ${match.distance}`,
				}))
			}
		}
	}, [searchParams, formData.race, raceOptions])

	// Auto-save draft
	useEffect(() => {
		const timer = setTimeout(() => {
			try {
				sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
			} catch {
				/* ignore */
			}
		}, 1000)
		return () => clearTimeout(timer)
	}, [formData])

	// Restore draft on mount
	useEffect(() => {
		const saved = sessionStorage.getItem(DRAFT_KEY)
		if (saved) {
			try {
				const parsed = JSON.parse(saved)
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					setFormData((prev) => ({ ...prev, ...parsed }))
				}
			} catch {
				/* ignore */
			}
		}
	}, [])

	const updateField = (field: keyof ApplicationFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	/* =======================================================
	   Validation
	   ======================================================= */

	const isStepComplete = (step: number): boolean => {
		switch (step) {
			case 1:
				return !!(formData.race && formData.firstRace)
			case 2:
				return !!(
					formData.reason.length >= CHAR_MIN_STANDARD &&
					formData.experience.length >= CHAR_MIN_STANDARD
				)
			case 3:
				return formData.goals.length >= CHAR_MIN_RACE
			case 4:
				return formData.communityContribution.length >= CHAR_MIN_COMMUNITY
			case 5: {
				if (!formData.wantsMentor) return false
				if (
					formData.wantsMentor === 'yes' &&
					formData.tierraLibreContribution.length < CHAR_MIN_MENTOR_DETAIL
				) {
					return false
				}
				return true
			}
			default:
				return true
		}
	}

	const nextStep = () => {
		if (currentStep < TOTAL_STEPS && isStepComplete(currentStep)) {
			setCurrentStep((prev) => prev + 1)
			scrollToTop()
		}
	}

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1)
			scrollToTop()
		}
	}

	const goToStep = (step: number) => {
		if (step >= 1 && step <= TOTAL_STEPS) {
			setCurrentStep(step)
			scrollToTop()
		}
	}

	const handleSubmit = async () => {
		setIsSubmitting(true)
		try {
			const fd = new FormData()
			Object.entries(formData).forEach(([k, v]) => fd.set(k, v))
			const result = await submitApplication(fd)
			if (result.success) {
				try {
					sessionStorage.removeItem(DRAFT_KEY)
				} catch {
					/* ignore */
				}
				toast.success('Application submitted successfully!')
				router.push('/fund/apply/success')
			} else {
				toast.error(result.error || 'Failed to submit application')
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.')
			console.error('Application submission error:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	/* =======================================================
	   Shared UI Primitives
	   ======================================================= */

	const CharacterCount = ({
		text,
		min,
		max,
		optional = false,
	}: {
		text: string
		min?: number
		max: number
		optional?: boolean
	}) => {
		const len = text.length
		const nearLimit = len > max * 0.85

		if (len > max) {
			return (
				<p className="text-destructive mt-2 text-xs font-medium">
					Over limit &mdash; {len}/{max} characters
				</p>
			)
		}
		if (min && len > 0 && len < min) {
			return (
				<p className="text-muted-foreground mt-2 text-xs">
					{len}/{max} characters{' '}
					<span className="text-destructive">
						({min - len} more needed)
					</span>
				</p>
			)
		}
		if (nearLimit) {
			return (
				<p className="mt-2 text-xs text-amber-600">
					{len}/{max} characters &mdash; approaching limit
				</p>
			)
		}
		if (optional && len === 0) {
			return (
				<p className="text-muted-foreground mt-2 text-xs">
					Optional &middot; {max} characters max
				</p>
			)
		}
		if (min && len >= min) {
			return (
				<p className="mt-2 text-xs text-green-600">
					{len}/{max} characters
				</p>
			)
		}
		return (
			<p className="text-muted-foreground mt-2 text-xs">
				{len > 0 ? `${len}/` : ''}
				{max} characters{min ? ` \u00b7 ${min} minimum` : ''}
			</p>
		)
	}

	const ContextCard = ({
		children,
		variant = 'default',
	}: {
		children: React.ReactNode
		variant?: 'default' | 'highlight'
	}) => (
		<div
			className={`rounded-r-lg border-l-4 py-4 pr-5 pl-5 text-[15px] leading-relaxed ${
				variant === 'highlight'
					? 'border-primary bg-accent/40'
					: 'border-border bg-muted/30'
			}`}
		>
			{children}
		</div>
	)

	const QuestionLabel = ({
		htmlFor,
		children,
	}: {
		htmlFor: string
		children: React.ReactNode
	}) => (
		<label
			htmlFor={htmlFor}
			className="text-foreground block text-lg leading-snug font-medium"
		>
			{children}
		</label>
	)

	/* =======================================================
	   Sidebar (desktop)
	   ======================================================= */

	const Sidebar = () => (
		<aside className="hidden lg:block lg:w-72 xl:w-80">
			<div className="sticky top-8 space-y-8">
				{/* Branding */}
				<div className="flex items-center gap-3">
					<div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
						<Mountain className="h-5 w-5" />
					</div>
					<div>
						<p className="text-sm font-semibold">BIPOC Athlete Fund</p>
						<p className="text-muted-foreground text-xs">Trail Running Community</p>
					</div>
				</div>

				<Separator />

				{/* Step navigation */}
				<nav aria-label="Application steps">
					<ol className="space-y-1">
						{STEP_LABELS.map((label, i) => {
							const stepNum = i + 1
							const isComplete = stepNum < currentStep || (stepNum < currentStep && isStepComplete(stepNum))
							const isCurrent = stepNum === currentStep
							const isFuture = stepNum > currentStep

							return (
								<li key={label}>
									<button
										type="button"
										onClick={() => {
											if (stepNum <= currentStep) goToStep(stepNum)
										}}
										disabled={isFuture}
										className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
											isCurrent
												? 'bg-primary/10 text-foreground font-medium'
												: isComplete
													? 'text-muted-foreground hover:bg-muted/50 cursor-pointer'
													: 'text-muted-foreground/50 cursor-default'
										}`}
									>
										<span
											className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
												isComplete
													? 'bg-primary text-primary-foreground'
													: isCurrent
														? 'border-primary text-primary border-2'
														: 'border-border border'
											}`}
										>
											{isComplete ? (
												<Check className="h-3 w-3" />
											) : (
												stepNum
											)}
										</span>
										<span>{label}</span>
									</button>
								</li>
							)
						})}
					</ol>
				</nav>

				{/* Race badge */}
				{formData.race && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
							Selected Race
						</p>
						<Badge variant="secondary" className="text-xs">
							{formData.race}
						</Badge>
					</div>
				)}

				<Separator />

				{/* Save indicator */}
				<div className="text-muted-foreground flex items-center gap-2 text-xs">
					<Save className="h-3.5 w-3.5" />
					<span>Progress saved automatically</span>
				</div>
			</div>
		</aside>
	)

	/* =======================================================
	   Mobile Step Bar
	   ======================================================= */

	const MobileStepBar = () => (
		<div className="mb-8 lg:hidden">
			<div className="mb-3 flex items-baseline justify-between">
				<p className="text-foreground text-sm font-medium">
					Step {currentStep} of {TOTAL_STEPS}
					<span className="text-muted-foreground ml-2 font-normal">
						&mdash; {STEP_LABELS[currentStep - 1]}
					</span>
				</p>
				{formData.race && (
					<span className="text-muted-foreground flex items-center gap-1.5 text-xs">
						<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
						Race set
					</span>
				)}
			</div>
			<div className="flex gap-1.5">
				{Array.from({ length: TOTAL_STEPS }, (_, i) => (
					<div
						key={i}
						className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
							i + 1 < currentStep
								? 'bg-primary'
								: i + 1 === currentStep
									? 'bg-primary/50'
									: 'bg-border'
						}`}
					/>
				))}
			</div>
		</div>
	)

	/* =======================================================
	   Welcome Screen
	   ======================================================= */

	if (!started) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-8" role="main">
				<div className="space-y-10">
					{/* Hero */}
					<div className="space-y-4 text-center">
						<div className="bg-primary/10 text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full">
							<Mountain className="h-7 w-7" />
						</div>
						<h1 className="text-4xl leading-tight font-bold tracking-tight">
							BIPOC Athlete Fund
						</h1>
						<p className="text-muted-foreground text-lg">
							6 steps &middot; About 15 minutes
						</p>
					</div>

					{/* Body */}
					<div className="space-y-6 text-[15px] leading-relaxed">
						<p>
						Trail Running Community is a volunteer-run nonprofit led by people of
						color. Every person in this organization &mdash; from program
							leads to mentors &mdash; gives their time because they believe
							trail running should belong to everyone.
						</p>
						<p>
							When we invest in an athlete, we&apos;re investing in a
							relationship. We cover your race entry, connect you with
							mentorship, and bring you into community. In return, we ask you
							to show up &mdash; not just on race day, but for the people and
							the work that make this possible.
						</p>
					</div>

					<Separator />

					{/* What to expect */}
					<div className="space-y-4">
						<h2 className="text-sm font-semibold uppercase tracking-wide">
							What to expect
						</h2>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{[
								{ label: 'Choose your race', step: 'Step 1' },
								{ label: 'Tell us about yourself', step: 'Step 2' },
								{ label: 'Why this race matters', step: 'Step 3' },
								{ label: "How you'll give back", step: 'Step 4' },
								{ label: 'Mentorship', step: 'Step 5' },
								{ label: 'Review and submit', step: 'Step 6' },
							].map((item) => (
								<div
									key={item.step}
									className="flex items-center gap-3 rounded-lg border px-4 py-3"
								>
									<span className="text-muted-foreground text-xs font-medium">
										{item.step}
									</span>
									<span className="text-sm">{item.label}</span>
								</div>
							))}
						</div>
					</div>

					<ContextCard variant="highlight">
						<p className="font-medium">
							Most questions require a few thoughtful sentences &mdash; not a
							single line. Set aside about 15 uninterrupted minutes. Your
							progress is saved automatically.
						</p>
					</ContextCard>

					{/* CTA */}
					<div className="flex items-center justify-between pt-2">
						<div className="text-muted-foreground text-sm">
							{applicationStatus.remainingApplications} application
							{applicationStatus.remainingApplications !== 1 ? 's' : ''}{' '}
							available
						</div>
						<Button
							onClick={() => setStarted(true)}
							size="lg"
							className="gap-2 px-8"
						>
							Begin Application
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		)
	}

	/* =======================================================
	   Step Content
	   ======================================================= */

	const renderStep = () => {
		switch (currentStep) {
			/* -----------------------------------------------
			   Step 1: Your Race
			   ----------------------------------------------- */
			case 1:
				return (
					<div className="space-y-8">
						<div className="space-y-2">
							<QuestionLabel htmlFor="race-selection">
								Select the race you&apos;d like support for
							</QuestionLabel>
							<div
								id="race-selection"
								role="group"
								aria-labelledby="race-selection"
							>
								<RaceSelector
									raceOptions={raceOptions}
									appliedRaces={applicationStatus.appliedRaces}
									selectedRace={formData.race}
									onRaceSelectAction={(race) =>
										updateField('race', race)
									}
								/>
							</div>
							{searchParams.get('race') && formData.race && (
								<div
									className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
									role="status"
									aria-live="polite"
								>
									<div className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>
											<strong>Race preselected:</strong>{' '}
											{formData.race}
										</span>
									</div>
									<p className="mt-1 text-xs text-green-600">
										You can change this selection if needed.
									</p>
								</div>
							)}
						</div>

						<Separator />

						<fieldset className="space-y-3">
							<legend className="text-lg font-medium">
								Is this your first trail race?
							</legend>
							<div className="grid grid-cols-2 gap-3">
								{[
									{
										value: 'yes',
										label: 'Yes, my first!',
										desc: "I haven't done a trail race before",
									},
									{
										value: 'no',
										label: "No, I've raced before",
										desc: 'I have trail race experience',
									},
								].map((option) => (
									<label
										key={option.value}
										className={`flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-colors ${
											formData.firstRace === option.value
												? 'border-primary bg-accent/30'
												: 'border-border hover:border-primary/40'
										}`}
									>
										<input
											type="radio"
											name="firstRace"
											value={option.value}
											checked={formData.firstRace === option.value}
											onChange={(e) =>
												updateField('firstRace', e.target.value)
											}
											className="sr-only"
										/>
										<span className="font-medium">{option.label}</span>
										<span className="text-muted-foreground mt-0.5 text-xs">
											{option.desc}
										</span>
									</label>
								))}
							</div>
						</fieldset>
					</div>
				)

			/* -----------------------------------------------
			   Step 2: About You
			   ----------------------------------------------- */
			case 2:
				return (
					<div className="space-y-10">
						<ContextCard>
							<p>
								We want to know who you are &mdash; not just as an athlete, but
								as a person. There&apos;s no formula here. Just be real with us.
							</p>
						</ContextCard>

						<div className="space-y-3">
							<QuestionLabel htmlFor="reason">
								Tell us about yourself. Who are you beyond an athlete? What
								communities do you belong to, and what role does the outdoors
								play in your life?
							</QuestionLabel>
							<Textarea
								id="reason"
								value={formData.reason}
								onChange={(e) => updateField('reason', e.target.value)}
								rows={9}
								required
								maxLength={CHAR_MAX_LONG}
								className="text-[15px] leading-relaxed"
								aria-describedby="reason-count"
							/>
							<div id="reason-count">
								<CharacterCount
									text={formData.reason}
									min={CHAR_MIN_STANDARD}
									max={CHAR_MAX_LONG}
								/>
							</div>
						</div>

						<Separator />

						<div className="space-y-3">
							<QuestionLabel htmlFor="experience">
								What has your relationship with trail running looked like?
								What&apos;s made it easy or hard to access the sport?
							</QuestionLabel>
							<Textarea
								id="experience"
								value={formData.experience}
								onChange={(e) => updateField('experience', e.target.value)}
								rows={9}
								required
								maxLength={CHAR_MAX_LONG}
								className="text-[15px] leading-relaxed"
								aria-describedby="experience-count"
							/>
							<div id="experience-count">
								<CharacterCount
									text={formData.experience}
									min={CHAR_MIN_STANDARD}
									max={CHAR_MAX_LONG}
								/>
							</div>
						</div>
					</div>
				)

			/* -----------------------------------------------
			   Step 3: Why This Race
			   ----------------------------------------------- */
			case 3:
				return (
					<div className="space-y-10">
						<ContextCard>
							<p>
								We partner with specific races because they share our values.
								We want to understand your connection to this one &mdash; not
								just that you need funding, but why this race, at this moment
								in your life.
							</p>
						</ContextCard>

						<div className="space-y-3">
							<QuestionLabel htmlFor="goals">
								Why this race, and why now? What would it mean for you to cross
								that finish line?
							</QuestionLabel>
							<Textarea
								id="goals"
								value={formData.goals}
								onChange={(e) => updateField('goals', e.target.value)}
								rows={10}
								required
								maxLength={CHAR_MAX_MEDIUM}
								className="text-[15px] leading-relaxed"
								aria-describedby="goals-count"
							/>
							<div id="goals-count">
								<CharacterCount
									text={formData.goals}
									min={CHAR_MIN_RACE}
									max={CHAR_MAX_MEDIUM}
								/>
							</div>
						</div>
					</div>
				)

			/* -----------------------------------------------
			   Step 4: The Ripple
			   ----------------------------------------------- */
			case 4:
				return (
					<div className="space-y-10">
						<ContextCard variant="highlight">
							<p>
								Trail Running Community is built on mutual investment. Everyone in this
								community &mdash; athletes, mentors, volunteers &mdash;
								contributes their time, energy, and care. When we cover your
								race entry, we&apos;re betting that the experience won&apos;t
								end at the finish line.
							</p>
							<p className="mt-3 font-medium">
								We prioritize athletes who see this as the beginning of
								something, not just a one-time event.
							</p>
						</ContextCard>

						<div className="space-y-3">
							<QuestionLabel htmlFor="communityContribution">
								How do you see this experience creating a ripple &mdash; in
								your life, your community, and in trail running?
							</QuestionLabel>
							<Textarea
								id="communityContribution"
								value={formData.communityContribution}
								onChange={(e) =>
									updateField('communityContribution', e.target.value)
								}
								rows={10}
								required
								maxLength={CHAR_MAX_LONG}
								className="text-[15px] leading-relaxed"
								aria-describedby="community-count"
							/>
							<div id="community-count">
								<CharacterCount
									text={formData.communityContribution}
									min={CHAR_MIN_COMMUNITY}
									max={CHAR_MAX_LONG}
								/>
							</div>
						</div>
					</div>
				)

			/* -----------------------------------------------
			   Step 5: Mentorship
			   ----------------------------------------------- */
			case 5:
				return (
					<div className="space-y-10">
						{/* Education card */}
						<div className="rounded-xl border border-blue-100 bg-blue-50/40 p-6">
							<div className="mb-4 flex items-center gap-3">
								<div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
									<Users className="h-5 w-5" />
								</div>
								<h3 className="text-lg font-semibold">
									Mentorship at Trail Running Community
								</h3>
							</div>
							<div className="space-y-3 text-[15px] leading-relaxed">
								<p>
									Our mentorship program pairs you with an experienced
									athlete for regular check-ins leading up to race day.
									This isn&apos;t coaching &mdash; it&apos;s a steady
									relationship with someone who&apos;s been where you are.
								</p>
								<p>
									The real magic of Trail Running Community happens in these
									conversations: the training questions, the race-week nerves,
									the encouragement from someone who gets it. Mentors and
									athletes typically connect every two weeks for about 30
									minutes. You&apos;ll decide the cadence and style together.
								</p>
								<p className="font-medium">
									Mentorship isn&apos;t required, but we prioritize athletes
									who want this connection. Some of our strongest community
									members started as mentees.
								</p>
							</div>
						</div>

						{/* Choice */}
						<fieldset className="space-y-4">
							<legend className="text-lg font-medium">
								Would you like to be paired with a mentor?
							</legend>
							<div className="space-y-3">
								{[
									{
										value: 'yes',
										label: "Yes, I'd love a mentor",
										desc: 'Connect me with someone who can share advice, encouragement, and help me feel ready',
									},
									{
										value: 'no',
										label: "No thanks, I'm good for now",
										desc: 'I prefer to prepare on my own or already have support in place',
									},
								].map((option) => (
									<label
										key={option.value}
										className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-5 transition-colors ${
											formData.wantsMentor === option.value
												? 'border-primary bg-accent/30'
												: 'border-border hover:border-primary/40'
										}`}
									>
										<input
											type="radio"
											name="wantsMentor"
											value={option.value}
											checked={formData.wantsMentor === option.value}
											onChange={(e) => {
												updateField('wantsMentor', e.target.value)
												if (e.target.value === 'yes') {
													if (!formData.mentorGenderPreference) {
														updateField(
															'mentorGenderPreference',
															'no-preference',
														)
													}
												} else {
													updateField('mentorGenderPreference', '')
													updateField('tierraLibreContribution', '')
												}
											}}
											className="sr-only"
										/>
										<div
											className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
												formData.wantsMentor === option.value
													? 'border-primary bg-primary'
													: 'border-muted-foreground/40'
											}`}
										>
											{formData.wantsMentor === option.value && (
												<Check className="h-3 w-3 text-white" />
											)}
										</div>
										<div>
											<div className="font-medium">{option.label}</div>
											<div className="text-muted-foreground mt-0.5 text-sm">
												{option.desc}
											</div>
										</div>
									</label>
								))}
							</div>
						</fieldset>

						{/* Mentor details (if yes) */}
						{formData.wantsMentor === 'yes' && (
							<div className="space-y-8">
								<Separator />

								<div className="space-y-3">
									<QuestionLabel htmlFor="tierraLibreContribution">
										What would you most want from a mentor relationship? What
										kind of support would help you feel ready?
									</QuestionLabel>
									<Textarea
										id="tierraLibreContribution"
										value={formData.tierraLibreContribution}
										onChange={(e) =>
											updateField(
												'tierraLibreContribution',
												e.target.value,
											)
										}
										rows={6}
										required
										maxLength={CHAR_MAX_MEDIUM}
										className="text-[15px] leading-relaxed"
										aria-describedby="mentor-count"
									/>
									<div id="mentor-count">
										<CharacterCount
											text={formData.tierraLibreContribution}
											min={CHAR_MIN_MENTOR_DETAIL}
											max={CHAR_MAX_MEDIUM}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="mentorGenderPreference"
										className="text-sm font-medium"
									>
										Mentor preference (optional)
									</label>
									<Select
										value={formData.mentorGenderPreference}
										onValueChange={(v) =>
											updateField('mentorGenderPreference', v)
										}
									>
										<SelectTrigger id="mentorGenderPreference">
											<SelectValue placeholder="Select your preference" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="no-preference">
												No preference &mdash; open to any mentor
											</SelectItem>
											<SelectItem value="same-gender">
												Prefer a mentor who shares my gender identity
											</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-muted-foreground text-xs">
										We use this only to make thoughtful matches so everyone
										feels comfortable.
									</p>
								</div>
							</div>
						)}

						{/* Other support */}
						<div className="space-y-3 border-t pt-8">
							<label
								htmlFor="needsAssistance"
								className="text-lg font-medium"
							>
								Is there anything else we can help with beyond race entry?
							</label>
							<p className="text-muted-foreground text-sm">
								Transportation, training guidance, or anything else &mdash;
								totally optional.
							</p>
							<Textarea
								id="needsAssistance"
								value={formData.needsAssistance}
								onChange={(e) =>
									updateField('needsAssistance', e.target.value)
								}
								rows={3}
								maxLength={CHAR_MAX_SHORT}
								className="text-[15px] leading-relaxed"
							/>
							<CharacterCount
								text={formData.needsAssistance}
								max={CHAR_MAX_SHORT}
								optional
							/>
						</div>
					</div>
				)

			/* -----------------------------------------------
			   Step 6: Review & Submit
			   ----------------------------------------------- */
			case 6: {
				const sections = [
					{ title: 'About You', content: formData.reason, step: 2 },
					{
						title: 'Access to Trail Running',
						content: formData.experience,
						step: 2,
					},
					{ title: 'Why This Race', content: formData.goals, step: 3 },
					{
						title: 'The Ripple',
						content: formData.communityContribution,
						step: 4,
					},
				]

				return (
					<div className="space-y-6">
						{/* Quick facts */}
						<div className="grid grid-cols-2 gap-4 rounded-lg border p-5">
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Name
								</p>
								<p className="mt-1 text-sm font-medium">{userData.name}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Email
								</p>
								<p className="mt-1 text-sm font-medium">{userData.email}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Race
								</p>
								<p className="mt-1 text-sm font-medium">{formData.race}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									First trail race
								</p>
								<p className="mt-1 text-sm font-medium">
									{formData.firstRace === 'yes' ? 'Yes' : 'No'}
								</p>
							</div>
						</div>

						{/* Narrative sections */}
						{sections.map((section) => (
							<div key={section.title} className="group rounded-lg border p-5">
								<div className="mb-2 flex items-center justify-between">
									<h4 className="text-sm font-semibold">{section.title}</h4>
									<button
										type="button"
										onClick={() => goToStep(section.step)}
										className="text-primary text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
									>
										Edit
									</button>
								</div>
								<p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
									{section.content}
								</p>
							</div>
						))}

						{/* Mentorship */}
						<div className="rounded-lg border p-5">
							<div className="mb-2 flex items-center justify-between">
								<h4 className="text-sm font-semibold">Mentorship</h4>
								<button
									type="button"
									onClick={() => goToStep(5)}
									className="text-primary text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
								>
									Edit
								</button>
							</div>
							<div className="space-y-2 text-sm">
								<div className="flex items-center gap-2">
									<Badge
										variant={
											formData.wantsMentor === 'yes'
												? 'default'
												: 'secondary'
										}
									>
										{formData.wantsMentor === 'yes'
											? 'Wants mentor'
											: 'No mentor'}
									</Badge>
									{formData.wantsMentor === 'yes' &&
										formData.mentorGenderPreference && (
											<Badge variant="outline">
												{formData.mentorGenderPreference === 'same-gender'
													? 'Same gender preferred'
													: 'No preference'}
											</Badge>
										)}
								</div>
								{formData.wantsMentor === 'yes' &&
									formData.tierraLibreContribution && (
										<p className="text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">
											{formData.tierraLibreContribution}
										</p>
									)}
							</div>
						</div>

						{formData.needsAssistance && (
							<div className="rounded-lg border p-5">
								<h4 className="mb-2 text-sm font-semibold">Other Support</h4>
								<p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
									{formData.needsAssistance}
								</p>
							</div>
						)}

						<p className="text-muted-foreground pt-2 text-center text-sm">
							By submitting, you confirm this information is accurate. You can
							submit 1 application every 6 months. Our team reviews every
							application and will follow up by email.
						</p>
					</div>
				)
			}

			default:
				return null
		}
	}

	/* =======================================================
	   Form Shell — Split-Panel Layout
	   ======================================================= */

	return (
		<div ref={mainRef} className="flex flex-col gap-10 lg:flex-row lg:gap-12">
			{/* Sidebar — desktop only */}
			<Sidebar />

			{/* Main panel */}
			<div className="min-w-0 flex-1" role="main" aria-labelledby="form-title">
				{/* Mobile step bar */}
				<MobileStepBar />

				{/* Step header */}
				<div className="mb-10">
					<h2
						id="form-title"
						className="mb-2 text-3xl font-bold tracking-tight"
					>
						{STEP_LABELS[currentStep - 1]}
					</h2>
					<p className="text-muted-foreground text-lg">
						{STEP_SUBTITLES[currentStep - 1]}
					</p>
				</div>

				{/* Step content */}
				<div className="mb-12">{renderStep()}</div>

				{/* Navigation */}
				<nav
					className="flex items-center justify-between border-t pt-6"
					role="navigation"
					aria-label="Form navigation"
				>
					<Button
						variant="ghost"
						onClick={prevStep}
						disabled={currentStep === 1}
						className="gap-2"
						aria-label="Go to previous step"
					>
						<ChevronLeft className="h-4 w-4" />
						Back
					</Button>

					{currentStep < TOTAL_STEPS ? (
						<Button
							onClick={nextStep}
							disabled={!isStepComplete(currentStep)}
							className="gap-2 px-6"
							aria-label="Continue to next step"
						>
							Continue
							<ChevronRight className="h-4 w-4" />
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting || !isStepComplete(currentStep)}
							className="gap-2 px-6"
							size="lg"
							aria-label="Submit application"
						>
							{isSubmitting ? (
								<span aria-live="polite">Submitting...</span>
							) : (
								<>
									<Check className="h-4 w-4" />
									Submit Application
								</>
							)}
						</Button>
					)}
				</nav>
			</div>
		</div>
	)
}
