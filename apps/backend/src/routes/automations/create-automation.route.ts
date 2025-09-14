import { authPlugin } from '@backend/plugins/auth'
import { automationService } from '@backend/services/automation.service'
import type { User } from 'better-auth'
import Elysia, { type Static, t } from 'elysia'

const createAutomationSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	platform: t.Union([t.Literal('LINKEDIN'), t.Literal('FACEBOOK')]),
	description: t.String({ minLength: 1, maxLength: 1000 }),
	example: t.Optional(t.String({ minLength: 1, maxLength: 1000 }))
})

export type CreateAutomationSchema = Static<typeof createAutomationSchema>

async function createAutomation(body: CreateAutomationSchema, user: User) {
	return await automationService.createAutomation(user.id, body)
}

export const createAutomationRoute = new Elysia()
	.use(authPlugin)
	.post('/', async ({ body, user }) => createAutomation(body, user), {
		auth: true,
		body: createAutomationSchema
	})
