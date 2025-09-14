import { jest } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import { randomUUIDv7 } from 'bun'
import { app } from '../app'
import { signIn, signUp } from './auth'
import { db } from './db'
import { envs } from './envs'
import type { Platform } from './generated/prisma'
import { genId } from './nanoid'

export const apiTest = treaty(app)

class TestFactory {
	createUser(body?: { name?: string; email?: string; password?: string }) {
		const data = {
			name: body?.name ?? `Ada Lovelace`,
			email: body?.email ?? `ada-${randomUUIDv7()}@example.com`,
			password: body?.password ?? 'password'
		}

		const save = async () => {
			const userResponse = await signUp(data.name, data.email, data.password)

			const session = await signIn(data.email, data.password)
			const cookie = session.headers.get('set-cookie') as string

			return { user: userResponse.user, cookie }
		}

		return { data, save }
	}

	createCalendarAccount(body?: {
		googleId?: string
		email?: string
		name?: string
		userId?: string
		createdAt?: Date
	}) {
		const data = {
			googleId: body?.googleId ?? `google-${genId('random')}`,
			email: body?.email ?? `test-${genId('random')}@gmail.com`,
			name: body?.name ?? 'Test Account',
			userId: body?.userId ?? genId('user'),
			createdAt: body?.createdAt ?? new Date()
		}

		const save = async () => {
			return await db.calendarAccount.create({
				data: {
					id: genId('calendarAccount'),
					googleId: data.googleId,
					email: data.email,
					name: data.name,
					accessToken: 'test-access-token',
					userId: data.userId,
					createdAt: data.createdAt
				}
			})
		}

		return { data, save }
	}

	createCalendarEvent(body?: {
		title?: string
		googleAccountId?: string
		startTime?: Date
		endTime?: Date
		description?: string
		meetingUrl?: string
		platform?: string
		attendees?: string
		location?: string
	}) {
		const now = new Date()
		const data = {
			title: body?.title ?? 'Test Meeting',
			googleAccountId: body?.googleAccountId ?? genId('calendarAccount'),
			startTime: body?.startTime ?? now,
			endTime: body?.endTime ?? new Date(now.getTime() + 60 * 60 * 1000),
			description: body?.description ?? null,
			meetingUrl: body?.meetingUrl ?? null,
			platform: body?.platform ?? null,
			attendees: body?.attendees ?? null,
			location: body?.location ?? null
		}

		const save = async () => {
			return await db.calendarEvent.create({
				data: {
					id: genId('calendarEvent'),
					externalId: `external-${genId('random')}`,
					title: data.title,
					googleAccountId: data.googleAccountId,
					startTime: data.startTime,
					endTime: data.endTime,
					description: data.description,
					meetingUrl: data.meetingUrl,
					platform: data.platform as Platform,
					attendees: data.attendees,
					location: data.location
				}
			})
		}

		return { data, save }
	}

	createCalendarEventMock(body?: {
		id?: string
		summary?: string
		description?: string
		startDateTime?: string
		endDateTime?: string
		attendees?: Array<{ email: string; displayName?: string }>
		location?: string
	}) {
		const now = new Date()
		const endTime = new Date(now.getTime() + 60 * 60 * 1000)

		return {
			id: body?.id ?? `event_${Date.now()}`,
			summary: body?.summary ?? 'Test Calendar Event',
			description: body?.description ?? 'Test event with zoom link: https://zoom.us/j/123456789',
			start: {
				dateTime: body?.startDateTime ?? now.toISOString()
			},
			end: {
				dateTime: body?.endDateTime ?? endTime.toISOString()
			},
			attendees: body?.attendees ?? [{ email: 'test@example.com', displayName: 'Test User' }],
			location: body?.location ?? 'Test Location'
		}
	}

	async cleanDatabase() {
		if (envs.NODE_ENV !== 'production') {
			await db.transcript.deleteMany()
			await db.bot.deleteMany()
			await db.calendarEvent.deleteMany()
			await db.calendarAccount.deleteMany()
			await db.user.deleteMany()
		}
	}
}

type CapturedRequest = {
	url?: string
	method?: string
	headers?: Record<string, string>
	body?: Record<string, unknown>
	searchParams?: Record<string, string>
	// biome-ignore lint/suspicious/noExplicitAny: its okay
	rawBody?: any
}

export function createMockFetchImplementation<TResponse>(
	responseBody: TResponse,
	options: { status?: number; statusText?: string; headers?: Record<string, string> } = {}
) {
	const capturedRequests: CapturedRequest[] = []

	// biome-ignore lint/suspicious/noExplicitAny: its okay
	const mockImplementation = jest.fn(async (url: string, init?: RequestInit): Promise<any> => {
		let parsedBody: Record<string, unknown> | undefined
		try {
			parsedBody = init?.body ? JSON.parse(init.body.toString()) : undefined
		} catch (e) {
			console.warn('Failed to parse request body as JSON in mock fetch:', e)
			parsedBody = undefined
		}

		const request: CapturedRequest = {
			url,
			method: init?.method || 'GET',
			headers: (init?.headers || {}) as Record<string, string>,
			rawBody: init?.body,
			body: parsedBody,
			// @ts-expect-error
			searchParams: init?.searchParams
		}
		capturedRequests.push(request)

		const { status = 200, statusText = 'OK', headers = { 'Content-Type': 'application/json' } } = options

		return {
			ok: status >= 200 && status < 300,
			status,
			statusText,
			headers: new Headers(headers),
			json: async () => responseBody,
			text: async () => JSON.stringify(responseBody),
			blob: async () =>
				new Blob([JSON.stringify(responseBody)], { type: headers['Content-Type'] || 'application/json' }),
			arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(responseBody)).buffer
		}
	})

	return {
		mockImplementation,
		getCapturedRequests: () => capturedRequests,
		getLastRequest: (): CapturedRequest | null =>
			capturedRequests.length > 0 ? capturedRequests[capturedRequests.length - 1] : null,
		clearCapturedRequests: () => {
			capturedRequests.length = 0
		}
	}
}

export const testFactory = new TestFactory()
