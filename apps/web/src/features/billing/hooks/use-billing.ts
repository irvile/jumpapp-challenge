import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateCheckoutRequest, CustomerPortalRequest } from '@web/features/billing/billing.service'
import { billingService } from '@web/features/billing/billing.service'

export function useBillingStatus() {
	return useQuery({
		queryKey: ['billing', 'status'],
		queryFn: () => billingService.getSubscriptionStatus(),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true
	})
}

export function useCreateCheckout() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (request: CreateCheckoutRequest) => billingService.createCheckoutSession(request),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['billing', 'status'] })
		}
	})
}

export function useCustomerPortal() {
	return useMutation({
		mutationFn: (request: CustomerPortalRequest) => billingService.getCustomerPortal(request)
	})
}
