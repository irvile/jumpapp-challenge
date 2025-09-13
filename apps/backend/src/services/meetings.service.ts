import { db } from '@backend/libs/db'

export async function getCalendarEventById(eventId: string, userId: string) {
	const calendarEvent = await db.calendarEvent.findFirst({
		where: {
			id: eventId,
			calendarAccount: {
				userId: userId
			}
		},
		include: {
			bot: {
				include: {
					transcript: true
				}
			}
		}
	})

	return calendarEvent
}

export async function listUserCalendarEvents(userId: string) {
	const calendarEvents = await db.calendarEvent.findMany({
		where: {
			calendarAccount: {
				userId: userId
			}
		},
		include: {
			bot: {
				include: {
					transcript: true
				}
			}
		},
		orderBy: {
			startTime: 'desc'
		}
	})

	return calendarEvents
}
