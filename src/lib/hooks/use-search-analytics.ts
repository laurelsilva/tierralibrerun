'use client'

import {useEffect, useRef} from 'react'

interface SearchEvent {
	type: 'search' | 'filter_applied' | 'filter_cleared' | 'results_count'
	searchTerm?: string
	filterType?: string
	filterValue?: string
	resultsCount?: number
	timestamp: number
}

interface SearchAnalytics {
	trackSearch: (searchTerm: string, resultsCount: number) => void
	trackFilterApplied: (
		filterType: string,
		filterValue: string,
		resultsCount: number
	) => void
	trackFilterCleared: (filterType: string, resultsCount: number) => void
	trackAllFiltersCleared: (resultsCount: number) => void
}

export function useSearchAnalytics(): SearchAnalytics {
	const analyticsQueue = useRef<SearchEvent[]>([])
	const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined)

	const flushAnalytics = () => {
		if (analyticsQueue.current.length === 0) return
		analyticsQueue.current = []
	}

	const scheduleFlush = () => {
		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current)
		}

		debounceTimer.current = setTimeout(flushAnalytics, 2000)
	}

	const addEvent = (event: Omit<SearchEvent, 'timestamp'>) => {
		analyticsQueue.current.push({
			...event,
			timestamp: Date.now()
		})
		scheduleFlush()
	}

	const trackSearch = (searchTerm: string, resultsCount: number) => {
		addEvent({
			type: 'search',
			searchTerm: searchTerm.trim(),
			resultsCount
		})
	}

	const trackFilterApplied = (
		filterType: string,
		filterValue: string,
		resultsCount: number
	) => {
		addEvent({
			type: 'filter_applied',
			filterType,
			filterValue,
			resultsCount
		})
	}

	const trackFilterCleared = (filterType: string, resultsCount: number) => {
		addEvent({
			type: 'filter_cleared',
			filterType,
			resultsCount
		})
	}

	const trackAllFiltersCleared = (resultsCount: number) => {
		addEvent({
			type: 'filter_cleared',
			filterType: 'all',
			resultsCount
		})
	}

	useEffect(() => {
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current)
			}
			flushAnalytics()
		}
	}, [])

	return {
		trackSearch,
		trackFilterApplied,
		trackFilterCleared,
		trackAllFiltersCleared
	}
}

export function useSearchInsights() {
	const searchHistory = useRef<Map<string, number>>(new Map())
	const filterHistory = useRef<Map<string, number>>(new Map())

	const recordSearch = (searchTerm: string) => {
		if (!searchTerm.trim()) return

		const normalized = searchTerm.toLowerCase().trim()
		const current = searchHistory.current.get(normalized) || 0
		searchHistory.current.set(normalized, current + 1)
	}

	const recordFilter = (filterType: string, filterValue: string) => {
		const key = `${filterType}:${filterValue}`
		const current = filterHistory.current.get(key) || 0
		filterHistory.current.set(key, current + 1)
	}

	const getPopularSearches = (limit = 5) => {
		return Array.from(searchHistory.current.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([term, count]) => ({term, count}))
	}

	const getPopularFilters = (limit = 5) => {
		return Array.from(filterHistory.current.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([filter, count]) => {
				const [type, value] = filter.split(':')
				return {type, value, count}
			})
	}

	return {
		recordSearch,
		recordFilter,
		getPopularSearches,
		getPopularFilters
	}
}
