'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
	useAdminReadOnly,
	adminDisabledProps,
} from '@/components/admin/admin-mode'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { updateFundApplicationRace } from '@/server/actions/admin'

interface RaceOptionItem {
	value: string
	label: string
}

interface UpdateFundApplicationRaceFormProps {
	applicationId: string
	currentRace: string
	raceOptions: RaceOptionItem[]
}

export function UpdateFundApplicationRaceForm({
	applicationId,
	currentRace,
	raceOptions,
}: UpdateFundApplicationRaceFormProps) {
	const router = useRouter()
	const readOnly = useAdminReadOnly()
	const disabledMeta = adminDisabledProps(
		readOnly,
		'Read-only mode: changes are disabled',
	)

	const normalizedOptions = useMemo(() => {
		const seen = new Set<string>()
		const out: RaceOptionItem[] = []
		for (const opt of raceOptions) {
			if (!opt?.value || seen.has(opt.value)) continue
			seen.add(opt.value)
			out.push(opt)
		}
		return out
	}, [raceOptions])

	const [race, setRace] = useState(currentRace)
	const [isSaving, setIsSaving] = useState(false)

	const handleSubmit = async () => {
		if (readOnly) {
			toast.error('Read-only mode: changes are disabled.')
			return
		}
		if (!race) {
			toast.error('Select a race')
			return
		}
		if (race === currentRace) {
			toast.info('No race change')
			return
		}

		setIsSaving(true)
		try {
			const result = await updateFundApplicationRace(applicationId, race)
			if (!result.success) {
				toast.error(result.error || 'Unable to update race')
				return
			}

			toast.success('Race updated')
			router.refresh()
		} catch (error) {
			console.error('Error updating race:', error)
			toast.error('Unable to update race')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<Select
				value={race}
				onValueChange={setRace}
				disabled={isSaving || !!disabledMeta.disabled}
			>
				<SelectTrigger>
					<SelectValue placeholder="Choose race" />
				</SelectTrigger>
				<SelectContent>
					{normalizedOptions.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<div>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={handleSubmit}
					disabled={isSaving || race === currentRace || !!disabledMeta.disabled}
					title={disabledMeta.title}
				>
					{isSaving ? 'Saving...' : 'Save Race'}
				</Button>
			</div>
		</div>
	)
}
