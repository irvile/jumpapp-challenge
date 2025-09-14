import { botManagementService } from '@backend/services/bot-management.service'
import { authPlugin } from '@backend/plugins/auth'
import Elysia, { status, t } from 'elysia'

const toggleBotBodySchema = t.Object({
	enabled: t.Boolean()
})

async function toggleBot(eventId: string, enabled: boolean, userId: string) {
	if (enabled) {
		const result = await botManagementService.scheduleBotForEvent(eventId, userId)
		
		if (!result.success) {
			switch (result.error) {
				case 'Calendar event not found':
					return status(404, result.error)
				case 'Cannot schedule bot for past events':
					return status(400, result.error)
				case 'No meeting URL available for this event':
					return status(422, result.error)
				default:
					return status(500, result.error || 'Failed to schedule bot')
			}
		}

		return {
			success: true,
			bot: result.bot
		}
	} else {
		const result = await botManagementService.cancelBotForEvent(eventId, userId)
		
		if (!result.success) {
			switch (result.error) {
				case 'Calendar event not found':
					return status(404, result.error)
				default:
					return status(500, result.error || 'Failed to cancel bot')
			}
		}

		return {
			success: true,
			bot: result.bot
		}
	}
}

export const toggleBotRoute = new Elysia()
	.use(authPlugin)
	.put(
		'/:calendarAccountId/events/:eventId/bot',
		async ({ params, body, user }) => toggleBot(params.eventId, body.enabled, user.id),
		{
			auth: true,
			params: t.Object({
				calendarAccountId: t.String(),
				eventId: t.String()
			}),
			body: toggleBotBodySchema
		}
	)
