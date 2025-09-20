import { backend } from '@web/services/backend-api'

export interface SubscriptionStatusResponse {
	hasActiveSubscription: boolean
	status:
		| 'active'
		| 'canceled'
		| 'incomplete'
		| 'incomplete_expired'
		| 'past_due'
		| 'trialing'
		| 'unpaid'
		| 'paused'
		| null
	currentPeriodEnd: Date | null
	cancelAtPeriodEnd: boolean
}

export interface CreateCheckoutRequest {
	planType: 'monthly' | 'yearly'
	successUrl?: string
	cancelUrl?: string
}

export interface CheckoutResponse {
	url: string | null
}

export interface CustomerPortalRequest {
	returnUrl?: string
}

export interface CustomerPortalResponse {
	url: string
}

export const billingService = {
	async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
		const response = await backend.api.v1.stripe.subscriptionStatus.get()
		if (response.error) {
			throw new Error('Failed to get subscription status')
		}
		return response.data
	},

	async createCheckoutSession(request: CreateCheckoutRequest): Promise<CheckoutResponse> {
		const response = await backend.api.v1.stripe.createCheckout.post(request)
		if (response.error) {
			throw new Error('Failed to create checkout session')
		}
		if (!response.data.url) {
			throw new Error('Checkout session URL is null')
		}
		return response.data
	},

	async getCustomerPortal(request: CustomerPortalRequest = {}): Promise<CustomerPortalResponse> {
		const response = await backend.api.v1.stripe.customerPortal.post(request)
		if (response.error) {
			throw new Error('Failed to get customer portal')
		}
		return response.data
	}
}
