import { envs } from '@backend/libs/envs'
import { stripe } from '@backend/libs/stripe/stripe'
import { authPlugin } from '@backend/plugins/auth'
import { StripeCustomerService } from '@backend/services/stripeCustomer.service'
import { Elysia, t } from 'elysia'

export const customerPortalRoute = new Elysia().use(authPlugin).post(
	'/customerPortal',
	async ({ body, user }) => {
		const customer = await StripeCustomerService.findByUserId(user.id)

		if (!customer) {
			throw new Error('Customer not found')
		}

		const session = await stripe.billingPortal.sessions.create({
			customer: customer.stripeCustomerId,
			return_url: body.returnUrl || `${envs.FRONTEND_URL}/dashboard`
		})

		return {
			url: session.url
		}
	},
	{
		auth: true,
		body: t.Object({
			returnUrl: t.Optional(t.String())
		})
	}
)
