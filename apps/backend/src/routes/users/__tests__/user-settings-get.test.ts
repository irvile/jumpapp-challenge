import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('User Settings GET API Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	describe('GET /api/v1/users/settings', () => {
		test('should return default settings for new user', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.users.settings.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.userId).toBe(user.user.id)
				expect(response.data.joinMinutesBefore).toBe(5)
				expect(response.data.botName).toBe('MeetPost AI')
				expect(response.data.id).toBeDefined()
				expect(response.data.createdAt).toBeDefined()
				expect(response.data.updatedAt).toBeDefined()
			}
		})

		test('should return 401 when user is not authenticated', async () => {
			const response = await apiTest.api.v1.users.settings.get()

			expect(response.status).toBe(401)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should return same settings on multiple calls', async () => {
			const user = await testFactory.createUser().save()

			const firstResponse = await apiTest.api.v1.users.settings.get({
				headers: {
					Cookie: user.cookie
				}
			})

			const secondResponse = await apiTest.api.v1.users.settings.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(firstResponse.status).toBe(200)
			expect(secondResponse.status).toBe(200)

			if (firstResponse.data && secondResponse.data) {
				expect(firstResponse.data.id).toBe(secondResponse.data.id)
			}
		})
	})
})
