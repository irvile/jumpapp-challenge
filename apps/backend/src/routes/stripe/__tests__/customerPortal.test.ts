import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

const mockBillingPortalSession = {
	id: 'bps_test123',
	url: 'https://billing.stripe.com/session/bps_test123'
}

const mockPortalCreateFn = mock()

mock.module('@backend/libs/stripe', () => ({
	stripe: {
		billingPortal: {
			sessions: {
				create: mockPortalCreateFn
			}
		}
	}
}))

describe('POST /api/v1/stripe/customerPortal', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
		mockPortalCreateFn.mockClear()
	})

	test('should create customer portal session successfully', async () => {
		const user = await testFactory.createUser().save()
		const stripeCustomer = await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_test123'
		}).save()

		mockPortalCreateFn.mockResolvedValue(mockBillingPortalSession)

		const response = await apiTest.api.v1.stripe.customerPortal.post(
			{},
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(response.status).toBe(200)
		expect(response.data).toBeDefined()
		expect(response.data?.url).toBe(mockBillingPortalSession.url)

		expect(mockPortalCreateFn).toHaveBeenCalledWith({
			customer: stripeCustomer.stripeCustomer.stripeCustomerId,
			return_url: 'http://localhost:3000/dashboard'
		})
	})

	test('should use custom return URL', async () => {
		const user = await testFactory.createUser().save()
		await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_test123'
		}).save()

		mockPortalCreateFn.mockResolvedValue(mockBillingPortalSession)

		await apiTest.api.v1.stripe.customerPortal.post(
			{
				returnUrl: 'https://example.com/billing'
			},
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(mockPortalCreateFn).toHaveBeenCalledWith({
			customer: 'cus_test123',
			return_url: 'https://example.com/billing'
		})
	})

	test('should return 401 when user is not authenticated', async () => {
		const response = await apiTest.api.v1.stripe.customerPortal.post({})

		expect(response.status).toBe(401)
		expect(response.error).toBeDefined()
	})

	test('should return 500 when customer not found', async () => {
		const user = await testFactory.createUser().save()

		const response = await apiTest.api.v1.stripe.customerPortal.post(
			{},
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(response.status).toBe(500)
		expect(response.error).toBeDefined()
	})

	test('should handle Stripe API errors', async () => {
		const user = await testFactory.createUser().save()
		await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_test123'
		}).save()

		mockPortalCreateFn.mockRejectedValue(new Error('Stripe API error'))

		const response = await apiTest.api.v1.stripe.customerPortal.post(
			{},
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(response.status).toBe(500)
		expect(response.error).toBeDefined()
	})
})