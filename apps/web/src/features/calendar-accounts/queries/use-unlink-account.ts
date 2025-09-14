import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unlinkGoogleAccount } from '@web/libs/auth'

export function useUnlinkAccount() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: unlinkGoogleAccount,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['calendar-accounts'] })
		}
	})
}
