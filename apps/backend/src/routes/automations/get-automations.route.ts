import { authPlugin } from '@backend/plugins/auth'
import { automationService } from '@backend/services/automation.service'
import Elysia from 'elysia'

export const getAutomationsRoute = new Elysia().use(authPlugin).get(
	'/',
	async ({ user }) => {
		return await automationService.getUserAutomations(user.id)
	},
	{
		auth: true
	}
)
