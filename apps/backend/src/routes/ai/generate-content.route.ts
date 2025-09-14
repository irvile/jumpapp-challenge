import { authPlugin } from '@backend/plugins/auth'
import { generateContentForMeeting } from '@backend/services/ai-content.service'
import Elysia, { type Static, status, t } from 'elysia'

const generateContentBodySchema = t.Object({
	eventId: t.String(),
	platform: t.Union([t.Literal('linkedin'), t.Literal('facebook'), t.Literal('X'), t.Literal('threads')]),
	tone: t.Optional(t.Union([t.Literal('professional'), t.Literal('casual'), t.Literal('technical')])),
	provider: t.Optional(t.Union([t.Literal('openai'), t.Literal('anthropic')]))
})

export type GenerateContentBody = Static<typeof generateContentBodySchema>

export const generateContentRoute = new Elysia().use(authPlugin).post(
	'/generate',
	async ({ body, user }) => {
		try {
			const content = await generateContentForMeeting(body, user.id)
			return content
		} catch {
			return status(500, 'Failed to generate content')
		}
	},
	{
		auth: true,
		body: generateContentBodySchema
	}
)
