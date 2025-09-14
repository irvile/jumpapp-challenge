import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('List Calendar Accounts Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})
	test('should return calendar accounts for authenticated user', async () => {
		const userCreated = await testFactory.createUser().save()
		const calendarAccount1 = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id,
				email: 'u1@gmail.com',
				name: 'User One'
			})
			.save()
		const calendarAccount2 = await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id,
				email: 'u2@gmail.com',
				name: 'User Two'
			})
			.save()

		const response = await apiTest.api.v1.calendars.get({
			headers: {
				Cookie: userCreated.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.error).toBeNull()
		expect(response.data).toBeDefined()

		if (response.data) {
			expect(response.data).toHaveLength(2)

			const account1 = response.data.find((acc) => acc.email === 'u1@gmail.com')
			const account2 = response.data.find((acc) => acc.email === 'u2@gmail.com')

			expect(account1).toBeDefined()
			expect(account1?.name).toBe('User One')
			expect(account1?.provider).toBe('GOOGLE')
			expect(account1?.id).toBe(calendarAccount1.id)

			expect(account2).toBeDefined()
			expect(account2?.name).toBe('User Two')
			expect(account2?.provider).toBe('GOOGLE')
			expect(account2?.id).toBe(calendarAccount2.id)
		}
	})

	test('should return empty array when user has no calendar accounts', async () => {
		const userCreated = await testFactory.createUser().save()

		const response = await apiTest.api.v1.calendars.get({
			headers: {
				Cookie: userCreated.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.error).toBeNull()
		expect(response.data).toBeDefined()

		if (response.data) {
			expect(response.data).toHaveLength(0)
		}
	})

	test('should return 401 when user is not authenticated', async () => {
		const response = await apiTest.api.v1.calendars.get()

		expect(response.status).toBe(401)
		expect(response.error).toBeDefined()
		expect(response.data).toBeNull()
	})

	test('should not return calendar accounts from other users', async () => {
		const user1 = await testFactory.createUser().save()
		const user2 = await testFactory.createUser().save()

		await testFactory
			.createCalendarAccount({
				userId: user1.user.id,
				email: 'user1@gmail.com',
				name: 'User One'
			})
			.save()

		await testFactory
			.createCalendarAccount({
				userId: user2.user.id,
				email: 'user2@gmail.com',
				name: 'User Two'
			})
			.save()

		const response = await apiTest.api.v1.calendars.get({
			headers: {
				Cookie: user1.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeDefined()

		if (response.data) {
			expect(response.data).toHaveLength(1)
			expect(response.data[0].email).toBe('user1@gmail.com')
		}
	})

	test('should return calendar accounts ordered by creation date', async () => {
		const userCreated = await testFactory.createUser().save()

		await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id,
				email: 'first@gmail.com',
				name: 'First Account',
				createdAt: new Date('2025-01-01')
			})
			.save()

		await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id,
				email: 'second@gmail.com',
				name: 'Second Account',
				createdAt: new Date('2025-01-02')
			})
			.save()

		const response = await apiTest.api.v1.calendars.get({
			headers: {
				Cookie: userCreated.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeDefined()

		if (response.data) {
			expect(response.data).toHaveLength(2)
			expect(response.data[0].email).toBe('first@gmail.com')
			expect(response.data[1].email).toBe('second@gmail.com')

			const firstCreatedAt = new Date(response.data[0].createdAt)
			const secondCreatedAt = new Date(response.data[1].createdAt)
			expect(firstCreatedAt.getTime()).toBeLessThan(secondCreatedAt.getTime())
		}
	})

	test('should not expose sensitive fields like access tokens', async () => {
		const userCreated = await testFactory.createUser().save()
		await testFactory
			.createCalendarAccount({
				userId: userCreated.user.id,
				email: 'test@gmail.com',
				name: 'Test Account'
			})
			.save()

		const response = await apiTest.api.v1.calendars.get({
			headers: {
				Cookie: userCreated.cookie
			}
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeDefined()

		if (response.data) {
			const account = response.data[0]
			expect(account).toBeDefined()
			expect(account.id).toBeDefined()
			expect(account.provider).toBeDefined()
			expect(account.email).toBeDefined()
			expect(account.name).toBeDefined()
			expect(account.googleId).toBeDefined()
			expect(account.createdAt).toBeDefined()
		}
	})
})
