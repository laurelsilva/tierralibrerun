import {currentUser} from '@clerk/nextjs/server'
import Link from 'next/link'
import {getUserApplicationStatus, canUserApplyForRace} from '@/app/fund/apply/actions'
import {AuthButton} from '@/components/auth/auth-button'
import {Button} from '@/components/ui/button'
import {buildOnboardingPath} from '@/lib/onboarding-routing'
import {getUserType, getUserPermissions} from '@/server/auth/roles'
import {getUserFromClerkID} from '@/server/auth/user'

interface FundApplyButtonProps {
	/**
	 * Optional race name to pre-fill in the application
	 * Format: "Race Series Name - Distance Name" (e.g., "Miwok 100K - 100K")
	 */
	raceName?: string
	/**
	 * Button variant
	 */
	variant?: 'default' | 'outline' | 'secondary' | 'ghost'
	/**
	 * Button size
	 */
	size?: 'default' | 'sm' | 'lg' | 'icon'
	/**
	 * Additional className
	 */
	className?: string
	/**
	 * Whether to show as full width
	 */
	fullWidth?: boolean
	/**
	 * Label for the button (defaults to "Apply for Funding")
	 */
	label?: string
}

/**
 * Smart server component that handles all states for applying to the Athlete Fund
 * 
 * States handled:
 * - Not logged in: Shows sign-up button
 * - Logged in but no profile: Shows complete profile button  
 * - Not a person of color (ally): Shows donate button
 * - Person of color but already applied: Shows view status button
 * - Person of color and can apply: Shows apply button
 */
export async function FundApplyButton({
	raceName,
	variant = 'default',
	size = 'default',
	className = '',
	fullWidth = false,
	label = 'Apply for Funding'
}: FundApplyButtonProps) {
	const user = await currentUser()
	const dbUser = await getUserFromClerkID()
	const userType = await getUserType()
	const permissions = getUserPermissions(userType)

	// Build the apply URL with optional race pre-fill
	const applyHref = raceName
		? `/fund/apply?race=${encodeURIComponent(raceName)}`
		: '/fund/apply'

	// Not signed in - show sign up button
	if (!user) {
		return (
			<AuthButton
				action="sign-up"
				label={label}
				variant={variant}
				size={size}
				className={`${fullWidth ? 'w-full' : ''} ${className}`}
				redirectTo={applyHref}
			/>
		)
	}

	// Missing or incomplete profile - route through onboarding and preserve apply intent.
	if (!dbUser || !dbUser.onboardingCompleted) {
		return (
			<Button
				variant={variant}
				size={size}
				asChild
				className={`${fullWidth ? 'w-full' : ''} ${className}`}>
				<Link href={buildOnboardingPath(applyHref)}>
					Complete Your Profile
				</Link>
			</Button>
		)
	}

	// Not a person of color - show donate button instead
	if (!permissions.canApplyForFunding) {
		return (
			<Button
				variant="outline"
				size={size}
				asChild
				className={`${fullWidth ? 'w-full' : ''} ${className}`}>
				<Link href="/donate">Support Our Athletes</Link>
			</Button>
		)
	}

	// Athlete - check application status
	const applicationStatus = await getUserApplicationStatus(dbUser.id)

	// If specific race provided, check if they can apply for that race
	if (raceName) {
		const {canApply} = await canUserApplyForRace(dbUser.id, raceName)
		
		if (!canApply) {
			// Already applied or can't apply
			return (
				<Button
					variant="outline"
					size={size}
					asChild
					className={`${fullWidth ? 'w-full' : ''} ${className}`}
					disabled>
					<Link href="/dashboard">View Application Status</Link>
				</Button>
			)
		}
	} else {
		// No specific race - check if they have any applications remaining
		if (applicationStatus.remainingApplications === 0) {
			return (
				<Button
					variant="outline"
					size={size}
					asChild
					className={`${fullWidth ? 'w-full' : ''} ${className}`}
					disabled>
					<Link href="/dashboard">View Application Status</Link>
				</Button>
			)
		}
	}

	// Can apply - show apply button
	return (
		<Button
			variant={variant}
			size={size}
			asChild
			className={`${fullWidth ? 'w-full' : ''} ${className}`}>
			<Link href={applyHref}>{label}</Link>
		</Button>
	)
}
