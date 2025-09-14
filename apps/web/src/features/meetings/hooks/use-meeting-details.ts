import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dayjs } from '@web/libs/dayjs'
import { backend } from '@web/services/backend-api'
import { useCalendarAccounts } from '../../calendar-accounts/queries/use-calendar-accounts'
import type { CalendarEventListItem } from '../../calendar-accounts/queries/use-calendar-events'

async function findEventInCache(queryClient: any, eventId: string): Promise<CalendarEventListItem['events'][0] | null> {
	const queryCache = queryClient.getQueryCache()
	const queries = queryCache.findAll({ queryKey: ['calendar-events'] })

	for (const query of queries) {
		if (query.state.data?.events) {
			const event = query.state.data.events.find((e: any) => e.id === eventId)
			if (event) return event
		}
	}
	return null
}

export function useMeetingDetails(id: string) {
	const queryClient = useQueryClient()
	const { data: calendarAccounts } = useCalendarAccounts()

	return useQuery({
		queryKey: ['meeting-details', id],
		queryFn: async () => {
			const cachedEvent = await findEventInCache(queryClient, id)
			if (cachedEvent) {
				return cachedEvent
			}

			if (!calendarAccounts?.length) {
				throw new Error('No calendar accounts found')
			}

			const today = dayjs()
			const startDate = today.subtract(30, 'days').startOf('day').toISOString()
			const endDate = today.add(30, 'days').endOf('day').toISOString()

			for (const account of calendarAccounts) {
				try {
					const response = await backend.api.v1.calendars({ calendarAccountId: account.id }).events.get({
						query: { startDate, endDate }
					})

					if (response.data?.events) {
						const event = response.data.events.find((e: any) => e.id === id)
						if (event) return event
					}
				} catch (error) {
					console.warn(`Failed to fetch events for account ${account.id}:`, error)
				}
			}

			throw new Error('Meeting not found')
		},
		enabled: !!id,
		retry: 1
	})
}