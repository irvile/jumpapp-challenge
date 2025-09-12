import { auth } from '@backend/libs/auth'
import Elysia from 'elysia'

export const authPlugin = new Elysia({ name: 'better-auth' }).macro({
	auth: (enabled: boolean) => ({
		resolve: async ({ status, request: { headers } }) => {
			if (!enabled) {
				return
			}

			const session = await auth.api.getSession({
				headers
			})

			if (!session) return status(401, 'Unauthorized')

			return {
				user: session.user,
				session: session
			}
		}
	})
})
