'use client'

import {
	ChevronRight,
	ChevronLeft,
	Check,
	Heart,
	Users,
	MessageCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { submitMentorApplication } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface MentorApplicationFormProps {
	userData: {
		name: string
		email: string
		userId: string
	}
}

interface MentorApplicationFormData {
	name: string
	email: string
	mentorshipExperience: string
	motivationToMentor: string
	preferredCommunicationStyle: string
	availability: string
	specialExpertise: string

	mentorGenderPreference: string
	additionalInfo: string
	hearAboutProgram: string
	hearAboutProgramOther: string
}

const TOTAL_STEPS = 5

export default function MentorApplicationForm({
	userData,
}: MentorApplicationFormProps) {
	const [currentStep, setCurrentStep] = useState(1)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<MentorApplicationFormData>({
		name: userData.name,
		email: userData.email,
		mentorshipExperience: '',
		motivationToMentor: '',
		preferredCommunicationStyle: '',
		availability: '',
		specialExpertise: '',

		mentorGenderPreference: '',
		additionalInfo: '',
		hearAboutProgram: '',
		hearAboutProgramOther: '',
	})
	const router = useRouter()

	// Auto-save to sessionStorage (debounced). Avoid persisting identity fields.
	useEffect(() => {
		const timer = setTimeout(() => {
			try {
				const { name: _name, email: _email, ...draft } = formData
				sessionStorage.setItem(
					'app-mentor-application-draft',
					JSON.stringify(draft),
				)
			} catch (error) {
				console.warn('Failed to save draft:', error)
			}
		}, 1000)

		return () => clearTimeout(timer)
	}, [formData])

	// Load from sessionStorage on mount (migrate from legacy localStorage)
	useEffect(() => {
		let saved = sessionStorage.getItem('app-mentor-application-draft')
		if (!saved) {
			// One-time migration: localStorage -> sessionStorage
			const legacy = localStorage.getItem(
				'app-mentor-application-draft',
			)
			if (legacy) {
				saved = legacy
				try {
					sessionStorage.setItem('app-mentor-application-draft', legacy)
					localStorage.removeItem('app-mentor-application-draft')
				} catch {
					// ignore
				}
			}
		}
		if (saved) {
			try {
				const parsed = JSON.parse(saved)
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					setFormData((prev) => ({
						...prev,
						...parsed,
						name: userData.name,
						email: userData.email,
					}))
				} else {
					setFormData((prev) => ({
						...prev,
						name: userData.name,
						email: userData.email,
					}))
				}
			} catch {
				// Ignore invalid JSON
			}
		}
	}, [userData.name, userData.email])

	const updateFormData = (
		field: keyof MentorApplicationFormData,
		value: string,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const isStepValid = (step: number): boolean => {
		switch (step) {
			case 1:
				return (
					!!formData.motivationToMentor &&
					formData.motivationToMentor.length >= 50
				)
			case 2:
				return !!(formData.name && formData.email)
			case 3:
				return !!(formData.preferredCommunicationStyle && formData.availability)
			case 4:
				return !!formData.mentorGenderPreference
			case 5:
				return (
					!!formData.hearAboutProgram &&
					(formData.hearAboutProgram !== 'Other' ||
						!!formData.hearAboutProgramOther)
				)
			default:
				return true
		}
	}

	const nextStep = () => {
		if (currentStep < TOTAL_STEPS && isStepValid(currentStep)) {
			setCurrentStep((prev) => prev + 1)
		}
	}

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1)
		}
	}

	const handleSubmit = async () => {
		setIsSubmitting(true)

		try {
			const submitFormData = new FormData()
			Object.entries(formData).forEach(([key, value]) => {
				if (
					key === 'hearAboutProgramOther' &&
					formData.hearAboutProgram !== 'Other'
				) {
					return // Don't submit hearAboutProgramOther unless hearAboutProgram is "Other"
				}

				// Do not send identity fields from the client; server derives them.
				if (key === 'name' || key === 'email') return
				submitFormData.set(key, value)
			})

			// Do not send userId from the client; server derives it.

			const result = await submitMentorApplication(submitFormData)

			if (result.success) {
				try {
					sessionStorage.removeItem('app-mentor-application-draft')
					localStorage.removeItem('app-mentor-application-draft')
				} catch {
					// ignore
				}
				toast.success('Mentor application submitted successfully!')
				router.push('/mentor/apply/success')
			} else {
				toast.error(result.error || 'Failed to submit mentor application')
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.')
			console.error('Mentor application submission error:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const getStepTitle = (step: number): string => {
		switch (step) {
			case 1:
				return 'Your Why'
			case 2:
				return 'About You'
			case 3:
				return 'How You Mentor'
			case 4:
				return 'Community Connection'
			case 5:
				return 'Final Details'
			default:
				return ''
		}
	}

	const getStepSubtitle = (step: number): string => {
		switch (step) {
			case 1:
				return 'What draws you to supporting fellow athletes?'
			case 2:
				return 'Help us get to know you better'
			case 3:
				return 'Your mentoring style and availability'
			case 4:
				return 'Building our inclusive community together'
			case 5:
				return 'Just a few final questions'
			default:
				return ''
		}
	}

	const getStepIcon = (step: number) => {
		switch (step) {
			case 1:
				return <Heart className="h-5 w-5" />
			case 2:
				return <Users className="h-5 w-5" />
			case 3:
				return <MessageCircle className="h-5 w-5" />
			case 4:
				return <Users className="h-5 w-5" />
			case 5:
				return <Check className="h-5 w-5" />
			default:
				return null
		}
	}

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="motivationToMentor">
								What draws you to supporting fellow athletes?
							</Label>
							<Textarea
								id="motivationToMentor"
								value={formData.motivationToMentor}
								onChange={(e) =>
									updateFormData('motivationToMentor', e.target.value)
								}
								rows={5}
								placeholder="Share what motivates you to support other athletes. Whether it's your own experiences, passion for community building, or desire to give back - we'd love to hear your story."
								required
							/>
							<div className="text-muted-foreground text-xs">
								{formData.motivationToMentor.length}/50 characters minimum
							</div>
						</div>
					</div>
				)

			case 2:
				return (
					<div className="space-y-6">
						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => updateFormData('name', e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={formData.email}
									readOnly
									className="bg-muted"
								/>
								<p className="text-muted-foreground text-xs">
									From your account profile
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mentorshipExperience">
								Previous Mentoring Experience (Optional)
							</Label>
							<Textarea
								id="mentorshipExperience"
								value={formData.mentorshipExperience}
								onChange={(e) =>
									updateFormData('mentorshipExperience', e.target.value)
								}
								rows={3}
								placeholder="Any previous experience mentoring, coaching, or supporting others in running or other areas. Don't worry if this is your first time - your enthusiasm matters most!"
							/>
						</div>
					</div>
				)

			case 3:
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="preferredCommunicationStyle">
								How do you prefer to connect with your mentee?
							</Label>
							<Select
								value={formData.preferredCommunicationStyle}
								onValueChange={(value) =>
									updateFormData('preferredCommunicationStyle', value)
								}
								required
							>
								<SelectTrigger>
									<SelectValue placeholder="Select your preferred style" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Occasional Slack messages">
										Occasional Slack messages
									</SelectItem>
									<SelectItem value="Monthly check-ins">
										Monthly check-ins
									</SelectItem>
									<SelectItem value="Group activities">
										Group activities
									</SelectItem>
									<SelectItem value="Whatever works best for them">
										Whatever works best for them
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="availability">
								What's your mentoring availability?
							</Label>
							<Select
								value={formData.availability}
								onValueChange={(value) => updateFormData('availability', value)}
								required
							>
								<SelectTrigger>
									<SelectValue placeholder="Select your availability" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Whatever I can offer">
										Whatever I can offer
									</SelectItem>
									<SelectItem value="Light touch support">
										Light touch support
									</SelectItem>
									<SelectItem value="Regular support">
										Regular support
									</SelectItem>
									<SelectItem value="Around race time">
										Around race time
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="specialExpertise">
								Special expertise or interests you'd love to share (Optional)
							</Label>
							<Textarea
								id="specialExpertise"
								value={formData.specialExpertise}
								onChange={(e) =>
									updateFormData('specialExpertise', e.target.value)
								}
								rows={3}
								placeholder="e.g., nutrition, injury prevention, specific trail systems, gear recommendations, race strategy, mindfulness, or any other areas where you have knowledge to share"
							/>
						</div>

						<div className="border-border bg-accent rounded-lg p-6">
							<h4 className="text-accent-foreground mb-4 text-lg font-semibold">
								💡 What mentoring looks like
							</h4>
							<ul className="text-accent-foreground/80 space-y-3 text-sm leading-relaxed">
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1 font-bold">•</span>
									<span>
										Check in with your mentee about their training and goals
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1 font-bold">•</span>
									<span>Share encouragement and celebrate their progress</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1 font-bold">•</span>
									<span>
										Offer practical advice about gear, nutrition, and race day
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1 font-bold">•</span>
									<span>Connect them with our broader community</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1 font-bold">•</span>
									<span>Be a supportive voice throughout their journey</span>
								</li>
							</ul>
						</div>
					</div>
				)

			case 4:
				return (
					<div className="space-y-6">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="mentorGenderPreference">
									Mentoring Preference (Optional but Recommended)
								</Label>
								<Select
									value={formData.mentorGenderPreference}
									onValueChange={(value) =>
										updateFormData('mentorGenderPreference', value)
									}
									required
								>
									<SelectTrigger>
										<SelectValue placeholder="Select your preference" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="no-preference">
											No preference - happy to mentor anyone
										</SelectItem>
										<SelectItem value="same-gender">
											Prefer to mentor people who share my gender identity
										</SelectItem>
									</SelectContent>
								</Select>
								<div className="bg-muted rounded-lg p-3">
									<p className="text-muted-foreground text-sm leading-relaxed">
										This helps us make thoughtful matches that ensure everyone
										feels comfortable and supported. Your preference will be
										respected in our pairing process.
									</p>
								</div>
							</div>
						</div>

						<div className="border-border bg-card rounded-lg p-6 shadow-sm">
							<h4 className="text-card-foreground mb-3 text-lg font-semibold">
								🎉 One Athlete at a Time
							</h4>
							<p className="text-muted-foreground text-sm leading-relaxed">
								We pair mentors with one athlete at a time to ensure meaningful
								connections. You'll support them through their race preparation
								and beyond, building a lasting mentoring relationship.
							</p>
						</div>

						{/* Slack Community Information */}
						<div className="border-border bg-secondary rounded-lg p-6">
							<h4 className="text-secondary-foreground mb-3 text-lg font-semibold">
								🎉 Join our Slack Community!
							</h4>
							<p className="text-secondary-foreground/80 mb-4 text-sm leading-relaxed">
								Our Slack workspace is where mentors and athletes connect, share
								experiences, and build lasting friendships.
							</p>
							<p className="text-secondary-foreground mb-4 text-sm font-medium">
								<strong>Mentor-athlete matching happens in Slack</strong> — if
								you’re approved, we’ll email your Slack invite and add you to{' '}
								<strong>#mentors</strong>.
							</p>
						</div>
					</div>
				)

			case 5:
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="hearAboutProgram">
								How did you hear about our mentor program?
							</Label>
							<Select
								value={formData.hearAboutProgram}
								onValueChange={(value) =>
									updateFormData('hearAboutProgram', value)
								}
								required
							>
								<SelectTrigger>
									<SelectValue placeholder="Select an option" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Website">Website</SelectItem>
									<SelectItem value="Social Media">Social Media</SelectItem>
									<SelectItem value="Friend/Family">Friend/Family</SelectItem>
									<SelectItem value="Running Group">Running Group</SelectItem>
									<SelectItem value="Race Event">Race Event</SelectItem>
									<SelectItem value="Newsletter">Newsletter</SelectItem>
									<SelectItem value="Slack Community">
										Slack Community
									</SelectItem>
									<SelectItem value="Other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{formData.hearAboutProgram === 'Other' && (
							<div className="space-y-2">
								<Label htmlFor="hearAboutProgramOther">Please specify</Label>
								<Input
									id="hearAboutProgramOther"
									value={formData.hearAboutProgramOther}
									onChange={(e) =>
										updateFormData('hearAboutProgramOther', e.target.value)
									}
									placeholder="Tell us how you heard about the mentor program"
									required
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="additionalInfo">
								Anything else you'd like us to know? (Optional)
							</Label>
							<Textarea
								id="additionalInfo"
								value={formData.additionalInfo}
								onChange={(e) =>
									updateFormData('additionalInfo', e.target.value)
								}
								rows={4}
								placeholder="Share any additional thoughts, questions, or information that would help us match you with the right mentee."
							/>
						</div>

						<div className="bg-primary/5 border-primary/20 rounded-lg border p-6">
							<h4 className="text-primary mb-3 text-lg font-medium">
								Ready to make an impact!
							</h4>
							<p className="text-muted-foreground text-sm leading-relaxed">
								Thank you for your interest in mentoring! After submitting this
								application, we'll review it and reach out within 1-2 weeks. If
								accepted, we'll add you to our mentor community and start
								matching you with athletes who could benefit from your support
								and encouragement.
							</p>
						</div>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<div className="mx-auto max-w-2xl" role="main" aria-labelledby="form-title">
			{/* Progress indicator */}
			<div className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<div className="text-muted-foreground text-sm">
						Step {currentStep} of {TOTAL_STEPS}
					</div>
					<div className="text-muted-foreground flex items-center gap-2 text-sm">
						{getStepIcon(currentStep)}
						<span>Mentor Application</span>
					</div>
				</div>
				<div className="flex gap-2">
					{Array.from({ length: TOTAL_STEPS }, (_, i) => (
						<div
							key={i}
							className={`h-2 flex-1 rounded-full transition-all duration-300 ${
								i + 1 < currentStep
									? 'bg-primary'
									: i + 1 === currentStep
										? 'bg-primary/60'
										: 'bg-muted'
							}`}
						/>
					))}
				</div>
			</div>

			{/* Step content */}
			<div className="mb-8">
				<div className="mb-8 text-center">
					<h2 id="form-title" className="mb-2 text-2xl font-bold">
						{getStepTitle(currentStep)}
					</h2>
					<p className="text-muted-foreground">
						{getStepSubtitle(currentStep)}
					</p>
				</div>

				<Card>
					<CardContent className="p-8" role="form" aria-labelledby="form-title">
						{renderStep()}
					</CardContent>
				</Card>
			</div>

			{/* Navigation */}
			<nav
				className="flex justify-between"
				role="navigation"
				aria-label="Form navigation"
			>
				<Button
					variant="outline"
					onClick={prevStep}
					disabled={currentStep === 1}
					className="flex items-center gap-2"
					aria-label="Go to previous step"
				>
					<ChevronLeft className="h-4 w-4" aria-hidden="true" />
					Back
				</Button>

				{currentStep < TOTAL_STEPS ? (
					<Button
						onClick={nextStep}
						disabled={!isStepValid(currentStep)}
						className="flex items-center gap-2"
						aria-label="Continue to next step"
					>
						Continue
						<ChevronRight className="h-4 w-4" aria-hidden="true" />
					</Button>
				) : (
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || !isStepValid(currentStep)}
						className="flex items-center gap-2"
						aria-label="Submit mentor application"
					>
						{isSubmitting ? (
							<>
								<span aria-live="polite">Submitting...</span>
							</>
						) : (
							<>
								<Check className="h-4 w-4" aria-hidden="true" />
								Submit Application
							</>
						)}
					</Button>
				)}
			</nav>
		</div>
	)
}
