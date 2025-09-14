import { useQuery } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

export function useCalendarAccounts() {
	return useQuery({
		queryKey: ['calendar-accounts'],
		queryFn: async () => {
			const response = await backend.api.v1.auth.linkedAccounts.get()

			if (response.error) {
				throw new Error('Failed to fetch calendar accounts')
			}

			return response.data?.accounts || []
		}
	})
}
