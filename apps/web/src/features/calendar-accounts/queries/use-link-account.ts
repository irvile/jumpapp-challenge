import { useMutation, useQueryClient } from '@tanstack/react-query'
import { linkGoogleAccount } from '@web/libs/auth'

export function useLinkAccount() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: linkGoogleAccount,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['calendar-accounts'] })
		}
	})
}
