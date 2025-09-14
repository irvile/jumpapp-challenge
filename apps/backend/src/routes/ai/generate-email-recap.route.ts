import { authPlugin } from '@backend/plugins/auth'
import { generateEmailRecapForMeeting } from '@backend/services/email-recap.service'
import Elysia, { type Static, status, t } from 'elysia'

const generateEmailRecapBodySchema = t.Object({
	eventId: t.String(),
	provider: t.Optional(t.Union([t.Literal('openai'), t.Literal('anthropic'), t.Literal('gemini')]))
})

export type GenerateEmailRecapBody = Static<typeof generateEmailRecapBodySchema>

export const generateEmailRecapRoute = new Elysia().use(authPlugin).post(
	'/generate-email-recap',
	async ({ body, user }) => {
		try {
			const emailRecap = await generateEmailRecapForMeeting(body, user.id)
			return emailRecap
		} catch (error) {
			console.error('generateEmailRecapRoute.error', error)
			return status(500, 'Failed to generate email recap')
		}
	},
	{
		auth: true,
		body: generateEmailRecapBodySchema
	}
)
