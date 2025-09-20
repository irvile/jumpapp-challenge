import { Elysia } from 'elysia'
import { authPlugin } from '@backend/plugins/auth'
import { SubscriptionService } from '../../services/subscription.service'

export const subscriptionStatusRoute = new Elysia()
	.use(authPlugin)
	.get('/subscriptionStatus', async ({ user }) => await SubscriptionService.getUserSubscriptionStatus(user.id), {
		auth: true
	})