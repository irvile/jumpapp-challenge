import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

async function getUserSettings() {
	const response = await backend.api.v1.users.settings.get()

	if (response.error) {
		return null
	}

	return response.data
}

export type UserSettings = Awaited<ReturnType<typeof getUserSettings>>

export function useUserSettings() {
	return useQuery({
		queryKey: ['user-settings'],
		queryFn: getUserSettings
	})
}

type UpdateSettingsParams = {
	joinMinutesBefore?: number
	botName?: string
}

export function useUpdateUserSettings() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (updates: UpdateSettingsParams) => {
			const response = await backend.api.v1.users.settings.put(updates)

			if (response.error) {
				return null
			}

			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['user-settings'] })
		}
	})
}
