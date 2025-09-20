import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('GET /api/v1/stripe/subscriptionStatus', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	test('should return active subscription status', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_test123'
		}).save()

		await testFactory.createSubscription({
			stripeCustomerId: stripeCustomer.stripeCustomer.id,
			stripeSubscriptionId: 'sub_test123',
			status: 'active',
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: false,
			priceId: 'price_test123',
			productId: 'prod_test123'
		}).save()

		const response = await apiTest.api.v1.stripe.subscriptionStatus.get({
			headers: {
				Cookie: user.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeDefined()
		expect(response.data?.hasActiveSubscription).toBe(true)
		expect(response.data?.status).toBe('active')
		expect(response.data?.cancelAtPeriodEnd).toBe(false)
		expect(response.data?.currentPeriodEnd).toBeDefined()
	})

	test('should return trialing subscription status', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_test123'
		}).save()

		await testFactory.createSubscription({
			stripeCustomerId: stripeCustomer.stripeCustomer.id,
			stripeSubscriptionId: 'sub_test123',
			status: 'trialing',
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: false,
			priceId: 'price_test123',
			productId: 'prod_test123'
		}).save()

		const response = await apiTest.api.v1.stripe.subscriptionStatus.get({
			headers: {
				Cookie: user.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data?.hasActiveSubscription).toBe(true)
		expect(response.data?.status).toBe('trialing')
	})

	test('should return no active subscription when user has no subscription', async () => {
		const user = await testFactory.createUser().save()

		const response = await apiTest.api.v1.stripe.subscriptionStatus.get({
			headers: {
				Cookie: user.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeDefined()
		expect(response.data?.hasActiveSubscription).toBe(false)
		expect(response.data?.status).toBeNull()
		expect(response.data?.currentPeriodEnd).toBeNull()
		expect(response.data?.cancelAtPeriodEnd).toBe(false)
	})

	test('should return no active subscription when user has canceled subscription', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_test123'
		}).save()

		await testFactory.createSubscription({
			stripeCustomerId: stripeCustomer.stripeCustomer.id,
			stripeSubscriptionId: 'sub_test123',
			status: 'canceled',
			currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: true,
			priceId: 'price_test123',
			productId: 'prod_test123'
		}).save()

		const response = await apiTest.api.v1.stripe.subscriptionStatus.get({
			headers: {
				Cookie: user.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data?.hasActiveSubscription).toBe(false)
		expect(response.data?.status).toBeNull()
	})

	test('should return most recent active subscription when user has multiple', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_test123'
		}).save()

		await testFactory.createSubscription({
			stripeCustomerId: stripeCustomer.stripeCustomer.id,
			stripeSubscriptionId: 'sub_old123',
			status: 'active',
			currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: false,
			priceId: 'price_old123',
			productId: 'prod_old123'
		}).save()

		await testFactory.createSubscription({
			stripeCustomerId: stripeCustomer.stripeCustomer.id,
			stripeSubscriptionId: 'sub_new123',
			status: 'active',
			currentPeriodStart: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: false,
			priceId: 'price_new123',
			productId: 'prod_new123'
		}).save()

		const response = await apiTest.api.v1.stripe.subscriptionStatus.get({
			headers: {
				Cookie: user.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data?.hasActiveSubscription).toBe(true)
		expect(response.data?.status).toBe('active')
	})

	test('should return 401 when user is not authenticated', async () => {
		const response = await apiTest.api.v1.stripe.subscriptionStatus.get()

		expect(response.status).toBe(401)
		expect(response.error).toBeDefined()
	})
})