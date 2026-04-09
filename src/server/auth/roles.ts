import {getUserFromClerkID} from '@/server/auth/user'

export type UserType = 'bipoc' | 'ally' | null

export interface UserPermissions {
	canApplyForFunding: boolean
	canAccessSlack: boolean
	canAccessStrava: boolean
	canAccessInstagram: boolean
	canDonate: boolean
	showDonateTab: boolean
	showApplicationsTab: boolean
	showCommunityTab: boolean
}

export async function getUserType(): Promise<UserType> {
	try {
		const dbUser = await getUserFromClerkID()
		return dbUser?.userType as UserType || null
	} catch (error) {
		console.error('Error getting user type:', error)
		return null
	}
}

export function getUserPermissions(userType: UserType): UserPermissions {
	if (userType === 'bipoc') {
		return {
			canApplyForFunding: true,
			canAccessSlack: true,
			canAccessStrava: true,
			canAccessInstagram: true,
			canDonate: true,
			showDonateTab: false, // Athletes don't need prominent donate tab
			showApplicationsTab: true,
			showCommunityTab: true
		}
	} else if (userType === 'ally') {
		return {
			canApplyForFunding: false,
			canAccessSlack: false, // Allies shouldn't access private athlete community spaces
			canAccessStrava: false, // Allies shouldn't access athlete training data
			canAccessInstagram: true, // Public inspiration and updates only
			canDonate: true,
			showDonateTab: true, // Prominent donate tab for allies
			showApplicationsTab: false,
			showCommunityTab: true
		}
	} else {
		// Default permissions for users without type set
		return {
			canApplyForFunding: false,
			canAccessSlack: false,
			canAccessStrava: false,
			canAccessInstagram: true,
			canDonate: true,
			showDonateTab: false,
			showApplicationsTab: false,
			showCommunityTab: false
		}
	}
}

export async function requireBipocRole(): Promise<boolean> {
	const userType = await getUserType()
	return userType === 'bipoc'
}

export async function requireAllyRole(): Promise<boolean> {
	const userType = await getUserType()
	return userType === 'ally'
}

export async function hasRole(requiredRole: UserType): Promise<boolean> {
	const userType = await getUserType()
	return userType === requiredRole
}