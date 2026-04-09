import { Resend } from 'resend'
import { emailConfig } from '@/lib/config/site'
import { env } from '@/lib/env'

// Get Resend API key - will be initialized per request
function getResendClient() {
	const apiKey = env.RESEND_API_KEY
	return new Resend(apiKey)
}

export interface SendEmailOptions {
	to: string | string[]
	subject: string
	html: string
	from?: string
	replyTo?: string
	cc?: string | string[]
	bcc?: string | string[]
}

const RESEND_DEFAULT_AUDIENCE_ID = '885955fd-ef75-458e-9015-f61d1cbe97ec'
const RESEND_MENTOR_AUDIENCE_ID = env.RESEND_MENTOR_AUDIENCE_ID

class ResendService {
	private fromEmail = emailConfig.fromAddress

	/**
	 * Add or update a contact in Resend for newsletter subscriptions
	 */
	private async upsertContactToAudience(
		audienceId: string,
		email: string,
		firstName?: string,
		lastName?: string,
	) {
		const sleep = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms))
		const resend = getResendClient()
		const normalizedEmail = email.trim().toLowerCase()
		const normalizedFirstName = firstName?.trim() || undefined
		const normalizedLastName = lastName?.trim() || undefined

		const isRateLimit = (err: any) => err?.name === 'rate_limit_exceeded'
		const isNotFound = (err: any) => err?.name === 'not_found'
		const withRetry = async <T>(
			label: 'create' | 'update',
			fn: () => Promise<{ data?: T; error?: any }>,
		) => {
			for (let attempt = 0; attempt < 3; attempt++) {
				const { data, error } = await fn()
				if (!error) return { data }
				if (isRateLimit(error) && attempt < 2) {
					await sleep(600 * (attempt + 1))
					continue
				}
				return { error }
			}
			return { error: new Error(`${label} failed after retries`) }
		}

		const payload = {
			audienceId,
			email: normalizedEmail,
			firstName: normalizedFirstName,
			lastName: normalizedLastName,
			unsubscribed: false,
		}

		const createResult = await withRetry('create', () =>
			resend.contacts.create(payload),
		)
		if (!createResult.error) {
			return {
				success: true,
				action: 'created' as const,
				data: createResult.data,
			}
		}

		const updateResult = await withRetry('update', () =>
			resend.contacts.update(payload),
		)
		if (!updateResult.error) {
			return {
				success: true,
				action: 'updated' as const,
				data: updateResult.data,
			}
		}

		// If update says not found, try one more create (might have been a false duplicate error)
		if (isNotFound(updateResult.error)) {
			const fallbackCreate = await withRetry('create', () =>
				resend.contacts.create(payload),
			)
			if (!fallbackCreate.error) {
				return {
					success: true,
					action: 'created' as const,
					data: fallbackCreate.data,
				}
			}
		}

		const cause =
			createResult.error instanceof Error
				? createResult.error
				: new Error(String(createResult.error))
		throw Object.assign(new Error('Resend contact upsert failed'), {
			cause,
			error: updateResult.error ?? createResult.error,
			email: normalizedEmail,
		})
	}

	async upsertContact(email: string, firstName?: string, lastName?: string) {
		return this.upsertContactToAudience(
			RESEND_DEFAULT_AUDIENCE_ID,
			email,
			firstName,
			lastName,
		)
	}

	async upsertMentorContact(
		email: string,
		firstName?: string,
		lastName?: string,
	) {
		// Ensure mentors live in both the general audience and the mentor audience
		await this.upsertContactToAudience(
			RESEND_DEFAULT_AUDIENCE_ID,
			email,
			firstName,
			lastName,
		)
		return this.upsertContactToAudience(
			RESEND_MENTOR_AUDIENCE_ID,
			email,
			firstName,
			lastName,
		)
	}

	/**
	 * Unsubscribe a contact by email (soft unsubscribe instead of delete)
	 */
	async unsubscribeContact(email: string) {
		const resend = getResendClient()
		const { error } = await resend.contacts.update({
			email: email.trim().toLowerCase(),
			unsubscribed: true,
		})
		if (error) throw error
		return { success: true }
	}

	/**
	 * Send a generic email
	 */
	async sendEmail(options: SendEmailOptions) {
		try {
			// Get fresh Resend client with current env vars
			const resend = getResendClient()

			// Use verified domain for sending emails
			const from = options.from || this.fromEmail
			const to = options.to
			const subject = options.subject
			const html = options.html

			console.log('[Resend] Sending email:', {
				from,
				to,
				subject,
				apiKeyConfigured: true,
			})

			const defaultBcc = this.fromEmail
			const normalizeList = (v: string | string[] | undefined) => {
				if (!v) return []
				return (Array.isArray(v) ? v : [v])
					.map((s) => String(s).trim())
					.filter(Boolean)
			}
			const unique = (arr: string[]) => Array.from(new Set(arr))
			const cc = unique(normalizeList(options.cc))
			const bcc = unique([defaultBcc, ...normalizeList(options.bcc)])

			const result = await resend.emails.send({
				from,
				to,
				subject,
				html,
				replyTo: options.replyTo || emailConfig.replyToAddress,
				cc: cc.length ? cc : undefined,
				bcc: bcc.length ? bcc : undefined,
			})

			console.log('[Resend] Email sent successfully:', {
				id: result?.data?.id || 'NO_ID',
				fullResult: result,
				to: options.to,
				subject: options.subject,
				from,
			})

			if (!result?.data?.id) {
				throw new Error('Email send failed - no ID returned from Resend')
			}

			return { success: true, data: result.data, id: result.data.id }
		} catch (error) {
			console.error('[Resend] Failed to send email:', {
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
				to: options.to,
				subject: options.subject,
			})
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to send email',
			}
		}
	}

	/**
	 * Send batch emails using Resend's batch API.
	 * Chunks into groups of 100 (Resend's per-request limit).
	 * Reuses rate-limit retry logic.
	 */
	async sendBatchEmails(
		emails: Array<{ to: string; subject: string; html: string }>,
	): Promise<{ sent: number; failed: number; errors: string[] }> {
		if (emails.length === 0) {
			return { sent: 0, failed: 0, errors: [] }
		}

		const resend = getResendClient()
		const CHUNK_SIZE = 100
		let sent = 0
		let failed = 0
		const errors: string[] = []

		// Chunk into batches of 100
		for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
			const chunk = emails.slice(i, i + CHUNK_SIZE)
			const payload = chunk.map((e) => ({
				from: this.fromEmail,
				to: e.to,
				subject: e.subject,
				html: e.html,
				replyTo: emailConfig.replyToAddress,
			}))

			// Retry with backoff for rate limits
			let success = false
			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					const { error } = await resend.batch.send(payload)
					if (error) {
						const isRateLimit =
							(error as { name?: string }).name === 'rate_limit_exceeded'
						if (isRateLimit && attempt < 2) {
							await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
							continue
						}
						failed += chunk.length
						errors.push(
							`Batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${error.message || 'Unknown error'}`,
						)
						break
					}
					sent += chunk.length
					success = true
					break
				} catch (err) {
					if (attempt < 2) {
						await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
						continue
					}
					failed += chunk.length
					errors.push(
						`Batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`,
					)
				}
			}

			// Small delay between chunks to be kind to rate limits
			if (success && i + CHUNK_SIZE < emails.length) {
				await new Promise((r) => setTimeout(r, 200))
			}
		}

		return { sent, failed, errors }
	}
}

// Export singleton instance
export const resendService = new ResendService()
