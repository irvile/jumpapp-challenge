import { db } from '@backend/libs/db'
import { envs } from '@backend/libs/envs'
import { stripe } from '@backend/libs/stripe/stripe'
import { authPlugin } from '@backend/plugins/auth'
import { StripeCustomerService } from '@backend/services/stripeCustomer.service'
import { Elysia, t } from 'elysia'

export const customerPortalRoute = new Elysia().use(authPlugin).post(
	'/customerPortal',
	async ({ body, user }) => {
		const userData = await db.user.findUnique({
			where: { id: user.id }
		})

		if (!userData) {
			throw new Error('User not found')
		}

		const customer = await StripeCustomerService.createOrGetCustomer(userData)

		const session = await stripe.billingPortal.sessions.create({
			customer: customer.stripeCustomerId,
			return_url: body.returnUrl || `${envs.FRONTEND_URL}/app/account/billing`
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
