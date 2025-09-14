import { authPlugin } from '@backend/plugins/auth'
import { userSettingsService } from '@backend/services/user-settings.service'
import Elysia from 'elysia'

export const getUserSettingsRoute = new Elysia().use(authPlugin).get(
	'/settings',
	async ({ user }) => {
		const settings = await userSettingsService.getUserSettings(user.id)
		return settings
	},
	{
		auth: true
	}
)
