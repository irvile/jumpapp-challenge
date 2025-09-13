import { botManagementService } from '@backend/services/bot-management.service'
import { authPlugin } from '@backend/plugins/auth'
import Elysia, { status, t } from 'elysia'

export const botStatusRoute = new Elysia()
	.use(authPlugin)
	.get(
		'/:calendarAccountId/events/:eventId/bot/status',
		async ({ params, user }) => {
			const result = await botManagementService.getBotStatus(params.eventId, user.id)
			
			if (result.isErr()) {
				switch (result.error) {
					case 'Calendar event not found':
						return status(404, { error: result.error })
					default:
						return status(500, { error: result.error })
				}
			}

			return {
				success: true,
				bot: result.value.bot
			}
		},
		{
			auth: true,
			params: t.Object({
				calendarAccountId: t.String(),
				eventId: t.String()
			})
		}
	)