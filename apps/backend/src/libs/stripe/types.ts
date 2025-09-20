import type { SubscriptionStatus } from '../generated/prisma'

export interface CheckoutSessionRequest {
	priceId?: string
	successUrl?: string
	cancelUrl?: string
}

export interface CustomerPortalRequest {
	returnUrl?: string
}

export interface SubscriptionStatusResponse {
	hasActiveSubscription: boolean
	status: SubscriptionStatus | null
	currentPeriodEnd: Date | null
	cancelAtPeriodEnd: boolean
}

export interface StripeWebhookEvent {
	id: string
	type: string
	data: {
		object: Record<string, unknown>
	}
}