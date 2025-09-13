import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('User Settings UPDATE API Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	describe('PUT /api/v1/users/settings', () => {
		test('should update join minutes before setting', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 10
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.joinMinutesBefore).toBe(10)
				expect(response.data.botName).toBe('MeetPost AI')
			}
		})

		test('should update bot name setting', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.users.settings.put(
				{
					botName: 'Custom Assistant'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.botName).toBe('Custom Assistant')
				expect(response.data.joinMinutesBefore).toBe(5)
			}
		})

		test('should update both settings simultaneously', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 8,
					botName: 'My Bot'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.joinMinutesBefore).toBe(8)
				expect(response.data.botName).toBe('My Bot')
			}
		})

		test('should validate join minutes before range', async () => {
			const user = await testFactory.createUser().save()

			const invalidLowResponse = await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 0
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(invalidLowResponse.status).toBe(422)
			expect(invalidLowResponse.error).toBeDefined()

			const invalidHighResponse = await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 16
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(invalidHighResponse.status).toBe(422)
			expect(invalidHighResponse.error).toBeDefined()
		})

		test('should validate bot name length', async () => {
			const user = await testFactory.createUser().save()

			const emptyBotNameResponse = await apiTest.api.v1.users.settings.put(
				{
					botName: ''
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(emptyBotNameResponse.status).toBe(422)
			expect(emptyBotNameResponse.error).toBeDefined()

			const longBotNameResponse = await apiTest.api.v1.users.settings.put(
				{
					botName: 'a'.repeat(51)
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(longBotNameResponse.status).toBe(422)
			expect(longBotNameResponse.error).toBeDefined()
		})

		test('should return 401 when user is not authenticated', async () => {
			const response = await apiTest.api.v1.users.settings.put({
				joinMinutesBefore: 10
			})

			expect(response.status).toBe(401)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should allow valid boundary values', async () => {
			const user = await testFactory.createUser().save()

			const minValueResponse = await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 1
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(minValueResponse.status).toBe(200)
			if (minValueResponse.data) {
				expect(minValueResponse.data.joinMinutesBefore).toBe(1)
			}

			const maxValueResponse = await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 15
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(maxValueResponse.status).toBe(200)
			if (maxValueResponse.data) {
				expect(maxValueResponse.data.joinMinutesBefore).toBe(15)
			}
		})

		test('should preserve existing settings when updating only one field', async () => {
			const user = await testFactory.createUser().save()

			await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 7,
					botName: 'Initial Bot'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			const updateOnlyMinutesResponse = await apiTest.api.v1.users.settings.put(
				{
					joinMinutesBefore: 12
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(updateOnlyMinutesResponse.status).toBe(200)
			if (updateOnlyMinutesResponse.data) {
				expect(updateOnlyMinutesResponse.data.joinMinutesBefore).toBe(12)
				expect(updateOnlyMinutesResponse.data.botName).toBe('Initial Bot')
			}
		})

		test('should handle empty update request', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.users.settings.put(
				{},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.joinMinutesBefore).toBe(5)
				expect(response.data.botName).toBe('MeetPost AI')
			}
		})
	})
})
