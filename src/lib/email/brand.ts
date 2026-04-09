/**
 * Centralized brand links configuration
 *
 * This module provides a single place to read brand links (website, Slack, Strava, etc.)
 * for use across email templates, the composer, and any other UI surfaces.
 *
 * Priority:
 * 1) Environment variables (NEXT_PUBLIC_*), so you can configure per environment without code changes
 * 2) Sensible defaults that match the site branding
 *
 * Usage:
 *  - Import `getBrandLinks()` wherever you need consistent brand URLs
 *  - To override at runtime (e.g., unit tests), use `overrideBrandLinks()`
 */

import { siteConfig, socialConfig } from '@/lib/config/site'
import { type BrandLinks } from '@/lib/email/types'

/**
 * Default brand links — pulled from centralized site config.
 * These act as fallbacks when no environment variable is provided.
 */
export const BRAND_DEFAULTS: BrandLinks = {
	websiteUrl: siteConfig.url,
	slackUrl: '',
	stravaUrl: socialConfig.strava,
	instagramUrl: socialConfig.instagram,
	twitterUrl: socialConfig.twitter,
}

/**
 * Resolve a URL-like env var if present and non-empty, otherwise return undefined.
 */
function readEnvUrl(name: string): string | undefined {
	const v = process.env[name]
	if (!v) return undefined
	const trimmed = v.trim()
	return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Build the effective brand links by mixing environment variables with defaults.
 * This is executed once at module load; use `overrideBrandLinks` for test-time mutations.
 */
function buildBrandLinks(): BrandLinks {
	return {
		websiteUrl:
			readEnvUrl('NEXT_PUBLIC_SITE_URL') ||
			readEnvUrl('NEXT_PUBLIC_WEBSITE_URL') ||
			BRAND_DEFAULTS.websiteUrl,
		slackUrl:
			readEnvUrl('NEXT_PUBLIC_SLACK_INVITE_URL') || BRAND_DEFAULTS.slackUrl,
		stravaUrl: readEnvUrl('NEXT_PUBLIC_STRAVA_URL') || BRAND_DEFAULTS.stravaUrl,
		instagramUrl:
			readEnvUrl('NEXT_PUBLIC_INSTAGRAM_URL') || BRAND_DEFAULTS.instagramUrl,
		twitterUrl:
			readEnvUrl('NEXT_PUBLIC_TWITTER_URL') || BRAND_DEFAULTS.twitterUrl,
	}
}

/**
 * Internal mutable reference to allow non-production overrides (e.g., tests).
 * In normal app operation this is initialized once and left unchanged.
 */
let BRAND_STATE: BrandLinks = buildBrandLinks()

/**
 * Get the effective brand links (resolved from env vars with defaults).
 */
export function getBrandLinks(): BrandLinks {
	return BRAND_STATE
}

/**
 * Get a single brand link value by key.
 */
export function getBrandValue<K extends keyof BrandLinks>(
	key: K,
): BrandLinks[K] {
	return BRAND_STATE[key]
}

/**
 * Override brand links at runtime (intended for tests or specialized runtime scenarios).
 * Only provided keys will be updated.
 */
export function overrideBrandLinks(patch: Partial<BrandLinks>): void {
	BRAND_STATE = { ...BRAND_STATE, ...patch }
}
