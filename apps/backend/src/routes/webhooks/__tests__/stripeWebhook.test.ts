import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { db } from '@backend/libs/db'
import { apiTest, testFactory } from '@backend/libs/test-utils'

const mockEvent = {
	id: 'evt_created_123',
	type: 'customer.subscription.updated',
	data: {
		object: {
			id: 'sub_test123',
			customer: 'cus_test123',
			status: 'trialing',
			current_period_start: 1700000000,
			current_period_end: 1702592000,
			cancel_at_period_end: false,
			canceled_at: null,
			items: {
				data: [
					{
						price: {
							id: 'price_test123',
							product: 'prod_test123'
						}
					}
				]
			},
			metadata: {}
		}
	}
}

const mockConstructEventFn = mock()
const mockRetrieveFn = mock()

mock.module('@backend/libs/stripe', () => ({
	stripe: {
		webhooks: {
			constructEvent: mockConstructEventFn
		},
		subscriptions: {
			retrieve: mockRetrieveFn
		}
	}
}))

describe('POST /api/v1/webhooks/stripe', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
		mockConstructEventFn.mockClear()
		mockRetrieveFn.mockClear()
	})

	test('should process subscription created event successfully', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory
			.createStripeCustomer({
				userId: user.user.id,
				stripeCustomerId: 'cus_test123'
			})
			.save()

		mockConstructEventFn.mockReturnValue({
			...mockEvent,
			id: 'evt_created_123',
			type: 'customer.subscription.created'
		})

		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload', {
			headers: {
				'stripe-signature': 'valid_signature'
			}
		})

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ received: true })

		const subscription = await db.subscription.findUnique({
			where: { stripeSubscriptionId: 'sub_test123' }
		})

		expect(subscription).toBeDefined()
		expect(subscription?.status).toBe('active')
		expect(subscription?.stripeCustomerId).toBe(stripeCustomer.stripeCustomer.id)
	})

	test('should process subscription updated event successfully', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory
			.createStripeCustomer({
				userId: user.user.id,
				stripeCustomerId: 'cus_test123'
			})
			.save()

		await testFactory
			.createSubscription({
				stripeCustomerId: stripeCustomer.stripeCustomer.id,
				stripeSubscriptionId: 'sub_test123',
				status: 'trialing',
				currentPeriodStart: new Date(),
				currentPeriodEnd: new Date(),
				priceId: 'price_old123',
				productId: 'prod_old123'
			})
			.save()

		mockConstructEventFn.mockReturnValue({
			...mockEvent,
			id: 'evt_updated_123'
		})

		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload', {
			headers: {
				'stripe-signature': 'valid_signature'
			}
		})

		expect(response.status).toBe(200)

		const subscription = await db.subscription.findUnique({
			where: { stripeSubscriptionId: 'sub_test123' }
		})

		expect(subscription?.status).toBe('trialing')
		expect(subscription?.priceId).toBe('price_test123')
	})

	test('should process subscription deleted event successfully', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory
			.createStripeCustomer({
				userId: user.user.id,
				stripeCustomerId: 'cus_test123'
			})
			.save()

		await testFactory
			.createSubscription({
				stripeCustomerId: stripeCustomer.stripeCustomer.id,
				stripeSubscriptionId: 'sub_test123',
				status: 'active',
				currentPeriodStart: new Date(),
				currentPeriodEnd: new Date(),
				priceId: 'price_test123',
				productId: 'prod_test123'
			})
			.save()

		mockConstructEventFn.mockReturnValue({
			...mockEvent,
			id: 'evt_deleted_123',
			type: 'customer.subscription.deleted'
		})

		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload', {
			headers: {
				'stripe-signature': 'valid_signature'
			}
		})

		expect(response.status).toBe(200)

		const subscription = await db.subscription.findUnique({
			where: { stripeSubscriptionId: 'sub_test123' }
		})

		expect(subscription?.status).toBe('canceled')
		expect(subscription?.cancelAtPeriodEnd).toBe(true)
		expect(subscription?.canceledAt).toBeDefined()
	})

	test('should process invoice payment succeeded event', async () => {
		const user = await testFactory.createUser().save()
		const _stripeCustomer = await testFactory
			.createStripeCustomer({
				userId: user.user.id,
				stripeCustomerId: 'cus_test123'
			})
			.save()

		mockConstructEventFn.mockReturnValue({
			id: 'evt_invoice_123',
			type: 'invoice.payment_succeeded',
			data: {
				object: {
					subscription: 'sub_test123'
				}
			}
		})

		mockRetrieveFn.mockResolvedValue({
			id: 'sub_test123',
			customer: 'cus_test123',
			status: 'active',
			current_period_start: 1700000000,
			current_period_end: 1702592000,
			cancel_at_period_end: false,
			canceled_at: null,
			items: {
				data: [
					{
						price: {
							id: 'price_test123',
							product: 'prod_test123'
						}
					}
				]
			},
			metadata: {}
		})

		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload', {
			headers: {
				'stripe-signature': 'valid_signature'
			}
		})

		expect(response.status).toBe(200)
		expect(mockRetrieveFn).toHaveBeenCalledWith('sub_test123')
	})

	test('should return 400 when stripe signature is missing', async () => {
		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload')

		expect(response.status).toBe(400)
		expect(response.error).toBeDefined()
	})

	test('should return 400 when stripe signature is invalid', async () => {
		mockConstructEventFn.mockImplementation(() => {
			throw new Error('Invalid signature')
		})

		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload', {
			headers: {
				'stripe-signature': 'invalid_signature'
			}
		})

		expect(response.status).toBe(400)
		expect(response.error).toBeDefined()
	})

	test('should handle unhandled event types', async () => {
		mockConstructEventFn.mockReturnValue({
			id: 'evt_unhandled_123',
			type: 'customer.created',
			data: {
				object: {}
			}
		})

		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload', {
			headers: {
				'stripe-signature': 'valid_signature'
			}
		})

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ received: true })
	})

	test('should return 200 when customer not found but webhook processed', async () => {
		mockConstructEventFn.mockReturnValue({
			...mockEvent,
			id: 'evt_nonexistent_123',
			data: {
				object: {
					...mockEvent.data.object,
					customer: 'cus_nonexistent'
				}
			}
		})

		const response = await apiTest.api.v1.webhooks.stripe.post('webhook_payload', {
			headers: {
				'stripe-signature': 'valid_signature'
			}
		})

		expect(response.status).toBe(200)
		expect(response.error).toBeDefined()
	})
})
