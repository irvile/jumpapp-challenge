import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('Automations GET API Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	describe('GET /api/v1/automations', () => {
		test('should return empty array for user with no automations', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toEqual([])
		})

		test('should return user automations', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			const response = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toHaveLength(1)

			if (response.data) {
				expect(response.data[0].id).toBe(automation.id)
				expect(response.data[0].name).toBe(automation.name)
				expect(response.data[0].type).toBe('GENERATE_POST')
				expect(response.data[0].platform).toBe('LINKEDIN')
				expect(response.data[0].isActive).toBe(true)
				expect(response.data[0].createdAt).toBeDefined()
				expect(response.data[0].updatedAt).toBeDefined()
			}
		})

		test('should return multiple automations ordered by creation date', async () => {
			const user = await testFactory.createUser().save()
			const linkedinAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const facebookAccount = await testFactory.createSocialMediaAccount(user.user.id, 'FACEBOOK').save()

			await testFactory
				.createAutomation(user.user.id, linkedinAccount.id, {
					name: 'LinkedIn Automation',
					createdAt: new Date('2025-01-01')
				})
				.save()

			await testFactory
				.createAutomation(user.user.id, facebookAccount.id, {
					name: 'Facebook Automation',
					createdAt: new Date('2025-01-02')
				})
				.save()

			const response = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toHaveLength(2)

			if (response.data) {
				expect(response.data[0].name).toBe('Facebook Automation')
				expect(response.data[1].name).toBe('LinkedIn Automation')
			}
		})

		test('should not return automations from other users', async () => {
			const user1 = await testFactory.createUser().save()
			const user2 = await testFactory.createUser({ email: 'user2@test.com' }).save()

			const socialAccount1 = await testFactory.createSocialMediaAccount(user1.user.id, 'LINKEDIN').save()
			const socialAccount2 = await testFactory.createSocialMediaAccount(user2.user.id, 'LINKEDIN').save()

			await testFactory.createAutomation(user1.user.id, socialAccount1.id).save()
			await testFactory.createAutomation(user2.user.id, socialAccount2.id).save()

			const response = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user1.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toHaveLength(1)
		})

		test('should return 401 when user is not authenticated', async () => {
			const response = await apiTest.api.v1.automations.get()

			expect(response.status).toBe(401)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should include both active and inactive automations', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()

			await testFactory
				.createAutomation(user.user.id, socialAccount.id, {
					name: 'Active Automation',
					isActive: true
				})
				.save()

			await testFactory
				.createAutomation(user.user.id, socialAccount.id, {
					name: 'Inactive Automation',
					isActive: false
				})
				.save()

			const response = await apiTest.api.v1.automations.get({
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toHaveLength(2)

			if (response.data) {
				const activeAutomation = response.data.find((a) => a.name === 'Active Automation')
				const inactiveAutomation = response.data.find((a) => a.name === 'Inactive Automation')

				expect(activeAutomation?.isActive).toBe(true)
				expect(inactiveAutomation?.isActive).toBe(false)
			}
		})
	})
})
