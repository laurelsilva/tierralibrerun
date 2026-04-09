type SearchParamSource =
	| URLSearchParams
	| Record<string, string | string[] | null | undefined>

export const ONBOARDING_PATH = '/onboarding'
export const ONBOARDING_RETURN_PARAM = 'next'
export const NEW_USER_PATH = '/new-user'
const LEGACY_ONBOARDING_RETURN_PARAM = 'redirect_url'

export function normalizeInternalPath(path?: string | null) {
	if (!path) return undefined

	const trimmed = path.trim()
	if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
		return undefined
	}

	return trimmed
}

function readSearchParam(
	searchParams: SearchParamSource,
	key: string,
): string | undefined {
	if (searchParams instanceof URLSearchParams) {
		return searchParams.get(key) ?? undefined
	}

	const value = searchParams[key]
	if (typeof value === 'string') return value
	if (Array.isArray(value)) return value[0]
	return undefined
}

export function resolveOnboardingReturnTarget(searchParams: SearchParamSource) {
	return normalizeInternalPath(
		readSearchParam(searchParams, ONBOARDING_RETURN_PARAM) ??
			readSearchParam(searchParams, LEGACY_ONBOARDING_RETURN_PARAM),
	)
}

export function buildOnboardingPath(next?: string) {
	const safeNext = normalizeInternalPath(next)
	if (!safeNext) return ONBOARDING_PATH

	return `${ONBOARDING_PATH}?${ONBOARDING_RETURN_PARAM}=${encodeURIComponent(safeNext)}`
}

export function buildNewUserPath(next?: string) {
	const safeNext = normalizeInternalPath(next)
	if (!safeNext) return NEW_USER_PATH

	return `${NEW_USER_PATH}?${ONBOARDING_RETURN_PARAM}=${encodeURIComponent(safeNext)}`
}

export function buildPostSignUpPath(target?: string) {
	const safeTarget = normalizeInternalPath(target)
	if (!safeTarget) return NEW_USER_PATH

	if (
		safeTarget === NEW_USER_PATH ||
		safeTarget.startsWith(`${NEW_USER_PATH}?`)
	) {
		return safeTarget
	}

	if (
		safeTarget === ONBOARDING_PATH ||
		safeTarget.startsWith(`${ONBOARDING_PATH}?`)
	) {
		const url = new URL(safeTarget, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
		return buildNewUserPath(resolveOnboardingReturnTarget(url.searchParams))
	}

	return buildNewUserPath(safeTarget)
}
