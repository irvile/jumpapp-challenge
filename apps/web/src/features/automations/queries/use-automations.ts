import { useQuery } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

async function getAutomations() {
	const response = await backend.api.v1.automations.get()

	if (response.error) {
		throw new Error('Failed to fetch automations')
	}

	return response.data
}

export type AutomationListItem = Awaited<ReturnType<typeof getAutomations>>[number]

export function useAutomations() {
	return useQuery({
		queryKey: ['automations'],
		queryFn: getAutomations
	})
}
