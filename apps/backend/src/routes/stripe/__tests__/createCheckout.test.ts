import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

const mockStripeCustomer = {
	id: 'cus_test123',
	email: 'test@example.com',
	name: 'Test User'
}

const mockCheckoutSession = {
	id: 'cs_test123',
	url: 'https://checkout.stripe.com/pay/cs_test123'
}

const mockCreateFn = mock()
const mockCreateSessionFn = mock()

mock.module('@backend/libs/stripe', () => ({
	stripe: {
		customers: {
			create: mockCreateFn
		},
		checkout: {
			sessions: {
				create: mockCreateSessionFn
			}
		}
	}
}))

describe('POST /api/v1/stripe/createCheckout', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
		mockCreateFn.mockClear()
		mockCreateSessionFn.mockClear()
	})

	test('should create checkout session successfully', async () => {
		const user = await testFactory.createUser().save()

		mockCreateFn.mockResolvedValue(mockStripeCustomer)
		mockCreateSessionFn.mockResolvedValue(mockCheckoutSession)

		const response = await apiTest.api.v1.stripe.createCheckout.post(
			{
				priceId: 'price_test123'
			},
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(response.status).toBe(200)
		expect(response.data).toBeDefined()
		expect(response.data?.url).toBe(mockCheckoutSession.url)

		expect(mockCreateFn).toHaveBeenCalledWith({
			email: user.user.email,
			name: user.user.name,
			metadata: {
				userId: user.user.id
			}
		})

		expect(mockCreateSessionFn).toHaveBeenCalledWith({
			customer: mockStripeCustomer.id,
			payment_method_types: ['card'],
			line_items: [
				{
					price: 'price_test123',
					quantity: 1
				}
			],
			mode: 'subscription',
			success_url: 'http://localhost:3000/dashboard?success=true',
			cancel_url: 'http://localhost:3000/pricing?canceled=true',
			metadata: {
				userId: user.user.id
			}
		})
	})

	test('should use custom success and cancel URLs', async () => {
		const user = await testFactory.createUser().save()

		mockCreateFn.mockResolvedValue(mockStripeCustomer)
		mockCreateSessionFn.mockResolvedValue(mockCheckoutSession)

		await apiTest.api.v1.stripe.createCheckout.post(
			{
				priceId: 'price_test123',
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel'
			},
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(mockCreateSessionFn).toHaveBeenCalledWith(
			expect.objectContaining({
				success_url: 'https://example.com/success',
				cancel_url: 'https://example.com/cancel'
			})
		)
	})

	test('should return 401 when user is not authenticated', async () => {
		const response = await apiTest.api.v1.stripe.createCheckout.post({
			priceId: 'price_test123'
		})

		expect(response.status).toBe(401)
		expect(response.error).toBeDefined()
	})

	test('should return 422 when priceId is missing', async () => {
		const user = await testFactory.createUser().save()

		const response = await apiTest.api.v1.stripe.createCheckout.post(
			{} as any,
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(response.status).toBe(422)
		expect(response.error).toBeDefined()
	})

	test('should use existing stripe customer if already exists', async () => {
		const user = await testFactory.createUser().save()
		
		await testFactory.createStripeCustomer({
			userId: user.user.id,
			stripeCustomerId: 'cus_existing123'
		}).save()

		mockCreateSessionFn.mockResolvedValue(mockCheckoutSession)

		await apiTest.api.v1.stripe.createCheckout.post(
			{
				priceId: 'price_test123'
			},
			{
				headers: {
					Cookie: user.cookie
				}
			}
		)

		expect(mockCreateFn).not.toHaveBeenCalled()
		expect(mockCreateSessionFn).toHaveBeenCalledWith(
			expect.objectContaining({
				customer: 'cus_existing123'
			})
		)
	})

	test('should handle Stripe API errors', async () => {
		const user = await testFactory.createUser().save()

		mockCreateFn.mockRejectedValue(new Error('Stripe API error'))

		const response = await apiTest.api.v1.stripe.createCheckout.post(
			{
				priceId: 'price_test123'
			},
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