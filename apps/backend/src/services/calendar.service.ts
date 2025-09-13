import { db } from '@backend/libs/db'
import type { Platform } from '@backend/libs/generated/prisma'
import { genId } from '@backend/libs/nanoid'
import { extractMeetingLink } from './meeting-link.service'

interface GoogleCalendarAttendee {
	email: string
	displayName?: string
	organizer?: boolean
	self?: boolean
	responseStatus: 'needsAction' | 'accepted' | 'declined' | 'tentative'
}

interface GoogleCalendarConferenceData {
	entryPoints: Array<{
		entryPointType: string
		uri: string
		label: string
	}>
	conferenceSolution: {
		key: {
			type: string
		}
		name: string
		iconUri: string
	}
	conferenceId: string
}

interface GoogleCalendarCreator {
	email: string
	displayName?: string
	self?: boolean
}

interface GoogleCalendarEvent {
	kind: string
	etag: string
	id: string
	status: string
	htmlLink: string
	created: string
	updated: string
	summary?: string
	description?: string
	location?: string
	creator: GoogleCalendarCreator
	organizer: GoogleCalendarCreator
	start: {
		dateTime?: string
		date?: string
		timeZone?: string
	}
	end: {
		dateTime?: string
		date?: string
		timeZone?: string
	}
	iCalUID: string
	sequence: number
	hangoutLink?: string
	conferenceData?: GoogleCalendarConferenceData
	attendees?: GoogleCalendarAttendee[]
	guestsCanInviteOthers?: boolean
	privateCopy?: boolean
	reminders: {
		useDefault: boolean
	}
	eventType: string
}

interface GoogleCalendarEventsResponse {
	kind: string
	etag: string
	summary: string
	description: string
	updated: string
	timeZone: string
	accessRole: string
	defaultReminders: Array<{
		method: string
		minutes: number
	}>
	items: GoogleCalendarEvent[]
}

async function getEventsFromDatabase(calendarAccountId: string, startDate: string, endDate: string) {
	const events = await db.calendarEvent.findMany({
		where: {
			googleAccountId: calendarAccountId,
			startTime: { gte: new Date(startDate) },
			endTime: { lte: new Date(endDate) }
		},
		include: { bot: true },
		orderBy: { startTime: 'asc' }
	})

	return events.map((event) => ({
		id: event.id,
		title: event.title,
		startTime: event.startTime.toISOString(),
		endTime: event.endTime.toISOString(),
		meetingUrl: event.meetingUrl,
		platform: event.platform,
		attendees: event.attendees,
		location: event.location,
		hasBot: !!event.bot,
		googleAccountId: event.googleAccountId,
		isSynced: false
	}))
}

export async function syncCalendarEvents(
	calendarAccountId: string,
	startDate: string,
	endDate: string,
	userId: string
) {
	const calendarAccount = await db.calendarAccount.findFirst({
		where: {
			id: calendarAccountId,
			userId: userId
		}
	})

	if (!calendarAccount) {
		throw new Error('Calendar account not found')
	}

	try {
		const googleEvents = await fetchGoogleCalendarEvents(calendarAccount.accessToken, startDate, endDate)

		const events = []

		for (const googleEvent of googleEvents) {
			const meetingLink = extractMeetingLink(googleEvent.description, googleEvent.location, googleEvent.hangoutLink)

			const calendarEventWithBot = await syncEventToDatabase(googleEvent, calendarAccount.id, meetingLink)

			events.push({
				id: calendarEventWithBot.id,
				title: calendarEventWithBot.title,
				startTime: calendarEventWithBot.startTime.toISOString(),
				endTime: calendarEventWithBot.endTime.toISOString(),
				meetingUrl: calendarEventWithBot.meetingUrl,
				platform: calendarEventWithBot.platform,
				attendees: calendarEventWithBot.attendees,
				location: calendarEventWithBot.location,
				hasBot: !!calendarEventWithBot.bot,
				googleAccountId: calendarEventWithBot.googleAccountId,
				isSynced: true
			})
		}

		return events
	} catch (error) {
		if (error instanceof Error && error.message === 'Token expired') {
			// throw error
		}

		return await getEventsFromDatabase(calendarAccountId, startDate, endDate)
	}
}

async function fetchGoogleCalendarEvents(
	accessToken: string,
	startDate: string,
	endDate: string
): Promise<GoogleCalendarEvent[]> {
	const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
	url.searchParams.set('timeMin', startDate)
	url.searchParams.set('timeMax', endDate)
	url.searchParams.set('singleEvents', 'true')
	url.searchParams.set('orderBy', 'startTime')

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		}
	})

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('Token expired')
		}
		throw new Error(`Google Calendar API error: ${response.statusText}`)
	}

	const data: GoogleCalendarEventsResponse = await response.json()
	return data.items || []
}

async function syncEventToDatabase(
	googleEvent: GoogleCalendarEvent,
	calendarAccountId: string,
	meetingLink: { url: string; platform: string } | null
) {
	const startTime = googleEvent.start.dateTime || `${googleEvent.start.date}T00:00:00Z`
	const endTime = googleEvent.end.dateTime || `${googleEvent.end.date}T23:59:59Z`

	const calendarEvent = await db.calendarEvent.upsert({
		where: {
			externalId_googleAccountId: {
				externalId: googleEvent.id,
				googleAccountId: calendarAccountId
			}
		},
		update: {
			title: googleEvent.summary ?? 'Untitled',
			description: googleEvent.description || null,
			startTime: new Date(startTime),
			endTime: new Date(endTime),
			meetingUrl: meetingLink?.url || null,
			platform: (meetingLink?.platform as Platform) || null,
			attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : null,
			location: googleEvent.location || null
		},
		create: {
			id: genId('calendarEvent'),
			externalId: googleEvent.id,
			title: googleEvent.summary ?? 'Untitled',
			description: googleEvent.description || null,
			startTime: new Date(startTime),
			endTime: new Date(endTime),
			meetingUrl: meetingLink?.url || null,
			platform: (meetingLink?.platform as Platform) || null,
			attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : null,
			location: googleEvent.location || null,
			googleAccountId: calendarAccountId
		},
		include: {
			bot: true
		}
	})

	return calendarEvent
}
