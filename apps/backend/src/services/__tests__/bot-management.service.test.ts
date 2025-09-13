import { afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { db } from '@backend/libs/db'
import { genId } from '@backend/libs/nanoid'
import type { BotResponseRecall } from '@backend/libs/recall/recall'
import * as recall from '@backend/libs/recall/recall'
import { createMockFetchImplementation, testFactory } from '@backend/libs/test-utils'
import { BotManagementService } from '../bot-management.service'

describe('BotManagementService', () => {
	let userId: string
	let calendarAccountId: string
	let futureEventId: string
	let pastEventId: string
	let eventWithoutUrlId: string
	let eventWithBotId: string
	let existingBotId: string

	beforeAll(async () => {
		const userFactory = testFactory.createUser()
		const { user } = await userFactory.save()
		userId = user.id

		const calendarAccountFactory = testFactory.createCalendarAccount({ userId })
		const calendarAccount = await calendarAccountFactory.save()
		calendarAccountId = calendarAccount.id
	})

	beforeEach(async () => {
		const futureTime = new Date(Date.now() + 1000 * 60 * 60)
		const pastTime = new Date(Date.now() - 1000 * 60 * 60)

		const futureEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-future-event',
				title: 'Future Meeting',
				startTime: futureTime,
				endTime: new Date(futureTime.getTime() + 1000 * 60 * 60),
				meetingUrl: 'https://meet.google.com/test',
				googleAccountId: calendarAccountId
			}
		})
		futureEventId = futureEvent.id

		const pastEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-past-event',
				title: 'Past Meeting',
				startTime: pastTime,
				endTime: new Date(pastTime.getTime() + 1000 * 60 * 60),
				meetingUrl: 'https://meet.google.com/test-past',
				googleAccountId: calendarAccountId
			}
		})
		pastEventId = pastEvent.id

		const eventWithoutUrl = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-no-url-event',
				title: 'Meeting Without URL',
				startTime: futureTime,
				endTime: new Date(futureTime.getTime() + 1000 * 60 * 60),
				meetingUrl: null,
				googleAccountId: calendarAccountId
			}
		})
		eventWithoutUrlId = eventWithoutUrl.id

		const eventWithBot = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-bot-event',
				title: 'Meeting With Bot',
				startTime: futureTime,
				endTime: new Date(futureTime.getTime() + 1000 * 60 * 60),
				meetingUrl: 'https://meet.google.com/test-bot',
				googleAccountId: calendarAccountId
			}
		})
		eventWithBotId = eventWithBot.id

		const bot = await db.bot.create({
			data: {
				botId: `bot_${Date.now()}`,
				recallBotId: 'recall-bot-123',
				calendarEventId: eventWithBotId,
				status: 'SCHEDULED'
			}
		})
		existingBotId = bot.id
	})

	afterEach(async () => {
		mock.restore()
		await db.bot.deleteMany({})
		await db.calendarEvent.deleteMany({})
	})

	test('should return error when calendar event not found', async () => {
		const service = new BotManagementService()
		const nonExistentEventId = genId('calendarEvent')

		const result = await service.scheduleBotForEvent(nonExistentEventId, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('Calendar event not found')
	})

	test('should return error when event is in the past', async () => {
		const service = new BotManagementService()

		const result = await service.scheduleBotForEvent(pastEventId, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('Cannot schedule bot for past events')
	})

	test('should return error when no meeting URL available', async () => {
		const service = new BotManagementService()

		const result = await service.scheduleBotForEvent(eventWithoutUrlId, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('No meeting URL available for this event')
	})

	test('should return existing bot when already scheduled', async () => {
		const service = new BotManagementService()

		const result = await service.scheduleBotForEvent(eventWithBotId, userId)

		expect(result.success).toBe(true)
		expect(result.bot?.id).toBe(existingBotId)
		expect(result.bot?.status).toBe('SCHEDULED')
	})

	test('should create new bot successfully', async () => {
		const service = new BotManagementService()
		const mockRecallBotResponse: BotResponseRecall = {
			id: 'recall-bot-456',
			meeting_url: 'https://meet.google.com/test',
			bot_name: 'Meeting Bot - Future Meeting',
			join_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
			status_changes: [],
			recordings: [],
			recording_config: {
				transcript: {
					provider: {
						recallai_streaming: {
							language_code: 'auto'
						}
					}
				}
			}
		}

		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(mockRecallBotResponse, {
			status: 201
		})
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(recall, 'recallFetch').mockImplementation(mockImplementation)

		const result = await service.scheduleBotForEvent(futureEventId, userId)

		expect(result.success).toBe(true)
		expect(result.bot).toBeDefined()
		expect(result.bot?.recallBotId).toBe('recall-bot-456')
		expect(result.bot?.status).toBe('JOINING')

		const createdBot = await db.bot.findFirst({
			where: { calendarEventId: futureEventId }
		})
		expect(createdBot).toBeDefined()
		expect(createdBot?.recallBotId).toBe('recall-bot-456')
		expect(createdBot?.status).toBe('JOINING')
	})

	test('should handle Recall API failure gracefully', async () => {
		const service = new BotManagementService()

		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(
			{ error: 'API Error' },
			{ status: 500, statusText: 'Internal Server Error' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(recall, 'recallFetch').mockImplementation(mockImplementation)

		const result = await service.scheduleBotForEvent(futureEventId, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('Failed to create bot with Recall API')
		expect(result.bot).toBeDefined()
		expect(result.bot?.status).toBe('FAILED')

		const failedBot = await db.bot.findFirst({
			where: { calendarEventId: futureEventId }
		})
		expect(failedBot).toBeDefined()
		expect(failedBot?.status).toBe('FAILED')
	})

	test('should cancel bot successfully', async () => {
		const service = new BotManagementService()

		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(
			{},
			{ status: 204, statusText: 'No Content' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(recall, 'recallFetch').mockImplementation(mockImplementation)

		const result = await service.cancelBotForEvent(eventWithBotId, userId)

		expect(result.success).toBe(true)
		expect(result.bot).toBe(null)

		const deletedBot = await db.bot.findUnique({
			where: { id: existingBotId }
		})
		expect(deletedBot).toBeNull()
	})

	test('should sync bot status with Recall API', async () => {
		const service = new BotManagementService()
		const mockRecallBot: BotResponseRecall = {
			id: 'recall-bot-123',
			meeting_url: 'https://meet.google.com/test-bot',
			bot_name: 'Meeting Bot - Meeting With Bot',
			join_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
			status_changes: [
				{
					code: 'in_call_recording',
					message: 'Bot is recording',
					timestamp: '2023-01-01T10:00:00Z',
					sub_code: 'recording'
				}
			],
			recordings: [],
			recording_config: {
				transcript: {
					provider: {
						recallai_streaming: {
							language_code: 'auto'
						}
					}
				}
			}
		}

		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(mockRecallBot)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(recall, 'recallFetch').mockImplementation(mockImplementation)

		await service.syncBotWithRecall(existingBotId)

		const updatedBot = await db.bot.findUnique({
			where: { id: existingBotId }
		})
		expect(updatedBot).toBeDefined()
		expect(updatedBot?.status).toBe('RECORDING')
		expect(updatedBot?.joinedAt).toEqual(new Date('2023-01-01T10:00:00Z'))
		expect(updatedBot?.lastStatusCheck).toBeInstanceOf(Date)
	})

	test('should handle bot not found gracefully during sync', async () => {
		const service = new BotManagementService()
		const nonExistentBotId = genId('bot')

		const recallFetchSpy = spyOn(recall, 'recallFetch')

		await service.syncBotWithRecall(nonExistentBotId)

		expect(recallFetchSpy).not.toHaveBeenCalled()
	})

	test('should mark bot as failed when Recall sync fails', async () => {
		const service = new BotManagementService()

		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(
			{ error: 'API Error' },
			{ status: 500, statusText: 'Internal Server Error' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(recall, 'recallFetch').mockImplementation(mockImplementation)

		await service.syncBotWithRecall(existingBotId)

		const failedBot = await db.bot.findUnique({
			where: { id: existingBotId }
		})
		expect(failedBot).toBeDefined()
		expect(failedBot?.status).toBe('FAILED')
		expect(failedBot?.lastStatusCheck).toBeInstanceOf(Date)
	})
})
