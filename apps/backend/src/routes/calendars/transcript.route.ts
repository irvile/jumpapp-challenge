import { transcriptService } from '@backend/services/transcript.service'
import { authPlugin } from '@backend/plugins/auth'
import Elysia, { status, t } from 'elysia'

export const transcriptRoute = new Elysia()
	.use(authPlugin)
	.get(
		'/:calendarAccountId/events/:eventId/transcript',
		async ({ params, user }) => {
			const result = await transcriptService.getOrDownloadTranscript(params.eventId, user.id)
			
			if (!result.success) {
				switch (result.error) {
					case 'Calendar event not found':
						return status(404, { error: result.error })
					case 'No bot found for this event':
						return status(404, { error: result.error })
					case 'Bot recording is not completed yet':
						return status(409, { error: result.error })
					case 'Recording not ready for download':
					case 'Transcript not ready for download':
						return status(202, { error: result.error, message: 'Transcript is being processed' })
					default:
						return status(500, { error: result.error || 'Failed to get transcript' })
				}
			}

			return {
				success: true,
				transcript: result.transcript
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