import { db } from '@backend/libs/db'
import { authPlugin } from '@backend/plugins/auth'
import { automationService } from '@backend/services/automation.service'
import type { User } from 'better-auth'
import Elysia, { type Static, t } from 'elysia'

const updateAutomationSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	platform: t.Optional(t.Union([t.Literal('LINKEDIN'), t.Literal('FACEBOOK')])),
	description: t.Optional(t.String({ minLength: 1, maxLength: 1000 })),
	example: t.Optional(t.String({ minLength: 1, maxLength: 1000 })),
	isActive: t.Optional(t.Boolean())
})

export type UpdateAutomationSchema = Static<typeof updateAutomationSchema>

async function updateAutomation(params: { id: string }, body: UpdateAutomationSchema, user: User) {
	if (!body.name && !body.platform && !body.description && !body.example && body.isActive === undefined) {
		throw new Error('At least one field must be provided for update')
	}

	const automation = await db.automation.findFirst({
		where: { id: params.id, userId: user.id }
	})

	if (!automation) {
		throw new Error('Automation not found')
	}

	const updateData = {
		name: body.name || automation.name,
		platform: body.platform || automation.platform,
		description: body.description || automation.description,
		example: body.example !== undefined ? body.example : automation.example || undefined,
		isActive: body.isActive
	}

	return await automationService.updateAutomation(user.id, params.id, updateData)
}

export const updateAutomationRoute = new Elysia()
	.use(authPlugin)
	.put('/:id', async ({ params, body, user }) => updateAutomation(params, body, user), {
		auth: true,
		body: updateAutomationSchema,
		params: t.Object({
			id: t.String()
		})
	})
