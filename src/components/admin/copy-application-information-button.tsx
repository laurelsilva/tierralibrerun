'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface CopyApplicationInformationButtonProps {
	text: string
	label?: string
	className?: string
}

async function writeToClipboard(text: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text)
		return
	}

	const textarea = document.createElement('textarea')
	textarea.value = text
	textarea.setAttribute('readonly', '')
	textarea.style.position = 'fixed'
	textarea.style.opacity = '0'
	textarea.style.pointerEvents = 'none'

	document.body.appendChild(textarea)
	textarea.focus()
	textarea.select()

	const copied = document.execCommand('copy')
	document.body.removeChild(textarea)

	if (!copied) {
		throw new Error('Clipboard copy failed')
	}
}

export function CopyApplicationInformationButton({
	text,
	label = 'Copy Application Information',
	className,
}: CopyApplicationInformationButtonProps) {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!copied) return

		const timeoutId = window.setTimeout(() => {
			setCopied(false)
		}, 2000)

		return () => window.clearTimeout(timeoutId)
	}, [copied])

	async function handleCopy() {
		try {
			await writeToClipboard(text)
			setCopied(true)
			toast.success('Application information copied')
		} catch (error) {
			console.error('Unable to copy application information:', error)
			toast.error('Unable to copy application information')
		}
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={handleCopy}
			className={className}
		>
			{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
			{copied ? 'Copied' : label}
		</Button>
	)
}
