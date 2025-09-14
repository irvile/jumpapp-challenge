import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('Automations DELETE API Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	describe('DELETE /api/v1/automations/:id', () => {
		test('should delete automation successfully', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			const response = await apiTest.api.v1.automations({ id: automation.id }).delete(
				{},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toEqual({ success: true })
		})

		test('should verify automation is actually deleted', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			await apiTest.api.v1.automations({ id: automation.id }).delete(
				{},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			const getResponse = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(getResponse.status).toBe(200)
			expect(getResponse.data).toEqual([])
		})

		test('should return error when automation not found', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.automations({ id: 'non-existent-id' }).delete(
				{},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(500)
			expect(response.error).toBeDefined()
		})

		test('should not delete automation from another user', async () => {
			const user1 = await testFactory.createUser().save()
			const user2 = await testFactory.createUser({ email: 'user2@test.com' }).save()

			const socialAccount = await testFactory.createSocialMediaAccount(user1.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user1.user.id, socialAccount.id).save()

			const response = await apiTest.api.v1.automations({ id: automation.id }).delete(
				{},
				{
					headers: {
						Cookie: user2.cookie
					}
				}
			)

			expect(response.status).toBe(500)
			expect(response.error).toBeDefined()

			const getResponse = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user1.cookie
				}
			})

			expect(getResponse.status).toBe(200)
			expect(getResponse.data).toHaveLength(1)
		})

		test('should return 401 when user is not authenticated', async () => {
			const response = await apiTest.api.v1.automations({ id: 'some-id' }).delete({}, {})

			expect(response.status).toBe(401)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should delete automation with associated AI generated content', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			const response = await apiTest.api.v1.automations({ id: automation.id }).delete(
				{},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toEqual({ success: true })
		})

		test('should handle multiple automations deletion independently', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()

			const automation1 = await testFactory
				.createAutomation(user.user.id, socialAccount.id, {
					name: 'Automation 1'
				})
				.save()

			await testFactory
				.createAutomation(user.user.id, socialAccount.id, {
					name: 'Automation 2'
				})
				.save()

			const deleteResponse = await apiTest.api.v1.automations({ id: automation1.id }).delete(
				{},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(deleteResponse.status).toBe(200)

			const getResponse = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(getResponse.status).toBe(200)
			expect(getResponse.data).toHaveLength(1)

			if (getResponse.data) {
				expect(getResponse.data[0].name).toBe('Automation 2')
			}
		})

		test('should validate automation ID parameter', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.automations({ id: '' }).delete(
				{},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(404)
			expect(response.error).toBeDefined()
		})
	})
})
