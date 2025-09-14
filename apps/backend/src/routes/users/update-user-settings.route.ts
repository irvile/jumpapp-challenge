import { authPlugin } from '@backend/plugins/auth'
import { userSettingsService } from '@backend/services/user-settings.service'
import type { User } from 'better-auth'
import Elysia, { type Static, t } from 'elysia'

const updateUserSettingsSchema = t.Object({
	joinMinutesBefore: t.Optional(t.Integer({ minimum: 1, maximum: 15 })),
	botName: t.Optional(t.String({ minLength: 1, maxLength: 50 }))
})

export type UpdateUserSettingsSchema = Static<typeof updateUserSettingsSchema>

async function updateUserSettings(body: UpdateUserSettingsSchema, user: User) {
	const settings = await userSettingsService.updateUserSettings(user.id, body)
	return settings
}

export const updateUserSettingsRoute = new Elysia()
	.use(authPlugin)
	.put('/settings', async ({ body, user }) => updateUserSettings(body, user), {
		auth: true,
		body: updateUserSettingsSchema
	})
