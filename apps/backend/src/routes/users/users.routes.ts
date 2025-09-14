import Elysia from 'elysia'
import { getUserSettingsRoute } from './get-user-settings.route'
import { updateUserSettingsRoute } from './update-user-settings.route'

export const usersRoutes = new Elysia({ prefix: '/v1/users' }).use(updateUserSettingsRoute).use(getUserSettingsRoute)
