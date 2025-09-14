import { dayjs } from '@backend/libs/date'
import { authPlugin } from '@backend/plugins/auth'
import { syncCalendarEvents } from '@backend/services/calendar.service'
import Elysia, { status, t } from 'elysia'

const listEventsQuerySchema = t.Object({
	startDate: t.String({ format: 'date' }),
	endDate: t.String({ format: 'date' })
})

async function listEvents(calendarAccountId: string, startDate: string, endDate: string, userId: string) {
	try {
		const startOfDay = dayjs(startDate).startOf('day').toISOString()
		const endOfDay = dayjs(endDate).endOf('day').toISOString()

		const events = await syncCalendarEvents(calendarAccountId, startOfDay, endOfDay, userId)

		return { events }
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'Calendar account not found') {
				return status(404, 'Calendar account not found')
			}

			if (error.message === 'Token expired') {
				return status(401, 'Token expired')
			}

			return status(500, error.message)
		}

		return status(500, 'Internal server error')
	}
}

export const getCalendarEventsRoute = new Elysia()
	.use(authPlugin)
	.get(
		'/:calendarAccountId/events',
		async ({ params, query, user }) => listEvents(params.calendarAccountId, query.startDate, query.endDate, user.id),
		{
			auth: true,
			params: t.Object({
				calendarAccountId: t.String()
			}),
			query: listEventsQuerySchema
		}
	)
