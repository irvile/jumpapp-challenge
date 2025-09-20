/* biome-ignore lint/suspicious/noExplicitAny: Stripe webhook events require any type */
import { Elysia } from 'elysia'
import { stripe } from '../../libs/stripe'
import { envs } from '../../libs/envs'
import { SubscriptionService } from '../../services/subscription.service'
import type { SubscriptionStatus } from '../../libs/generated/prisma'

const mapStripeStatusToLocal = (stripeStatus: string): SubscriptionStatus => {
	switch (stripeStatus) {
		case 'active':
			return 'ACTIVE'
		case 'canceled':
			return 'CANCELED'
		case 'incomplete':
			return 'INCOMPLETE'
		case 'incomplete_expired':
			return 'INCOMPLETE_EXPIRED'
		case 'past_due':
			return 'PAST_DUE'
		case 'trialing':
			return 'TRIALING'
		case 'unpaid':
			return 'UNPAID'
		default:
			return 'CANCELED'
	}
}

export const stripeWebhookRoute = new Elysia().post('/stripe', async ({ body, headers }) => {
	const sig = headers['stripe-signature']

	if (!sig) {
		throw new Error('Missing stripe signature')
	}

	let event: unknown
	try {
		event = stripe.webhooks.constructEvent(body as string, sig, envs.STRIPE_WEBHOOK_SECRET)
	} catch (err) {
		console.error('Webhook signature verification failed:', err)
		throw new Error('Invalid signature')
	}

	try {
		switch ((event as { type: string }).type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const subscription = (event as any).data.object

				await SubscriptionService.createOrUpdateSubscription({
					stripeSubscriptionId: subscription.id,
					stripeCustomerId: subscription.customer,
					status: mapStripeStatusToLocal(subscription.status),
					currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
					currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
					cancelAtPeriodEnd: subscription.cancel_at_period_end,
					canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
					priceId: subscription.items.data[0]?.price?.id || '',
					productId: (subscription as any).items.data[0]?.price?.product || '',
					metadata: subscription.metadata
				})
				break
			}

			case 'customer.subscription.deleted': {
				const subscription = (event as any).data.object
				
				await SubscriptionService.createOrUpdateSubscription({
					stripeSubscriptionId: subscription.id,
					stripeCustomerId: subscription.customer,
					status: 'CANCELED',
					currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
					currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
					cancelAtPeriodEnd: true,
					canceledAt: new Date(),
					priceId: subscription.items.data[0]?.price?.id || '',
					productId: (subscription as any).items.data[0]?.price?.product || '',
					metadata: subscription.metadata
				})
				break
			}

			case 'invoice.payment_succeeded': {
				const invoice = (event as any).data.object
				
				if (invoice.subscription) {
					const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
					
					await SubscriptionService.createOrUpdateSubscription({
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: subscription.customer as string,
						status: mapStripeStatusToLocal(subscription.status),
						currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
						currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
						canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
						priceId: subscription.items.data[0]?.price?.id || '',
						productId: (subscription as any).items.data[0]?.price?.product || '',
						metadata: subscription.metadata
					})
				}
				break
			}

			case 'invoice.payment_failed': {
				const invoice = (event as any).data.object
				
				if (invoice.subscription) {
					const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
					
					await SubscriptionService.createOrUpdateSubscription({
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: subscription.customer as string,
						status: mapStripeStatusToLocal(subscription.status),
						currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
						currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
						canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
						priceId: subscription.items.data[0]?.price?.id || '',
						productId: (subscription as any).items.data[0]?.price?.product || '',
						metadata: subscription.metadata
					})
				}
				break
			}

			default:
				console.log(`Unhandled event type ${(event as { type: string }).type}`)
		}

		return { received: true }
	} catch (error) {
		console.error('Error processing webhook:', error)
		throw new Error('Webhook processing failed')
	}
})