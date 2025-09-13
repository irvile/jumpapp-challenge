import { useQuery } from '@tanstack/react-query'
import type { dayjs } from '@web/libs/dayjs'
import { backend } from '@web/services/backend-api'

type GetCalendarEventsParams = {
	calendarAccountId: string
	startDate: string
	endDate: string
}

async function getCalendarEvents({ calendarAccountId, startDate, endDate }: GetCalendarEventsParams) {
	const response = await backend.api.v1.calendars({ calendarAccountId }).events.get({
		query: {
			startDate,
			endDate
		}
	})
	console.log('response', response)

	if (response.error) {
		return { events: [] }
	}

	return response.data || { events: [] }
}

export type CalendarEventListItem = Awaited<ReturnType<typeof getCalendarEvents>>

export function useCalendarEvents(calendarAccountId: string | undefined, currentWeek: dayjs.Dayjs) {
	const startDate = currentWeek.startOf('day').toISOString()
	const endDate = currentWeek.add(6, 'day').endOf('day').toISOString()

	return useQuery({
		queryKey: ['calendar-events', calendarAccountId, startDate, endDate],
		queryFn: async () => {
			if (!calendarAccountId) {
				return { events: [] }
			}

			const data = await getCalendarEvents({ calendarAccountId, startDate, endDate })

			return data
		},
		enabled: !!calendarAccountId
	})
}
