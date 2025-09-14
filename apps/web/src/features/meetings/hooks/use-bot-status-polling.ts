import { useQuery } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

export function useBotStatusPolling(calendarAccountId: string, eventId: string, shouldPoll: boolean) {
	return useQuery({
		queryKey: ['bot-status', calendarAccountId, eventId],
		queryFn: async () => {
			const response = await backend.api.v1.calendars({ calendarAccountId }).events({ eventId }).bot.status.get()

			if (response.error) {
				throw new Error('Failed to get bot status')
			}

			return response.data
		},
		enabled: shouldPoll,
		refetchInterval: 10000,
		refetchIntervalInBackground: false
	})
}
