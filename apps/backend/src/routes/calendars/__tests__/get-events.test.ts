import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

let fetchMock: ReturnType<typeof spyOn>

describe('Calendar Tests', () => {
	beforeEach(() => {
		fetchMock = spyOn(global, 'fetch')
	})

	afterEach(() => {
		fetchMock.mockRestore()
	})

	test('should fetch calendar events successfully', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id
			})
			.save()

		const mockEvents = [
			testFactory.createCalendarEventMock({
				id: 'event1',
				summary: 'Test Meeting',
				description: 'Meeting with zoom link: https://zoom.us/j/123456789'
			})
		]

		fetchMock.mockImplementation(
			async () =>
				({
					ok: true,
					json: async () => ({ items: mockEvents }),
					status: 200,
					statusText: 'OK'
				}) as Response
		)

		const startDate = new Date().toISOString()
		const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			query: {
				startDate,
				endDate
			}
		})

		expect(response.status).toBe(200)
		expect(response.error).toBeNull()
		expect(response.data).toBeDefined()

		if (response.data) {
			expect(response.data.events).toBeDefined()
			expect(Array.isArray(response.data.events)).toBe(true)
			expect(response.data.events.length).toBeGreaterThanOrEqual(0)

			if (response.data.events.length > 0) {
				const event = response.data.events[0]
				expect(event.id).toBeDefined()
				expect(event.title).toBeDefined()
				expect(event.startTime).toBeDefined()
				expect(event.endTime).toBeDefined()
				expect(event.hasBot).toBeDefined()
			}
		}
	})

	test('should return error when calendar account not found', async () => {
		const userCreated = await testFactory.createUser().save()

		fetchMock.mockImplementation(
			async () =>
				({
					ok: true,
					json: async () => ({ items: [] }),
					status: 200,
					statusText: 'OK'
				}) as Response
		)

		const startDate = new Date().toISOString()
		const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: 'non-existent' }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			query: {
				startDate,
				endDate
			}
		})

		expect(response.status).toBe(404)
		expect(response.error).toBeDefined()
	})

	test('should return error when startDate is missing', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id
			})
			.save()

		const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			// @ts-expect-error - test
			query: {
				endDate
			}
		})

		expect(response.status).toBe(422)
		expect(response.error).toBeDefined()
		expect(response.data).toBeNull()
	})

	test('should return error when endDate is missing', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id
			})
			.save()

		const startDate = new Date().toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			// @ts-expect-error - test
			query: {
				startDate
			}
		})

		expect(response.status).toBe(422)
		expect(response.error).toBeDefined()
		expect(response.data).toBeNull()
	})

	test('should handle Google API token expired error', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id
			})
			.save()

		fetchMock.mockImplementation(
			async () =>
				({
					ok: false,
					status: 401,
					statusText: 'Unauthorized'
				}) as Response
		)

		const startDate = new Date().toISOString()
		const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			query: {
				startDate,
				endDate
			}
		})

		expect(response.status).toBe(401)
		expect(response.error).toBeDefined()
	})

	test('should not allow access to other user calendar accounts', async () => {
		const user1 = await testFactory.createUser().save()
		const user2 = await testFactory.createUser().save()

		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: user1.user.id
			})
			.save()

		fetchMock.mockImplementation(
			async () =>
				({
					ok: true,
					json: async () => ({ items: [] }),
					status: 200,
					statusText: 'OK'
				}) as Response
		)

		const startDate = new Date().toISOString()
		const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: user2.cookie
			},
			query: {
				startDate,
				endDate
			}
		})

		expect(response.status).toBe(404)
		expect(response.error).toBeDefined()
	})

	test('should fallback to database events when Google API fails', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id
			})
			.save()

		await testFactory
			.createCalendarEvent({
				title: 'Cached Meeting',
				googleAccountId: calendarAccount.id,
				startTime: new Date(),
				endTime: new Date(Date.now() + 60 * 60 * 1000)
			})
			.save()

		fetchMock.mockImplementation(
			async () =>
				({
					ok: false,
					status: 500,
					statusText: 'Internal Server Error'
				}) as Response
		)

		const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
		const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			query: {
				startDate,
				endDate
			}
		})

		expect(response.status).toBe(200)
		expect(response.error).toBeNull()
		expect(response.data).toBeDefined()

		if (response.data) {
			expect(response.data.events).toBeDefined()
			expect(response.data.events.length).toBe(1)
			expect(response.data.events[0].title).toBe('Cached Meeting')
			expect(response.data.events[0].isSynced).toBe(false)
		}
	})

	test('should return synced events from Google API when successful', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id
			})
			.save()

		const mockEvents = [
			testFactory.createCalendarEventMock({
				id: 'event1',
				summary: 'Fresh Meeting'
			})
		]

		fetchMock.mockImplementation(
			async () =>
				({
					ok: true,
					json: async () => ({ items: mockEvents }),
					status: 200,
					statusText: 'OK'
				}) as Response
		)

		const startDate = new Date().toISOString()
		const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			query: {
				startDate,
				endDate
			}
		})

		expect(response.status).toBe(200)
		expect(response.error).toBeNull()
		expect(response.data).toBeDefined()

		if (response.data) {
			expect(response.data.events).toBeDefined()
			expect(response.data.events.length).toBe(1)
			expect(response.data.events[0].title).toBe('Fresh Meeting')
			expect(response.data.events[0].isSynced).toBe(true)
		}
	})

	test('should still return 401 for token expired error', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id
			})
			.save()

		await testFactory
			.createCalendarEvent({
				title: 'Cached Meeting',
				googleAccountId: calendarAccount.id,
				startTime: new Date(),
				endTime: new Date(Date.now() + 60 * 60 * 1000)
			})
			.save()

		fetchMock.mockImplementation(
			async () =>
				({
					ok: false,
					status: 401,
					statusText: 'Unauthorized'
				}) as Response
		)

		const startDate = new Date().toISOString()
		const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

		const response = await apiTest.api.v1.calendars({ calendarAccountId: calendarAccount.id }).events.get({
			headers: {
				Cookie: userCreated.cookie
			},
			query: {
				startDate,
				endDate
			}
		})

		expect(response.status).toBe(401)
		expect(response.error).toBeDefined()
	})
})
