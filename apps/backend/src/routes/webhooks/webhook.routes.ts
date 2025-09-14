import Elysia from 'elysia'
import { recallBotStatusWebhookRoute } from './recall-bot-status.route'

export const webhookRoutes = new Elysia({ prefix: '/v1/webhooks' })
	.use(recallBotStatusWebhookRoute)