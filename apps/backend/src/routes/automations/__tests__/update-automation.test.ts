import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('Automations UPDATE API Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	describe('PUT /api/v1/automations/:id', () => {
		test('should update automation name', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			const updateData = {
				name: 'Updated Automation Name'
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(updateData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.name).toBe(updateData.name)
				expect(response.data.id).toBe(automation.id)
			}
		})

		test('should update automation platform and switch social media account', async () => {
			const user = await testFactory.createUser().save()
			const linkedinAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			await testFactory.createSocialMediaAccount(user.user.id, 'FACEBOOK').save()
			const automation = await testFactory.createAutomation(user.user.id, linkedinAccount.id).save()

			const updateData = {
				platform: 'FACEBOOK' as const
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(updateData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.platform).toBe('FACEBOOK')
				expect(response.data.id).toBe(automation.id)
			}
		})

		test('should update multiple fields simultaneously', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			const updateData = {
				name: 'Updated Name',
				description: 'Updated description',
				example: 'Updated example',
				isActive: false
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(updateData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.name).toBe(updateData.name)
				expect(response.data.description).toBe(updateData.description)
				expect(response.data.example).toBe(updateData.example)
				expect(response.data.isActive).toBe(false)
			}
		})

		test('should toggle isActive status', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id, { isActive: true }).save()

			const updateData = {
				isActive: false
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(updateData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()

			if (response.data) {
				expect(response.data.isActive).toBe(false)
			}
		})

		test('should return error when automation not found', async () => {
			const user = await testFactory.createUser().save()

			const updateData = {
				name: 'Updated Name'
			}

			const response = await apiTest.api.v1.automations({ id: 'non-existent-id' }).put(updateData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(500)
			expect(response.error).toBeDefined()
		})

		test('should not update automation from another user', async () => {
			const user1 = await testFactory.createUser().save()
			const user2 = await testFactory.createUser({ email: 'user2@test.com' }).save()

			const socialAccount = await testFactory.createSocialMediaAccount(user1.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user1.user.id, socialAccount.id).save()

			const updateData = {
				name: 'Hacked Name'
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(updateData, {
				headers: {
					Cookie: user2.cookie
				}
			})

			expect(response.status).toBe(500)
			expect(response.error).toBeDefined()
		})

		test('should validate field lengths', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			const invalidData = {
				name: 'a'.repeat(101)
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(invalidData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})

		test('should validate platform enum', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, socialAccount.id).save()

			const invalidData = {
				platform: 'INSTAGRAM' as const
			}

			// @ts-expect-error - invalid platform
			const response = await apiTest.api.v1.automations({ id: automation.id }).put(invalidData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})

		test('should return 401 when user is not authenticated', async () => {
			const updateData = {
				name: 'Updated Name'
			}

			const response = await apiTest.api.v1.automations({ id: 'some-id' }).put(updateData)

			expect(response.status).toBe(401)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should preserve existing fields when updating only some fields', async () => {
			const user = await testFactory.createUser().save()
			const socialAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory
				.createAutomation(user.user.id, socialAccount.id, {
					name: 'Original Name'
				})
				.save()

			const updateData = {
				description: 'New description only'
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(updateData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()

			if (response.data) {
				expect(response.data.name).toBe('Original Name')
				expect(response.data.description).toBe('New description only')
			}
		})

		test('should allow switching to platform without connected account', async () => {
			const user = await testFactory.createUser().save()
			const linkedinAccount = await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()
			const automation = await testFactory.createAutomation(user.user.id, linkedinAccount.id).save()

			const updateData = {
				platform: 'FACEBOOK' as const
			}

			const response = await apiTest.api.v1.automations({ id: automation.id }).put(updateData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.data).toBeDefined()
			expect(response.data.platform).toBe('FACEBOOK')
			expect(response.data.socialMediaAccountId).toBe(null)
		})
	})
})
