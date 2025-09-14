import { beforeEach, describe, expect, test } from 'bun:test'
import { apiTest, testFactory } from '@backend/libs/test-utils'

describe('Automations CREATE API Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	describe('POST /api/v1/automations', () => {
		test('should create LinkedIn automation', async () => {
			const user = await testFactory.createUser().save()
			await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()

			const automationData = {
				name: 'LinkedIn Content Generator',
				type: 'GENERATE_POST',
				platform: 'LINKEDIN' as const,
				description: 'Generate LinkedIn posts from meeting transcripts',
				example: 'Just had an amazing meeting about AI trends...'
			}

			const response = await apiTest.api.v1.automations.post(automationData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.name).toBe(automationData.name)
				expect(response.data.type).toBe('GENERATE_POST')
				expect(response.data.platform).toBe('LINKEDIN')
				expect(response.data.description).toBe(automationData.description)
				expect(response.data.example).toBe(automationData.example)
				expect(response.data.isActive).toBe(true)
				expect(response.data.id).toBeDefined()
				expect(response.data.createdAt).toBeDefined()
				expect(response.data.updatedAt).toBeDefined()
			}
		})

		test('should create Facebook automation', async () => {
			const user = await testFactory.createUser().save()
			await testFactory.createSocialMediaAccount(user.user.id, 'FACEBOOK').save()

			const automationData = {
				name: 'Facebook Content Generator',
				type: 'GENERATE_POST',
				platform: 'FACEBOOK' as const,
				description: 'Generate Facebook posts from meeting transcripts',
				example: "Exciting updates from today's meeting..."
			}

			const response = await apiTest.api.v1.automations.post(automationData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.platform).toBe('FACEBOOK')
				expect(response.data.name).toBe(automationData.name)
			}
		})

		test('should create automation without social media account connected', async () => {
			const user = await testFactory.createUser().save()

			const automationData = {
				name: 'LinkedIn Content Generator',
				type: 'GENERATE_POST',
				platform: 'LINKEDIN' as const,
				description: 'Generate LinkedIn posts from meeting transcripts',
				example: 'Just had an amazing meeting about AI trends...'
			}

			const response = await apiTest.api.v1.automations.post(automationData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.data).toBeDefined()
			expect(response.data?.name).toBe(automationData.name)
			expect(response.data?.platform).toBe(automationData.platform)
			expect(response.data?.socialMediaAccountId).toBe(null)
		})

		test('should validate required fields', async () => {
			const user = await testFactory.createUser().save()

			const invalidData = {
				name: '',
				type: 'GENERATE_POST',
				platform: 'LINKEDIN' as const,
				description: 'Description',
				example: 'Example'
			}

			const response = await apiTest.api.v1.automations.post(invalidData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})

		test('should validate field lengths', async () => {
			const user = await testFactory.createUser().save()
			await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()

			const invalidData = {
				name: 'a'.repeat(101),
				type: 'GENERATE_POST',
				platform: 'LINKEDIN' as const,
				description: 'Description',
				example: 'Example'
			}

			const response = await apiTest.api.v1.automations.post(invalidData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})

		test('should validate platform enum', async () => {
			const user = await testFactory.createUser().save()

			const invalidData = {
				name: 'Test Automation',
				type: 'GENERATE_POST',
				platform: 'TWITTER' as const,
				description: 'Description',
				example: 'Example'
			}

			// @ts-expect-error - invalid platform
			const response = await apiTest.api.v1.automations.post(invalidData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})

		test('should return 401 when user is not authenticated', async () => {
			const automationData = {
				name: 'LinkedIn Content Generator',
				type: 'GENERATE_POST',
				platform: 'LINKEDIN' as const,
				description: 'Generate LinkedIn posts from meeting transcripts',
				example: 'Just had an amazing meeting about AI trends...'
			}

			const response = await apiTest.api.v1.automations.post(automationData)

			expect(response.status).toBe(401)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should handle long description and example fields', async () => {
			const user = await testFactory.createUser().save()
			await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()

			const automationData = {
				name: 'LinkedIn Content Generator',
				type: 'GENERATE_POST',
				platform: 'LINKEDIN' as const,
				description: 'a'.repeat(1000),
				example: 'b'.repeat(1000)
			}

			const response = await apiTest.api.v1.automations.post(automationData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()

			if (response.data) {
				expect(response.data.description).toBe(automationData.description)
				expect(response.data.example).toBe(automationData.example)
			}
		})

		test('should reject description and example fields that exceed maximum length', async () => {
			const user = await testFactory.createUser().save()
			await testFactory.createSocialMediaAccount(user.user.id, 'LINKEDIN').save()

			const invalidData = {
				name: 'LinkedIn Content Generator',
				type: 'GENERATE_POST',
				platform: 'LINKEDIN' as const,
				description: 'a'.repeat(1001),
				example: 'Example'
			}

			const response = await apiTest.api.v1.automations.post(invalidData, {
				headers: {
					Cookie: user.cookie
				}
			})

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})
	})
})
