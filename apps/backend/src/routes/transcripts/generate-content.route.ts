import { generatePrompt, optimizeForLLM } from '@backend/libs/recall/transcript/llm-optimizer'
import { parseTranscript } from '@backend/libs/recall/transcript/parser'
import type { RecallTranscript } from '@backend/libs/recall/transcript/types'
import { authPlugin } from '@backend/plugins/auth'
import Elysia, { status, t } from 'elysia'

async function handleGenerateContent(
	recallData: RecallTranscript,
	type: 'summary' | 'linkedin' | 'twitter',
	participantId?: number,
	participantName?: string
) {
	try {
		const parsed = parseTranscript(recallData)
		const optimized = optimizeForLLM(parsed)
		const prompt = generatePrompt(optimized, {
			type,
			participantId,
			participantName
		})

		return {
			success: true,
			data: {
				prompt,
				optimized,
				parsed
			}
		}
	} catch (error) {
		if (error instanceof Error) {
			return status(400, { success: false, error: error.message })
		}
		return status(500, { success: false, error: 'Failed to generate content' })
	}
}

export const generateContentRoute = new Elysia()
	.use(authPlugin)
	.post(
		'/generateContent',
		async ({ body }) => handleGenerateContent(body.recallData, body.type, body.participantId, body.participantName),
		{
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
				),
				type: t.Union([t.Literal('summary'), t.Literal('linkedin'), t.Literal('twitter')]),
				participantId: t.Optional(t.Number()),
				participantName: t.Optional(t.String())
			})
		}
	)
