import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

export function useBotToggle(googleAccountId: string, eventId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (enabled: boolean) => {
			const response = await backend.api.v1
				.calendars({ calendarAccountId: googleAccountId })
				.events({ eventId })
				.bot.put({
					enabled
				})

			if (response.error) {
				throw new Error(response.error.value || 'Failed to toggle bot')
			}

			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
			queryClient.invalidateQueries({ queryKey: ['meeting-details'] })
		}
	})
}