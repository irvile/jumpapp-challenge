import { Elysia } from 'elysia'
import { createCheckoutRoute } from './createCheckout.route'
import { customerPortalRoute } from './customerPortal.route'
import { subscriptionStatusRoute } from './subscriptionStatus.route'

export const stripeRoutes = new Elysia({ prefix: '/v1/stripe' })
	.use(createCheckoutRoute)
	.use(customerPortalRoute)
	.use(subscriptionStatusRoute)