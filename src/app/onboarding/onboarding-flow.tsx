'use client'

import { useUser, UserProfile } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
	CheckCircle,
	Circle,
	ExternalLink,
	User,
	Heart,
	Instagram,
	Check,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { updateOnboardingStep, completeOnboarding } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	normalizeInternalPath,
	resolveOnboardingReturnTarget,
} from '@/lib/onboarding-routing'
import { type UserType } from '@/server/auth/roles'

interface UserData {
	name: string
	email: string
	userId: string
	profileImageUrl?: string | null
}

interface OnboardingFlowProps {
	userData: UserData
	nextUrl?: string
}

interface OnboardingStep {
	id: number
	title: string
	description: string
	completed?: boolean
}

export function OnboardingFlow({ userData, nextUrl }: OnboardingFlowProps) {
	const [currentStep, setCurrentStep] = useState(0) // Start at 0 for user type selection
	const [isUpdating, setIsUpdating] = useState(false)
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
	const [showProfileModal, setShowProfileModal] = useState(false)
	const [userType, setUserType] = useState<UserType>(null)
	const { user } = useUser()

	const getStepsForUserType = (type: UserType): OnboardingStep[] => {
		if (type === 'ally') {
			return [
				{
					id: 1,
					title: 'Profile Photo',
					description:
						'Add a profile photo to help the community recognize you',
					completed: completedSteps.has(1),
				},
				{
					id: 2,
					title: 'Donate to Our Mission',
					description: 'Consider making a donation to support our athletes',
					completed: completedSteps.has(2),
				},
				{
					id: 3,
					title: 'Follow Our Journey',
					description: 'Stay updated on our community events and stories',
					completed: completedSteps.has(3),
				},
			]
		} else {
			return [
				{
					id: 1,
					title: 'Profile Photo',
					description:
						'Add a profile photo to help the community recognize you',
					completed: completedSteps.has(1),
				},
				{
					id: 2,
					title: 'Join Our Strava Club',
					description: 'Follow our Strava club for community updates',
					completed: completedSteps.has(2),
				},
				{
					id: 3,
					title: 'Follow Our Journey',
					description: 'Stay connected with our community on Instagram',
					completed: completedSteps.has(3),
				},
			]
		}
	}

	const steps = userType ? getStepsForUserType(userType) : []

	const progress = (currentStep / steps.length) * 100

	const getPostOnboardingTarget = () => {
		const explicitNext = normalizeInternalPath(nextUrl)
		if (explicitNext) return explicitNext

		if (typeof window === 'undefined') return '/dashboard'

		try {
			const stored = normalizeInternalPath(
				localStorage.getItem('app:returnTo'),
			)
			if (stored) return stored
		} catch {}

		return (
			resolveOnboardingReturnTarget(new URLSearchParams(window.location.search)) ||
			'/dashboard'
		)
	}

	const clearReturnTarget = () => {
		if (typeof window === 'undefined') return

		try {
			localStorage.removeItem('app:returnTo')
		} catch {}
	}

	const finalizeOnboarding = async (mode: 'celebrate' | 'redirect') => {
		setIsUpdating(true)
		try {
			const result = await completeOnboarding()
			if (!result.success) {
				toast.error(result.error || 'Something went wrong')
				return false
			}

			if (mode === 'redirect') {
				toast.success('Welcome to Trail Running Community! 🎉')
				const target = getPostOnboardingTarget()
				clearReturnTarget()
				window.location.assign(target)
				return true
			}

			setCurrentStep(-1)
			return true
		} catch (error) {
			toast.error('An error occurred. Please try again.')
			console.error('Onboarding completion error:', error)
			return false
		} finally {
			setIsUpdating(false)
		}
	}

	const handleUserTypeSelection = async (type: UserType) => {
		if (!type) return

		setUserType(type)
		setCurrentStep(1)
		setCompletedSteps(new Set()) // Reset completed steps when user type changes
	}

	const handleStepComplete = async (stepData: {
		type: 'profile_photo' | 'strava' | 'donate' | 'instagram'
		profileImageUrl?: string | null
		stravaJoined?: boolean
		donationCompleted?: boolean
		instagramFollowed?: boolean
	}) => {
		setIsUpdating(true)
		try {
			const result = await updateOnboardingStep(stepData)
			if (result.success) {
				setCompletedSteps((prev) => new Set([...prev, currentStep]))
				toast.success('Step completed! 🎉')

				if (currentStep < steps.length) {
					setTimeout(() => {
						setCurrentStep(currentStep + 1)
					}, 500)
				} else {
					// Persist onboarding before showing any protected next steps.
					setTimeout(() => {
						void finalizeOnboarding('celebrate')
					}, 800)
				}
			} else {
				toast.error(result.error || 'Something went wrong')
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.')
			console.error('Onboarding error:', error)
		} finally {
			setIsUpdating(false)
		}
	}

	const handleSkipStep = () => {
		if (currentStep < steps.length) {
			setCurrentStep(currentStep + 1)
		} else {
			// Persist onboarding before showing any protected next steps.
			setTimeout(() => {
				void finalizeOnboarding('celebrate')
			}, 300)
		}
	}

	const handleComplete = async () => {
		// If no user type selected yet, redirect directly to dashboard
		if (!userType) {
			await finalizeOnboarding('redirect')
		} else {
			await finalizeOnboarding('celebrate')
		}
	}

	const renderStep = () => {
		if (currentStep === 0) {
			return (
				<UserTypeSelection
					onSelect={handleUserTypeSelection}
					isUpdating={isUpdating}
				/>
			)
		}

		if (currentStep === -1) {
			const nextTarget = getPostOnboardingTarget()
			return (
				<CelebrationStep
					userType={userType}
					nextTarget={nextTarget}
					onComplete={() => {
						clearReturnTarget()
						window.location.assign(nextTarget)
					}}
					isUpdating={isUpdating}
				/>
			)
		}

		switch (currentStep) {
			case 1:
				return (
					<ProfilePhotoStep
						user={user}
						userData={userData}
						onComplete={handleStepComplete}
						onSkip={handleSkipStep}
						isUpdating={isUpdating}
						showProfileModal={showProfileModal}
						setShowProfileModal={setShowProfileModal}
					/>
				)
			case 2:
				if (userType === 'ally') {
					return (
						<DonateStep
							onComplete={handleStepComplete}
							onSkip={handleSkipStep}
							isUpdating={isUpdating}
						/>
					)
				} else {
					return (
						<StravaStep
							onComplete={handleStepComplete}
							onSkip={handleSkipStep}
							isUpdating={isUpdating}
						/>
					)
				}
			case 3:
				return (
					<InstagramStep
						userType={userType}
						onComplete={handleStepComplete}
						onSkip={handleSkipStep}
						isUpdating={isUpdating}
					/>
				)
			default:
				return null
		}
	}

	return (
		<div className="space-y-8">
			{/* Progress bar - only show after user type selection */}
			{currentStep > 0 && currentStep !== -1 && steps.length > 0 && (
				<div className="space-y-2">
					<div className="text-muted-foreground flex justify-between text-sm">
						<span>
							Step {currentStep} of {steps.length}
						</span>
						<span>{Math.round(progress)}% complete</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>
			)}

			{/* Step indicators - only show after user type selection and not during celebration */}
			{currentStep > 0 && currentStep !== -1 && steps.length > 0 && (
				<div className="flex items-center justify-center space-x-4">
					{steps.map((step, index) => (
						<div key={step.id} className="flex items-center">
							<motion.div
								initial={{ scale: 0.8, opacity: 0.5 }}
								animate={{
									scale: currentStep >= step.id ? 1 : 0.8,
									opacity: currentStep >= step.id ? 1 : 0.5,
								}}
								transition={{ duration: 0.3 }}
								className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium ${
									completedSteps.has(step.id)
										? 'bg-primary border-primary text-primary-foreground'
										: currentStep === step.id
											? 'border-primary bg-primary/10 text-primary'
											: 'border-muted bg-background text-muted-foreground'
								}`}
							>
								{completedSteps.has(step.id) ? (
									<CheckCircle className="h-5 w-5" />
								) : (
									<Circle className="h-5 w-5" />
								)}
							</motion.div>
							{index < steps.length - 1 && (
								<motion.div
									initial={{ scaleX: 0 }}
									animate={{ scaleX: completedSteps.has(step.id) ? 1 : 0 }}
									transition={{ duration: 0.5, delay: 0.2 }}
									className="bg-primary mx-4 h-0.5 w-16 origin-left"
								/>
							)}
						</div>
					))}
				</div>
			)}

			{/* Current step */}
			<motion.div
				key={`${currentStep}-${userType}`}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				transition={{ duration: 0.4 }}
			>
				<Card>
					{currentStep > 0 && currentStep !== -1 && steps.length > 0 && (
						<CardHeader className="text-center">
							<CardTitle className="text-2xl">
								{steps[currentStep - 1]?.title}
							</CardTitle>
							<p className="text-muted-foreground">
								{steps[currentStep - 1]?.description}
							</p>
						</CardHeader>
					)}
					<CardContent className={currentStep === -1 ? 'p-8' : undefined}>
						{renderStep()}
					</CardContent>
				</Card>
			</motion.div>

			{/* Skip all button - only show during steps, not user selection or celebration */}
			{currentStep > 0 && currentStep !== -1 && (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={handleComplete}
						disabled={isUpdating}
						className="text-muted-foreground hover:text-foreground"
					>
						{userType
							? 'Skip to celebration'
							: 'Skip onboarding and go to dashboard'}
					</Button>
				</div>
			)}
		</div>
	)
}

function ProfilePhotoStep({
	user,
	userData,
	onComplete,
	onSkip,
	isUpdating,
	showProfileModal,
	setShowProfileModal,
}: {
	user: { imageUrl?: string } | null | undefined
	userData: UserData
	onComplete: (data: {
		type: 'profile_photo'
		profileImageUrl?: string | null
	}) => void
	onSkip: () => void
	isUpdating: boolean
	showProfileModal: boolean
	setShowProfileModal: (show: boolean) => void
}) {
	const handleUseCurrentPhoto = async () => {
		if (user?.imageUrl) {
			await onComplete({
				type: 'profile_photo',
				profileImageUrl: user.imageUrl,
			})
		} else {
			await onComplete({
				type: 'profile_photo',
				profileImageUrl: null,
			})
		}
	}

	const handleOpenProfileEditor = () => {
		setShowProfileModal(true)
	}

	const handleProfileUpdated = async () => {
		setShowProfileModal(false)
		// Wait a moment for Clerk to update the user data
		setTimeout(async () => {
			if (user?.imageUrl) {
				await onComplete({
					type: 'profile_photo',
					profileImageUrl: user.imageUrl,
				})
			}
		}, 1000)
	}

	return (
		<div className="space-y-6">
			{/* Current profile photo display */}
			<div className="flex justify-center">
				<div className="relative">
					<div className="border-primary/20 bg-muted h-32 w-32 overflow-hidden rounded-full border-2">
						{user?.imageUrl || userData.profileImageUrl ? (
							<div
								style={{
									backgroundImage: `url(${user?.imageUrl || userData.profileImageUrl})`,
								}}
								className="h-full w-full bg-cover bg-center"
							/>
						) : (
							<div className="text-muted-foreground flex h-full w-full items-center justify-center">
								<User className="h-12 w-12" />
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="space-y-3">
				<Button
					onClick={handleOpenProfileEditor}
					disabled={isUpdating}
					variant="outline"
					className="w-full"
				>
					{user?.imageUrl || userData.profileImageUrl
						? 'Update Profile Photo'
						: 'Add Profile Photo'}
				</Button>

				{(user?.imageUrl || userData.profileImageUrl) && (
					<Button
						onClick={handleUseCurrentPhoto}
						disabled={isUpdating}
						className="w-full"
					>
						{isUpdating ? 'Saving...' : 'Use Current Photo'}
					</Button>
				)}

				<p className="text-muted-foreground text-center text-xs">
					You can update your photo anytime in your profile settings.
				</p>
			</div>

			<div className="flex gap-4">
				<Button
					variant="outline"
					onClick={onSkip}
					disabled={isUpdating}
					className="flex-1"
				>
					Skip this step
				</Button>
				{!(user?.imageUrl || userData.profileImageUrl) && (
					<Button
						onClick={() =>
							onComplete({ type: 'profile_photo', profileImageUrl: null })
						}
						disabled={isUpdating}
						className="flex-1"
					>
						Continue without photo
					</Button>
				)}
			</div>

			{/* Clerk Profile Modal */}
			{showProfileModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="bg-background max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold">Update Your Profile</h2>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowProfileModal(false)}
							>
								×
							</Button>
						</div>
						<UserProfile
							routing="hash"
							appearance={{
								elements: {
									rootBox: 'w-full min-h-[600px]',
									card: 'shadow-none border-0',
								},
							}}
						/>
						<div className="mt-4 flex justify-end">
							<Button onClick={handleProfileUpdated}>Done</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

function UserTypeSelection({
	onSelect,
	isUpdating,
}: {
	onSelect: (type: UserType) => void
	isUpdating: boolean
}) {
	const [selectedType, setSelectedType] = useState<UserType>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		genderIdentity: '',
		pronouns: '',
		age: '',
		zipcode: '',
		runningExperience: '',
		hearAbout: '',
		acceptedCodeOfConduct: false,
	})

	const handleSubmit = async () => {
		if (selectedType) {
			setIsSubmitting(true)
			try {
				// Save user type first
				const userTypeResult = await updateOnboardingStep({
					type: 'user_type',
					userType: selectedType,
				})

				if (!userTypeResult.success) {
					toast.error('Failed to save user type')
					setIsSubmitting(false)
					return
				}

				// Validate age before saving
				const age = parseInt(formData.age)
				if (age < 18) {
					toast.error('You must be at least 18 years old to create an account')
					setIsSubmitting(false)
					return
				}

				// Validate zipcode
				if (!formData.zipcode || formData.zipcode.trim().length === 0) {
					toast.error('Please enter your ZIP/Postal Code')
					setIsSubmitting(false)
					return
				}

				// Basic zipcode validation (5 digits for US, or alphanumeric for international)
				const zipcodeRegex = /^[A-Z0-9\s-]{3,10}$/i
				if (!zipcodeRegex.test(formData.zipcode.trim())) {
					toast.error('Please enter a valid ZIP/Postal Code (3-10 characters)')
					setIsSubmitting(false)
					return
				}

				// Save demographics data
				const demographicsResult = await updateOnboardingStep({
					type: 'demographics',
					genderIdentity: formData.genderIdentity || undefined,
					pronouns: formData.pronouns || undefined,
					age: age,
					zipcode: formData.zipcode.trim(),
					runningExperience: formData.runningExperience || undefined,
					hearAbout: formData.hearAbout || undefined,
					acceptedCodeOfConduct: formData.acceptedCodeOfConduct,
				})

				if (demographicsResult.success) {
					onSelect(selectedType)
				} else {
					toast.error('Failed to save profile information')
				}
			} catch (error) {
				toast.error('An error occurred. Please try again.')
				console.error('User type selection error:', error)
			} finally {
				setIsSubmitting(false)
			}
		}
	}

	return (
		<div className="space-y-8">
			<div className="text-center">
				<h2 className="mb-4 text-3xl font-bold">
					Welcome to Trail Running Community!
				</h2>
				<p className="text-muted-foreground text-lg">
					We create pathways for athletes to access, enjoy, and
					lead in the sport.
				</p>
			</div>

			<div className="space-y-6">
				<h3 className="text-center text-lg font-medium">
					How would you like to get involved?
				</h3>

				<div className="grid gap-4 md:grid-cols-2">
					<Button
						onClick={() => setSelectedType('bipoc')}
						disabled={isUpdating || isSubmitting}
						variant={selectedType === 'bipoc' ? 'default' : 'outline'}
						className="flex h-auto flex-col items-start p-6 text-left whitespace-normal"
					>
						<div className="mb-2 flex w-full items-center gap-2">
							<CheckCircle className="h-5 w-5 flex-shrink-0" />
							<span className="font-semibold">I&apos;m an Athlete</span>
						</div>
						<p className="w-full text-left text-sm opacity-90">
							Join our community, access funding opportunities, and connect with
							fellow athletes
						</p>
					</Button>

					<Button
						onClick={() => setSelectedType('ally')}
						disabled={isUpdating || isSubmitting}
						variant={selectedType === 'ally' ? 'default' : 'outline'}
						className="flex h-auto flex-col items-start p-6 text-left whitespace-normal"
					>
						<div className="mb-2 flex w-full items-center gap-2">
							<Circle className="h-5 w-5 flex-shrink-0" />
							<span className="font-semibold">I'm an Ally</span>
						</div>
						<p className="text-muted-foreground w-full text-left text-sm">
							Support our mission and stay connected with our community events
						</p>
					</Button>
				</div>

				{selectedType && (
					<div className="space-y-6 border-t pt-6">
						<h3 className="text-lg font-medium">
							A few quick questions to get you started
						</h3>

						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="age">Age</Label>
								<Input
									id="age"
									type="number"
									min="18"
									max="120"
									value={formData.age}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, age: e.target.value }))
									}
									placeholder="e.g., 28"
									required
								/>
								<p className="text-muted-foreground text-xs">
									You must be at least 18 years old to create an account
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="zipcode">
									ZIP/Postal Code <span className="text-destructive">*</span>
								</Label>
								<Input
									id="zipcode"
									type="text"
									value={formData.zipcode}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											zipcode: e.target.value.toUpperCase(),
										}))
									}
									placeholder="e.g., 98101 or K1A 0B1"
									required
									maxLength={10}
									pattern="[A-Z0-9\s-]{3,10}"
									style={{ textTransform: 'uppercase' }}
								/>
								<p className="text-muted-foreground text-xs">
									Enter your ZIP code (US) or Postal Code (Canada/International)
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="genderIdentity">
									Gender Identity (Optional)
								</Label>
								<Select
									value={formData.genderIdentity}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, genderIdentity: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select your gender identity" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Woman">Woman</SelectItem>
										<SelectItem value="Man">Man</SelectItem>
										<SelectItem value="Non-binary">Non-binary</SelectItem>
										<SelectItem value="Transgender woman">
											Transgender woman
										</SelectItem>
										<SelectItem value="Transgender man">
											Transgender man
										</SelectItem>
										<SelectItem value="Genderfluid">Genderfluid</SelectItem>
										<SelectItem value="Genderqueer">Genderqueer</SelectItem>
										<SelectItem value="Two Spirit">Two Spirit</SelectItem>
										<SelectItem value="Agender">Agender</SelectItem>
										<SelectItem value="Self-describe">Self-describe</SelectItem>
										<SelectItem value="Prefer not to answer">
											Prefer not to answer
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="pronouns">Pronouns (Optional)</Label>
								<Input
									id="pronouns"
									value={formData.pronouns}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											pronouns: e.target.value,
										}))
									}
									placeholder="e.g., she/her, he/him, they/them"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="runningExperience">
									Trail Running Experience
								</Label>
								<Select
									value={formData.runningExperience}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											runningExperience: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select your trail running experience" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Curious about trail running">
											Curious about trail running
										</SelectItem>
										<SelectItem value="I've tried a few trail runs">
											I've tried a few trail runs
										</SelectItem>
										<SelectItem value="Trail running is part of my routine">
											Trail running is part of my routine
										</SelectItem>
										<SelectItem value="I run roads and want to try trails">
											I run roads and want to try trails
										</SelectItem>
										<SelectItem value="I prefer not to specify">
											I prefer not to specify
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="hearAbout">How did you hear about us?</Label>
								<Select
									value={formData.hearAbout}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, hearAbout: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select an option" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Social Media">Social Media</SelectItem>
										<SelectItem value="Friend/Family">Friend/Family</SelectItem>
										<SelectItem value="Running Group">Running Group</SelectItem>
										<SelectItem value="Race Event">Race Event</SelectItem>
										<SelectItem value="Website">Website</SelectItem>
										<SelectItem value="Newsletter">Newsletter</SelectItem>
										<SelectItem value="Other">Other</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-4 border-t pt-6">
							<div className="flex items-start space-x-3">
								<Checkbox
									id="acceptedCodeOfConduct"
									checked={formData.acceptedCodeOfConduct}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											acceptedCodeOfConduct: !!checked,
										}))
									}
									className="mt-0.5"
								/>
								<Label
									htmlFor="acceptedCodeOfConduct"
									className="text-sm leading-5"
								>
									I agree to Trail Running Community's{' '}
									<a
										href="/code-of-conduct"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary underline hover:no-underline"
									>
										Code of Conduct
									</a>
								</Label>
							</div>
						</div>

						<Button
							onClick={handleSubmit}
							disabled={
								isUpdating ||
								isSubmitting ||
								!formData.runningExperience ||
								!formData.hearAbout ||
								!formData.age ||
								parseInt(formData.age) < 18 ||
								!formData.acceptedCodeOfConduct
							}
							className="w-full"
						>
							{isUpdating || isSubmitting ? 'Setting up...' : 'Continue'}
						</Button>
						{formData.age && parseInt(formData.age) < 18 && (
							<p className="mt-2 text-center text-sm text-red-500">
								You must be at least 18 years old to create an account with
								Trail Running Community
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function DonateStep({
	onComplete,
	onSkip,
	isUpdating,
}: {
	onComplete: (data: { type: 'donate'; donationCompleted: boolean }) => void
	onSkip: () => void
	isUpdating: boolean
}) {
	const handleDonateComplete = async () => {
		// Mark as completed after a short delay to allow for donation flow
		setTimeout(async () => {
			await onComplete({
				type: 'donate',
				donationCompleted: true,
			})
		}, 1000)
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
					<Heart className="text-primary-foreground h-8 w-8" />
				</div>
				<h3 className="mb-2 text-lg font-medium">Donate to Athletes</h3>
				<p className="text-muted-foreground text-sm">
					Your donation directly supports race entry fees, travel, and community
					programs for athletes.
				</p>
			</div>

			<div className="bg-muted rounded-lg p-4">
				<h4 className="mb-2 font-medium">Your impact:</h4>
				<ul className="text-muted-foreground space-y-1 text-sm">
					<li>• $50 supports gear and nutrition for one athlete</li>
					<li>• $100 covers race entry for a local event</li>
					<li>• $250 funds travel to a destination race</li>
					<li>• $500 sponsors a full race experience</li>
				</ul>
			</div>

			<div className="bg-primary overflow-hidden rounded-lg">
				<iframe
					src={process.env.NEXT_PUBLIC_DONATION_URL || ""}
					name="donateFrame"
					className="h-[400px] w-full"
					allowFullScreen
				/>
			</div>

			<div className="flex gap-4">
				<Button
					variant="outline"
					onClick={onSkip}
					disabled={isUpdating}
					className="flex-1"
				>
					Skip this step
				</Button>
				<Button
					onClick={handleDonateComplete}
					disabled={isUpdating}
					className="flex-1"
				>
					Continue
				</Button>
			</div>
		</div>
	)
}

function InstagramStep({
	userType,
	onComplete,
	onSkip,
	isUpdating,
}: {
	userType: UserType
	onComplete: (data: { type: 'instagram'; instagramFollowed: boolean }) => void
	onSkip: () => void
	isUpdating: boolean
}) {
	const handleFollowInstagram = async () => {
		// Open Instagram in new tab
		if (userType === 'ally') {
			window.open(process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#', '_blank')
		} else {
			window.open(process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#', '_blank')
		}

		// Mark as completed after a short delay
		setTimeout(async () => {
			await onComplete({
				type: 'instagram',
				instagramFollowed: true,
			})
		}, 1000)
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
					<Instagram className="h-8 w-8 text-white" />
				</div>
				<h3 className="mb-2 text-lg font-medium">Follow Our Journey</h3>
				<p className="text-muted-foreground text-sm">
					{userType === 'ally'
						? 'Stay updated on our community events, ally opportunities, and athlete spotlights.'
						: 'Connect with our community and see inspiring stories from fellow athletes.'}
				</p>
			</div>

			<div className="bg-muted rounded-lg p-4">
				<h4 className="mb-2 font-medium">What you'll see on Instagram:</h4>
				<ul className="text-muted-foreground space-y-1 text-sm">
					{userType === 'ally' ? (
						<>
							<li>• Community events and ally opportunities</li>
							<li>• Athlete success stories and race reports</li>
							<li>• Behind-the-scenes from our programs</li>
							<li>• Ways to support and get involved</li>
						</>
					) : (
						<>
							<li>• Weekly trail running inspiration</li>
							<li>• Athlete spotlights and success stories</li>
							<li>• Training tips and route recommendations</li>
							<li>• Community events and meetups</li>
						</>
					)}
				</ul>
			</div>

			<Button
				onClick={handleFollowInstagram}
				disabled={isUpdating}
				className="w-full"
			>
				<ExternalLink className="mr-2 h-4 w-4" />
				{isUpdating ? 'Opening...' : 'Follow on Instagram'}
			</Button>

			<div className="flex gap-4">
				<Button
					variant="outline"
					onClick={onSkip}
					disabled={isUpdating}
					className="flex-1"
				>
					Skip this step
				</Button>
			</div>
		</div>
	)
}

function CelebrationStep({
	userType,
	nextTarget,
	onComplete,
	isUpdating,
}: {
	userType: UserType
	nextTarget: string
	onComplete: () => void
	isUpdating: boolean
}) {
	const primaryActionLabel =
		nextTarget === '/fund/apply'
			? 'Continue to Fund Application'
			: nextTarget === '/mentor/apply'
				? 'Continue to Mentor Application'
				: 'Enter Dashboard'

	return (
		<div className="space-y-8 py-8 text-center">
			<div className="space-y-6">
				<div className="bg-primary mx-auto flex h-24 w-24 items-center justify-center rounded-full">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ duration: 0.5, type: 'spring' }}
					>
						<Check className="text-primary-foreground h-12 w-12" />
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<h2 className="mb-4 text-3xl font-bold">
						Welcome to the Community! 🎉
					</h2>
					<p className="text-muted-foreground mx-auto max-w-2xl text-lg">
						{userType === 'ally'
							? 'Thank you for supporting our mission to make trail running more inclusive.'
							: "You're now part of a supportive community of athletes."}
					</p>
				</motion.div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				className="mx-auto max-w-md space-y-4"
			>
				{userType === 'bipoc' ? (
					<>
						<Button asChild className="w-full" size="lg">
							<Link href="/fund/apply">Apply for Race Funding</Link>
						</Button>
						<Button variant="outline" asChild className="w-full" size="lg">
							<Link href="/mentor/apply">Apply to Be a Mentor</Link>
						</Button>
					</>
				) : (
					<>
						<Button asChild className="w-full" size="lg">
							<Link href="/donate">Support Our Athletes</Link>
						</Button>
						<Button variant="outline" asChild className="w-full" size="lg">
							<Link href="/fund">Learn About Our Mission</Link>
						</Button>
					</>
				)}
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.9 }}
				className="pt-4"
			>
				<Button
					onClick={onComplete}
					disabled={isUpdating}
					size="lg"
					className="px-8"
				>
					{isUpdating ? 'Finishing up...' : primaryActionLabel}
				</Button>
			</motion.div>
		</div>
	)
}

function StravaStep({
	onComplete,
	onSkip,
	isUpdating,
}: {
	onComplete: (data: { type: 'strava'; stravaJoined: boolean }) => void
	onSkip: () => void
	isUpdating: boolean
}) {
	const handleJoinStrava = async () => {
		// Open Strava club in new tab
		window.open(process.env.NEXT_PUBLIC_STRAVA_URL || '#', '_blank')

		// Mark as completed after a short delay
		setTimeout(async () => {
			await onComplete({
				type: 'strava',
				stravaJoined: true,
			})
		}, 1000)
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FC4C02]">
					<svg
						width="32"
						height="32"
						fill="white"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
					>
						<path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
					</svg>
				</div>
				<h3 className="mb-2 text-lg font-medium">Join Our Strava Run Club</h3>
				<p className="text-muted-foreground text-sm">
					Follow our Strava club to see weekly run routes, upcoming events, and
					connect with other members.
				</p>
			</div>

			<div className="space-y-4">
				<div className="bg-muted rounded-lg p-4">
					<h4 className="mb-2 font-medium">What you'll get on Strava:</h4>
					<ul className="text-muted-foreground space-y-1 text-sm">
						<li>• Weekly group run routes and meeting points</li>
						<li>• Event announcements and race details</li>
						<li>• See activities from other community members</li>
						<li>• Share your own trail running adventures</li>
					</ul>
				</div>

				<Button
					onClick={handleJoinStrava}
					disabled={isUpdating}
					className="w-full"
				>
					<ExternalLink className="mr-2 h-4 w-4" />
					{isUpdating ? 'Joining...' : 'Join Strava Club'}
				</Button>
			</div>

			<div className="flex gap-4">
				<Button
					variant="outline"
					onClick={onSkip}
					disabled={isUpdating}
					className="flex-1"
				>
					Skip this step
				</Button>
			</div>
		</div>
	)
}
