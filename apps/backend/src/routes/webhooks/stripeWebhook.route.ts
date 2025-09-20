import { db } from '@backend/libs/db'
import { envs } from '@backend/libs/envs'
import { stripe } from '@backend/libs/stripe/stripe'
import { SubscriptionService } from '@backend/services/subscription.service'
import Elysia, { status } from 'elysia'
import type Stripe from 'stripe'

export const stripeWebhookRoute = new Elysia().post(
	'/stripe',
	async ({ request }) => {
		const sig = request.headers.get('stripe-signature')

		if (!sig) {
			console.error('Missing stripe signature')
			return status(400, { received: false, error: 'Missing signature' })
		}

		let event: Stripe.Event

		try {
			const body = await request.arrayBuffer()
			const buffer = Buffer.from(body)
			event = await stripe.webhooks.constructEventAsync(buffer, sig, envs.STRIPE_WEBHOOK_SECRET)
		} catch (err) {
			console.error('Webhook signature verification failed:', err)
			return status(400, { received: false, error: 'Invalid signature' })
		}

		const existingEvent = await db.webhookEvent.findUnique({
			where: { eventId: event.id }
		})

		if (existingEvent) {
			console.log(`Event ${event.id} already processed`)
			return { duplicate: true }
		}

		await db.webhookEvent.create({
			data: {
				eventId: event.id,
				eventType: event.type,
				processed: false
			}
		})
		try {
			console.log('Processing event', event.type)
			switch (event.type) {
				case 'customer.subscription.created':
				case 'customer.subscription.updated': {
					const subscription = event.data.object as Stripe.Subscription
					const customerId = subscription.customer as string

					await SubscriptionService.createOrUpdateSubscription({
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: customerId,
						status: subscription.status,
						currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
						currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
						canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
						priceId: subscription.items.data[0]?.price?.id || '',
						productId: (subscription.items.data[0]?.price?.product as string) || '',
						metadata: subscription.metadata
					})
					break
				}

				case 'customer.subscription.deleted': {
					const subscription = event.data.object as Stripe.Subscription

					await SubscriptionService.createOrUpdateSubscription({
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: subscription.customer as string,
						status: 'canceled',
						currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
						currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
						cancelAtPeriodEnd: true,
						canceledAt: new Date(),
						priceId: subscription.items.data[0]?.price?.id || '',
						productId: (subscription.items.data[0]?.price?.product as string) || '',
						metadata: subscription.metadata
					})
					break
				}

				case 'customer.subscription.trial_will_end': {
					const subscription = event.data.object as Stripe.Subscription

					await SubscriptionService.createOrUpdateSubscription({
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: subscription.customer as string,
						status: subscription.status,
						currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
						currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
						canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
						priceId: subscription.items.data[0]?.price?.id || '',
						productId: (subscription.items.data[0]?.price?.product as string) || '',
						metadata: subscription.metadata
					})
					break
				}
				case 'invoice.payment_succeeded': {
					const invoice = event.data.object as Stripe.Invoice

					if (invoice.parent?.type === 'subscription_details' && invoice.parent.subscription_details?.subscription) {
						const subscriptionId = invoice.parent.subscription_details?.subscription as string
						const subscription = await stripe.subscriptions.retrieve(subscriptionId)

						await SubscriptionService.createOrUpdateSubscription({
							stripeSubscriptionId: subscription.id,
							stripeCustomerId: subscription.customer as string,
							status: subscription.status,
							currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
							currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
							priceId: subscription.items.data[0]?.price?.id || '',
							productId: (subscription.items.data[0]?.price?.product as string) || '',
							metadata: subscription.metadata
						})
					} else {
						console.log('Invoice payment succeeded but no subscription details found')
					}

					break
				}

				default:
					console.log(`Unhandled event type ${(event as { type: string }).type}`)
			}

			await db.webhookEvent.update({
				where: { eventId: event.id },
				data: { processed: true }
			})

			return { received: true }
		} catch (error) {
			console.error('Error processing webhook:', error)
			return status(500, { error: 'Processing failed' })
		}
	},
	{
		parse: 'none'
	}
)
