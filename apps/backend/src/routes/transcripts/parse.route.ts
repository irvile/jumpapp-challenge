import { parseTranscript } from '@backend/libs/recall/transcript/parser'
import type { RecallTranscript } from '@backend/libs/recall/transcript/types'
import { authPlugin } from '@backend/plugins/auth'
import Elysia, { status, t } from 'elysia'

async function handleParseTranscript(recallData: RecallTranscript) {
	try {
		const parsed = parseTranscript(recallData)
		return { success: true, data: parsed }
	} catch (error) {
		if (error instanceof Error) {
			return status(400, { success: false, error: error.message })
		}
		return status(500, { success: false, error: 'Failed to parse transcript' })
	}
}

export const parseTranscriptRoute = new Elysia()
	.use(authPlugin)
	.post('/parse', async ({ body }) => handleParseTranscript(body.recallData), {
		auth: true,
		body: t.Object({
			recallData: t.Array(
				t.Object({
					participant: t.Object({
						id: t.Number(),
						name: t.String(),
						extra_data: t.Optional(
							t.Object({
								google_meet: t.Optional(
									t.Object({
										static_participant_id: t.String()
									})
								)
							})
						),
						is_host: t.Boolean(),
						platform: t.String()
					}),
					words: t.Array(
						t.Object({
							text: t.String(),
							start_timestamp: t.Object({
								relative: t.Number(),
								absolute: t.String()
							}),
							end_timestamp: t.Object({
								relative: t.Number(),
								absolute: t.String()
							})
						})
					)
				})
			)
		})
	})
