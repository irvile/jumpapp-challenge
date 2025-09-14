import { db } from '@backend/libs/db'
import { authPlugin } from '@backend/plugins/auth'
import Elysia, { status } from 'elysia'

async function listCalendarAccounts(userId: string) {
	try {
		const calendarAccounts = await db.calendarAccount.findMany({
			where: {
				userId: userId
			},
			select: {
				id: true,
				provider: true,
				email: true,
				name: true,
				googleId: true,
				createdAt: true
			},
			orderBy: {
				createdAt: 'asc'
			}
		})

		return calendarAccounts
	} catch (error) {
		if (error instanceof Error) {
			return status(500, error.message)
		}
		return status(500, 'Internal server error')
	}
}

export const listCalendarAccountsRoute = new Elysia()
	.use(authPlugin)
	.get('/', async ({ user }) => listCalendarAccounts(user.id), {
		auth: true
	})
