import { beforeEach, describe, expect, test } from 'bun:test'
import { testFactory } from '@backend/libs/test-utils'
import { userSettingsService } from '../user-settings.service'

describe('UserSettingsService', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
	})

	test('should create default settings when user has none', async () => {
		const user = await testFactory.createUser().save()

		const settings = await userSettingsService.getUserSettings(user.user.id)

		expect(settings).toBeDefined()
		expect(settings.userId).toBe(user.user.id)
		expect(settings.joinMinutesBefore).toBe(5)
		expect(settings.botName).toBe('MeetPost AI')
		expect(settings.createdAt).toBeDefined()
		expect(settings.updatedAt).toBeDefined()
	})

	test('should return existing settings when user already has them', async () => {
		const user = await testFactory.createUser().save()

		const firstCall = await userSettingsService.getUserSettings(user.user.id)
		const secondCall = await userSettingsService.getUserSettings(user.user.id)

		expect(firstCall.id).toBe(secondCall.id)
		expect(firstCall.joinMinutesBefore).toBe(secondCall.joinMinutesBefore)
		expect(firstCall.botName).toBe(secondCall.botName)
	})

	test('should update join minutes before setting', async () => {
		const user = await testFactory.createUser().save()

		await userSettingsService.getUserSettings(user.user.id)

		const updatedSettings = await userSettingsService.updateUserSettings(user.user.id, {
			joinMinutesBefore: 10
		})

		expect(updatedSettings.joinMinutesBefore).toBe(10)
		expect(updatedSettings.botName).toBe('MeetPost AI')
	})

	test('should update bot name setting', async () => {
		const user = await testFactory.createUser().save()

		await userSettingsService.getUserSettings(user.user.id)

		const updatedSettings = await userSettingsService.updateUserSettings(user.user.id, {
			botName: 'Custom Bot Name'
		})

		expect(updatedSettings.botName).toBe('Custom Bot Name')
		expect(updatedSettings.joinMinutesBefore).toBe(5)
	})

	test('should update both settings at once', async () => {
		const user = await testFactory.createUser().save()

		await userSettingsService.getUserSettings(user.user.id)

		const updatedSettings = await userSettingsService.updateUserSettings(user.user.id, {
			joinMinutesBefore: 12,
			botName: 'My Custom Bot'
		})

		expect(updatedSettings.joinMinutesBefore).toBe(12)
		expect(updatedSettings.botName).toBe('My Custom Bot')
	})

	test('should update the updatedAt timestamp when settings are modified', async () => {
		const user = await testFactory.createUser().save()

		const originalSettings = await userSettingsService.getUserSettings(user.user.id)
		
		await new Promise(resolve => setTimeout(resolve, 10))

		const updatedSettings = await userSettingsService.updateUserSettings(user.user.id, {
			botName: 'New Bot Name'
		})

		expect(new Date(updatedSettings.updatedAt).getTime()).toBeGreaterThan(
			new Date(originalSettings.updatedAt).getTime()
		)
	})

	test('should handle partial updates without affecting other fields', async () => {
		const user = await testFactory.createUser().save()

		await userSettingsService.getUserSettings(user.user.id)

		const partialUpdate = await userSettingsService.updateUserSettings(user.user.id, {
			joinMinutesBefore: 8
		})

		expect(partialUpdate.joinMinutesBefore).toBe(8)
		expect(partialUpdate.botName).toBe('MeetPost AI')

		const anotherPartialUpdate = await userSettingsService.updateUserSettings(user.user.id, {
			botName: 'Another Bot'
		})

		expect(anotherPartialUpdate.joinMinutesBefore).toBe(8)
		expect(anotherPartialUpdate.botName).toBe('Another Bot')
	})
})