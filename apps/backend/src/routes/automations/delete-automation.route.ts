import { authPlugin } from '@backend/plugins/auth'
import { automationService } from '@backend/services/automation.service'
import type { User } from 'better-auth'
import Elysia, { t } from 'elysia'

async function deleteAutomation(params: { id: string }, user: User) {
	await automationService.deleteAutomation(user.id, params.id)
	return { success: true }
}

export const deleteAutomationRoute = new Elysia()
	.use(authPlugin)
	.delete('/:id', async ({ params, user }) => deleteAutomation(params, user), {
		auth: true,
		params: t.Object({
			id: t.String()
		})
	})
