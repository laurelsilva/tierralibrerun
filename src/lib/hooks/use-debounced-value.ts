import {useState, useEffect} from 'react'

export function useDebouncedValue<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

export function useDebounce(
	callback: () => void,
	delay: number,
	deps: React.DependencyList
) {
	useEffect(() => {
		const handler = setTimeout(() => {
			callback()
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [callback, delay, deps])
}
