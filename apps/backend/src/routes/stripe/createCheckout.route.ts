import { Elysia, t } from 'elysia'
import { stripe } from '@backend/libs/stripe'
import { envs } from '@backend/libs/envs'
import { StripeCustomerService } from '@backend/services/stripeCustomer.service'
import { authPlugin } from '@backend/plugins/auth'
import { db } from '@backend/libs/db'

export const createCheckoutRoute = new Elysia()
	.use(authPlugin)
	.post(
		'/createCheckout',
		async ({ body, user }) => {
			const userData = await db.user.findUnique({
				where: { id: user.id }
			})

			if (!userData) {
				throw new Error('User not found')
			}

			const customer = await StripeCustomerService.createOrGetCustomer(userData)

			const session = await stripe.checkout.sessions.create({
				customer: customer.stripeCustomerId,
				payment_method_types: ['card'],
				line_items: [
					{
						price: body.priceId,
						quantity: 1
					}
				],
				mode: 'subscription',
				success_url: body.successUrl || `${envs.FRONTEND_URL}/dashboard?success=true`,
				cancel_url: body.cancelUrl || `${envs.FRONTEND_URL}/pricing?canceled=true`,
				metadata: {
					userId: user.id
				}
			})

			return {
				url: session.url
			}
		},
		{
			auth: true,
			body: t.Object({
				priceId: t.String(),
				successUrl: t.Optional(t.String()),
				cancelUrl: t.Optional(t.String())
			})
		}
	)