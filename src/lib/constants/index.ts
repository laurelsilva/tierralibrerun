import { siteConfig } from '@/lib/config/site'

export const APP_CONFIG = {
	name: siteConfig.name,
	description: siteConfig.description,
	url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
	version: '0.1.0',
} as const

export const ROUTES = {
	HOME: '/',
	DASHBOARD: '/dashboard',
	ADMIN: '/admin',
	DONATE: '/donate',
	FUND: '/fund',
	ONBOARDING: '/onboarding',
	SIGN_IN: '/?auth=sign-in',
	SIGN_UP: '/?auth=sign-up',
} as const

export const AUTH_CONFIG = {
	signInUrl: '/?auth=sign-in',
	signUpUrl: '/?auth=sign-up',
	afterSignInUrl: '/dashboard',
	afterSignUpUrl: '/new-user',
} as const

export const DATABASE_CONFIG = {
	connectionLimit: 10,
	acquireTimeout: 30000,
	timeout: 30000,
} as const

export const PAGINATION = {
	defaultLimit: 20,
	maxLimit: 100,
} as const

export const APPLICATION_STATUS = {
	PENDING: 'pending',
	APPROVED: 'approved',
	REJECTED: 'rejected',
} as const

export const USER_ROLES = {
	ADMIN: 'admin',
	USER: 'user',
	ATHLETE: 'athlete',
} as const

export const ERROR_MESSAGES = {
	UNAUTHORIZED: 'You are not authorized to perform this action',
	FORBIDDEN: 'Access denied',
	NOT_FOUND: 'Resource not found',
	INTERNAL_ERROR: 'Internal server error',
	VALIDATION_ERROR: 'Validation failed',
	RATE_LIMITED: 'Too many requests, please try again later',
} as const
