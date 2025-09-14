import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dayjs } from '@web/libs/dayjs'
import { backend } from '@web/services/backend-api'
import { useEffect, useMemo, useRef } from 'react'

interface CalendarEvent {
	id: string
	hasBot: boolean
	botStatus: string | null
	startTime: string
}

export function useMultipleBotPolling(events: CalendarEvent[], calendarAccountId?: string) {
	const queryClient = useQueryClient()

	const needsPolling = useMemo(() => {
		if (!events || !calendarAccountId) return []

		return events.filter((event) => {
			if (!event.hasBot) return false
			if (event.botStatus === 'COMPLETED') return false

			const eventTime = dayjs(event.startTime)
			const now = dayjs()
			const hoursSinceStart = now.diff(eventTime, 'hours')

			return hoursSinceStart >= 0 && hoursSinceStart <= 4
		})
	}, [events, calendarAccountId])

	const query = useQuery({
		queryKey: ['multiple-bot-status', needsPolling.map((e) => e.id), calendarAccountId],
		queryFn: async () => {
			if (!calendarAccountId) return []

			const promises = needsPolling.map(async (event) => {
				try {
					const response = await backend.api.v1
						.calendars({ calendarAccountId })
						.events({ eventId: event.id })
						.bot.status.get()

					return {
						eventId: event.id,
						status: response.data?.bot?.status || null,
						success: !response.error
					}
				} catch {
					return {
						eventId: event.id,
						status: null,
						success: false
					}
				}
			})

			return Promise.all(promises)
		},
		enabled: needsPolling.length > 0 && !!calendarAccountId,
		refetchInterval: 15000,
		refetchIntervalInBackground: false
	})

	const previousStatusRef = useRef<string>('')

	useEffect(() => {
		if (query.data) {
			const currentStatus = query.data
				.map((d) => `${d.eventId}:${d.status}`)
				.sort()
				.join('|')

			if (previousStatusRef.current !== currentStatus && previousStatusRef.current !== '') {
				queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
			}

			previousStatusRef.current = currentStatus
		}
	}, [query.data, queryClient])

	return query
}
