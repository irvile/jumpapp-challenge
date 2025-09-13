import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from 'bun:test'
import { db } from '@backend/libs/db'
import { genId } from '@backend/libs/nanoid'
import type { BotResponseRecall, RecordingRecall } from '@backend/libs/recall/recall'
import * as recall from '@backend/libs/recall/recall'
import * as downloadService from '@backend/libs/recall/transcript/download.service'
import * as parser from '@backend/libs/recall/transcript/parser'
import type { ParsedTranscript, RecallTranscript } from '@backend/libs/recall/transcript/types'
import { testFactory } from '@backend/libs/test-utils'
import { TranscriptService } from '../transcript.service'

describe('TranscriptService', () => {
	let userId: string
	let calendarAccountId: string

	beforeAll(async () => {
		const userFactory = testFactory.createUser()
		const { user } = await userFactory.save()
		userId = user.id

		const calendarAccountFactory = testFactory.createCalendarAccount({ userId })
		const calendarAccount = await calendarAccountFactory.save()
		calendarAccountId = calendarAccount.id
	})

	afterEach(async () => {
		mock.restore()
		await db.transcript.deleteMany({})
		await db.bot.deleteMany({})
		await db.calendarEvent.deleteMany({})
	})

	test('should return error when calendar event not found', async () => {
		const service = new TranscriptService()
		const nonExistentEventId = genId('calendarEvent')

		const result = await service.getOrDownloadTranscript(nonExistentEventId, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('Calendar event not found')
	})

	test('should return error when no bot found', async () => {
		const service = new TranscriptService()

		const calendarEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-event-123',
				title: 'Test Event',
				startTime: new Date(),
				endTime: new Date(),
				googleAccountId: calendarAccountId
			}
		})

		const result = await service.getOrDownloadTranscript(calendarEvent.id, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('No bot found for this event')
	})

	test('should return existing transcript when available', async () => {
		const service = new TranscriptService()
		const mockParsedTranscript: ParsedTranscript = {
			meeting: {
				duration: 30.5,
				startTime: '2025-09-13T12:00:00Z',
				endTime: '2025-09-13T12:30:30Z',
				platform: 'google_meet'
			},
			participants: [],
			conversation: []
		}

		const calendarEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-event-with-transcript',
				title: 'Test Event with Transcript',
				startTime: new Date(),
				endTime: new Date(),
				googleAccountId: calendarAccountId
			}
		})

		const bot = await db.bot.create({
			data: {
				id: genId('bot'),
				botId: genId('bot'),
				status: 'COMPLETED',
				recallBotId: genId('recallBot'),
				calendarEventId: calendarEvent.id
			}
		})

		await db.transcript.create({
			data: {
				content: JSON.stringify(mockParsedTranscript),
				rawContent: JSON.stringify([]),
				recallBotId: bot.id
			}
		})

		const result = await service.getOrDownloadTranscript(calendarEvent.id, userId)

		expect(result.success).toBe(true)
		expect(result.transcript).toEqual(mockParsedTranscript)
	})

	test('should return error when bot recording not completed', async () => {
		const service = new TranscriptService()

		const calendarEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-event-recording',
				title: 'Test Event Recording',
				startTime: new Date(),
				endTime: new Date(),
				googleAccountId: calendarAccountId
			}
		})

		await db.bot.create({
			data: {
				id: genId('bot'),
				botId: genId('bot'),
				status: 'RECORDING',
				recallBotId: 'recall-bot-recording-123',
				calendarEventId: calendarEvent.id
			}
		})

		const result = await service.getOrDownloadTranscript(calendarEvent.id, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('Bot recording is not completed yet')
	})

	test('should return error when no recall bot ID', async () => {
		const service = new TranscriptService()

		const calendarEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-event-no-recall',
				title: 'Test Event No Recall',
				startTime: new Date(),
				endTime: new Date(),
				googleAccountId: calendarAccountId
			}
		})

		await db.bot.create({
			data: {
				id: genId('bot'),
				botId: genId('bot'),
				status: 'COMPLETED',
				recallBotId: null,
				calendarEventId: calendarEvent.id
			}
		})

		const result = await service.getOrDownloadTranscript(calendarEvent.id, userId)

		expect(result.success).toBe(false)
		expect(result.error).toBe('No Recall bot ID found')
	})

	test('should successfully download and parse transcript', async () => {
		const service = new TranscriptService()
		const mockRecallBot: BotResponseRecall = {
			id: 'recall-bot-123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: [],
			recordings: [
				{
					id: 'recording-456',
					status: { code: 'done', updated_at: '2025-09-13T12:30:00Z' },
					media_shortcuts: {
						transcript: {
							id: 'transcript-789',
							created_at: '2025-09-13T12:25:00Z',
							status: { code: 'done', updated_at: '2025-09-13T12:28:00Z' },
							data: {
								download_url: 'https://s3.amazonaws.com/transcript.json',
								provider_data_download_url: 'https://s3.amazonaws.com/raw.json'
							}
						}
					}
				}
			] as RecordingRecall[],
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

		const mockRawTranscript: RecallTranscript = [
			{
				participant: { id: 1, name: 'Test User', is_host: true, platform: 'google_meet', extra_data: {} },
				words: [
					{
						text: 'Hello',
						start_timestamp: { absolute: '2025-09-13T12:00:00Z', relative: 0 },
						end_timestamp: { absolute: '2025-09-13T12:00:01Z', relative: 1 }
					},
					{
						text: 'world',
						start_timestamp: { absolute: '2025-09-13T12:00:01Z', relative: 1 },
						end_timestamp: { absolute: '2025-09-13T12:00:02Z', relative: 2 }
					}
				]
			}
		]

		const mockParsedTranscript: ParsedTranscript = {
			meeting: {
				duration: 0.03,
				startTime: '2025-09-13T12:00:00Z',
				endTime: '2025-09-13T12:00:01Z',
				platform: 'unknown'
			},
			participants: [
				{
					id: 1,
					name: 'Test User',
					role: 'host',
					totalSpeakingTime: 1,
					segmentCount: 1
				}
			],
			conversation: [
				{
					participant: 'Test User',
					participantId: 1,
					timestamp: '2025-09-13T12:00:00Z',
					startTime: 0,
					endTime: 2,
					duration: 2,
					text: 'Hello world',
					segmentIndex: 1
				}
			]
		}

		spyOn(recall, 'getBot').mockResolvedValue(mockRecallBot)
		spyOn(downloadService, 'downloadTranscript').mockResolvedValue(mockRawTranscript)
		spyOn(parser, 'parseTranscript').mockReturnValue(mockParsedTranscript)
		const saveTranscriptSpy = spyOn(service, 'saveTranscriptToDb').mockResolvedValue()

		const botId = genId('bot')
		const result = await service.downloadAndParseTranscript(botId, 'recall-bot-123')

		expect(result.success).toBe(true)
		expect(result.transcript).toEqual(mockParsedTranscript)
		expect(downloadService.downloadTranscript).toHaveBeenCalledWith('https://s3.amazonaws.com/transcript.json')
		expect(parser.parseTranscript).toHaveBeenCalledWith(mockRawTranscript)

		expect(saveTranscriptSpy).toHaveBeenCalledWith(botId, mockParsedTranscript, mockRawTranscript)
	})

	test('should return error when recording not ready', async () => {
		const service = new TranscriptService()
		const mockRecallBot: BotResponseRecall = {
			id: 'recall-bot-123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: [],
			recordings: [
				{
					id: 'recording-456',
					status: { code: 'processing', updated_at: '2025-09-13T12:30:00Z' }
				}
			] as RecordingRecall[],
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

		spyOn(recall, 'getBot').mockResolvedValue(mockRecallBot)

		const result = await service.downloadAndParseTranscript(genId('bot'), 'recall-bot-123')

		expect(result.success).toBe(false)
		expect(result.error).toBe('Recording not ready for download')
	})

	test('should return error when transcript not ready', async () => {
		const service = new TranscriptService()
		const mockRecallBot: BotResponseRecall = {
			id: 'recall-bot-123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: [],
			recordings: [
				{
					id: 'recording-456',
					status: { code: 'done', updated_at: '2025-09-13T12:30:00Z' },
					media_shortcuts: {
						transcript: {
							id: 'transcript-789',
							created_at: '2025-09-13T12:25:00Z',
							status: { code: 'processing', updated_at: '2025-09-13T12:28:00Z' },
							data: {
								download_url: 'https://s3.amazonaws.com/transcript.json',
								provider_data_download_url: 'https://s3.amazonaws.com/raw.json'
							}
						}
					}
				}
			] as RecordingRecall[],
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

		spyOn(recall, 'getBot').mockResolvedValue(mockRecallBot)

		const result = await service.downloadAndParseTranscript(genId('bot'), 'recall-bot-123')

		expect(result.success).toBe(false)
		expect(result.error).toBe('Transcript not ready for download')
	})

	test('should handle download failure', async () => {
		const service = new TranscriptService()
		const mockRecallBot: BotResponseRecall = {
			id: 'recall-bot-123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: [],
			recordings: [
				{
					id: 'recording-456',
					status: { code: 'done', updated_at: '2025-09-13T12:30:00Z' },
					media_shortcuts: {
						transcript: {
							id: 'transcript-789',
							created_at: '2025-09-13T12:25:00Z',
							status: { code: 'done', updated_at: '2025-09-13T12:28:00Z' },
							data: {
								download_url: 'https://s3.amazonaws.com/transcript.json',
								provider_data_download_url: 'https://s3.amazonaws.com/raw.json'
							}
						}
					}
				}
			] as RecordingRecall[],
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

		spyOn(recall, 'getBot').mockResolvedValue(mockRecallBot)
		spyOn(downloadService, 'downloadTranscript').mockRejectedValue(new Error('Download failed'))

		const result = await service.downloadAndParseTranscript(genId('bot'), 'recall-bot-123')

		expect(result.success).toBe(false)
		expect(result.error).toBe('Failed to download and parse transcript')
	})

	test('should return parsed transcript by event ID successfully', async () => {
		const service = new TranscriptService()
		const mockParsedTranscript: ParsedTranscript = {
			meeting: {
				duration: 30.5,
				startTime: '2025-09-13T12:00:00Z',
				endTime: '2025-09-13T12:30:30Z',
				platform: 'google_meet'
			},
			participants: [],
			conversation: []
		}

		const calendarEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-event-get-transcript',
				title: 'Test Event Get Transcript',
				startTime: new Date(),
				endTime: new Date(),
				googleAccountId: calendarAccountId
			}
		})

		const bot = await db.bot.create({
			data: {
				id: genId('bot'),
				botId: genId('bot'),
				status: 'COMPLETED',
				recallBotId: 'recall-bot-get-transcript-123',
				calendarEventId: calendarEvent.id
			}
		})

		await db.transcript.create({
			data: {
				content: JSON.stringify(mockParsedTranscript),
				rawContent: JSON.stringify([]),
				recallBotId: bot.id
			}
		})

		const result = await service.getTranscriptByEventId(calendarEvent.id, userId)

		expect(result.isOk()).toBe(true)
		expect(result._unsafeUnwrap()).toEqual(mockParsedTranscript)
	})

	test('should return error when event not found for getTranscriptByEventId', async () => {
		const service = new TranscriptService()
		const nonExistentEventId = genId('calendarEvent')

		const result = await service.getTranscriptByEventId(nonExistentEventId, userId)

		expect(result.isErr()).toBe(true)
		expect(result._unsafeUnwrapErr()).toBe('Calendar event not found')
	})

	test('should return error when transcript parse fails', async () => {
		const service = new TranscriptService()

		const calendarEvent = await db.calendarEvent.create({
			data: {
				id: genId('calendarEvent'),
				externalId: 'google-event-invalid-json',
				title: 'Test Event Invalid JSON',
				startTime: new Date(),
				endTime: new Date(),
				googleAccountId: calendarAccountId
			}
		})

		const bot = await db.bot.create({
			data: {
				id: genId('bot'),
				botId: genId('bot'),
				status: 'COMPLETED',
				recallBotId: 'recall-bot-invalid-json-123',
				calendarEventId: calendarEvent.id
			}
		})

		await db.transcript.create({
			data: {
				content: 'invalid-json',
				rawContent: JSON.stringify([]),
				recallBotId: bot.id
			}
		})

		const result = await service.getTranscriptByEventId(calendarEvent.id, userId)

		expect(result.isErr()).toBe(true)
		expect(result._unsafeUnwrapErr()).toBe('Failed to parse transcript')
	})
})
