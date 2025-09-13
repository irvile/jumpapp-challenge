import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import type {
	BotResponseRecall,
	BotStatusChangeRecall,
	CreateBotBodyRecall,
	RecordingRecall
} from '@backend/libs/recall/recall'
import * as RecallClient from '@backend/libs/recall/recall'
import { createMockFetchImplementation } from '@backend/libs/test-utils'

describe('Recall Client', () => {
	afterEach(() => {
		mock.restore()
	})

	test('should create a bot successfully', async () => {
		const mockResponse: BotResponseRecall = {
			id: 'bot_123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: [
				{
					code: 'joining_call',
					message: 'Bot is joining the call',
					timestamp: '2025-09-13T12:00:00Z',
					sub_code: 'joining'
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

		const { mockImplementation, getLastRequest, clearCapturedRequests } = createMockFetchImplementation(mockResponse, {
			status: 201
		})
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		const botInput: CreateBotBodyRecall = {
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
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

		const bot = await RecallClient.createBot(botInput)

		expect(bot).toBeDefined()
		expect(bot).toEqual(mockResponse)

		const req = getLastRequest()
		expect(req).not.toBeNull()
		expect(req?.url).toBe('/bot')
		expect(req?.method).toBe('POST')
		expect(req?.headers?.['content-type']).toBe('application/json; charset=utf-8')
		expect(req?.headers?.authorization).toBe(RecallClient.recallAuthBasic)
		expect(req?.body).toEqual(botInput)
	})

	test('should handle create bot error', async () => {
		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(
			{ error: 'Invalid meeting URL' },
			{ status: 400, statusText: 'Bad Request' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		const botInput: CreateBotBodyRecall = {
			meeting_url: 'invalid-url',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
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

		expect(RecallClient.createBot(botInput)).rejects.toThrow('Failed to create bot: 400 Bad Request')
	})

	test('should get bot successfully', async () => {
		const mockStatusChanges: BotStatusChangeRecall[] = [
			{
				code: 'joining_call',
				message: 'Bot is joining the call',
				timestamp: '2025-09-13T12:00:00Z',
				sub_code: 'joining'
			},
			{
				code: 'in_call_recording',
				message: 'Bot is recording',
				timestamp: '2025-09-13T12:01:00Z',
				sub_code: 'recording'
			},
			{
				code: 'done',
				message: 'Bot has finished recording',
				timestamp: '2025-09-13T12:30:00Z',
				sub_code: 'completed'
			}
		]

		const mockRecordings: RecordingRecall[] = [
			{
				id: 'recording_456',
				status: {
					code: 'done',
					updated_at: '2025-09-13T12:30:00Z'
				},
				media_shortcuts: {
					transcript: {
						id: 'transcript_789',
						created_at: '2025-09-13T12:25:00Z',
						status: {
							code: 'done',
							updated_at: '2025-09-13T12:28:00Z'
						},
						data: {
							download_url: 'https://s3.amazonaws.com/transcript.json',
							provider_data_download_url: 'https://s3.amazonaws.com/raw-data.json'
						}
					}
				}
			}
		]

		const mockResponse: BotResponseRecall = {
			id: 'bot_123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: mockStatusChanges,
			recordings: mockRecordings,
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

		const { mockImplementation, getLastRequest, clearCapturedRequests } = createMockFetchImplementation(mockResponse)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		const bot = await RecallClient.getBot('bot_123')

		expect(bot).toBeDefined()
		expect(bot).toEqual(mockResponse)
		expect(bot.status_changes).toHaveLength(3)
		expect(bot.status_changes[2].code).toBe('done')
		expect(bot.recordings).toHaveLength(1)
		expect(bot.recordings[0].media_shortcuts.transcript.data.download_url).toBeDefined()

		const req = getLastRequest()
		expect(req).not.toBeNull()
		expect(req?.url).toBe('/bot/bot_123')
		expect(req?.method).toBe('GET')
		expect(req?.headers?.authorization).toBe(RecallClient.recallAuthBasic)
	})

	test('should handle get bot not found error', async () => {
		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(
			{ error: 'Bot not found' },
			{ status: 404, statusText: 'Not Found' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		expect(RecallClient.getBot('nonexistent_bot')).rejects.toThrow('Failed to get bot: 404 Not Found')
	})

	test('should handle get bot unauthorized error', async () => {
		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(
			{ error: 'Unauthorized' },
			{ status: 401, statusText: 'Unauthorized' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		expect(RecallClient.getBot('bot_123')).rejects.toThrow('Failed to get bot: 401 Unauthorized')
	})

	test('should delete bot successfully', async () => {
		const { mockImplementation, getLastRequest, clearCapturedRequests } = createMockFetchImplementation(
			{},
			{ status: 204, statusText: 'No Content' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		expect(RecallClient.deleteBot('bot_123')).resolves.toBeUndefined()

		const req = getLastRequest()
		expect(req).not.toBeNull()
		expect(req?.url).toBe('/bot/bot_123')
		expect(req?.method).toBe('DELETE')
	})

	test('should handle delete bot not found error', async () => {
		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(
			{ error: 'Bot not found' },
			{ status: 404, statusText: 'Not Found' }
		)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		expect(RecallClient.deleteBot('nonexistent_bot')).rejects.toThrow('Failed to delete bot: 404 Not Found')
	})

	test('should validate bot status changes flow', async () => {
		const statusChanges: BotStatusChangeRecall[] = [
			{
				code: 'joining_call',
				message: 'Bot is joining the call',
				timestamp: '2025-09-13T12:00:00Z',
				sub_code: 'joining'
			},
			{
				code: 'in_waiting_room',
				message: 'Bot is waiting in room',
				timestamp: '2025-09-13T12:00:30Z',
				sub_code: 'waiting'
			},
			{
				code: 'in_call_recording',
				message: 'Bot is recording the call',
				timestamp: '2025-09-13T12:01:00Z',
				sub_code: 'recording'
			},
			{
				code: 'call_ended',
				message: 'Call has ended',
				timestamp: '2025-09-13T12:29:00Z',
				sub_code: 'ended'
			},
			{
				code: 'recording_done',
				message: 'Recording processing complete',
				timestamp: '2025-09-13T12:29:30Z',
				sub_code: 'processed'
			},
			{
				code: 'done',
				message: 'Bot workflow complete',
				timestamp: '2025-09-13T12:30:00Z',
				sub_code: 'completed'
			}
		]

		const mockResponse: BotResponseRecall = {
			id: 'bot_123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: statusChanges,
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

		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(mockResponse)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		const bot = await RecallClient.getBot('bot_123')

		expect(bot.status_changes).toHaveLength(6)
		expect(bot.status_changes[0].code).toBe('joining_call')
		expect(bot.status_changes[1].code).toBe('in_waiting_room')
		expect(bot.status_changes[2].code).toBe('in_call_recording')
		expect(bot.status_changes[3].code).toBe('call_ended')
		expect(bot.status_changes[4].code).toBe('recording_done')
		expect(bot.status_changes[5].code).toBe('done')

		const lastStatus = bot.status_changes[bot.status_changes.length - 1]
		expect(lastStatus.code).toBe('done')
		expect(lastStatus.timestamp).toBe('2025-09-13T12:30:00Z')
	})

	test('should validate recording with transcript data', async () => {
		const recording: RecordingRecall = {
			id: 'recording_456',
			status: {
				code: 'done',
				updated_at: '2025-09-13T12:30:00Z'
			},
			media_shortcuts: {
				transcript: {
					id: 'transcript_789',
					created_at: '2025-09-13T12:25:00Z',
					status: {
						code: 'done',
						updated_at: '2025-09-13T12:28:00Z'
					},
					data: {
						download_url: 'https://us-west-2-recallai-production-bot-data.s3.amazonaws.com/transcript.json',
						provider_data_download_url: 'https://us-west-2-recallai-production-bot-data.s3.amazonaws.com/raw-data.json'
					}
				}
			}
		}

		const mockResponse: BotResponseRecall = {
			id: 'bot_123',
			meeting_url: 'https://meet.google.com/abc-def-ghi',
			bot_name: 'Test Bot',
			join_at: '2025-09-13T12:00:00Z',
			status_changes: [],
			recordings: [recording],
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

		const { mockImplementation, clearCapturedRequests } = createMockFetchImplementation(mockResponse)
		clearCapturedRequests()

		// @ts-expect-error
		spyOn(RecallClient, 'recallFetch').mockImplementation(mockImplementation)

		const bot = await RecallClient.getBot('bot_123')

		expect(bot.recordings).toHaveLength(1)

		const transcriptData = bot.recordings[0].media_shortcuts.transcript
		expect(transcriptData.id).toBe('transcript_789')
		expect(transcriptData.status.code).toBe('done')
		expect(transcriptData.data.download_url).toMatch(/^https:\/\/.*\.amazonaws\.com\/.*transcript\.json/)
		expect(transcriptData.data.provider_data_download_url).toMatch(/^https:\/\/.*\.amazonaws\.com\/.*raw-data\.json/)

		const downloadUrl = transcriptData.data.download_url
		expect(downloadUrl).toContain('s3.amazonaws.com')
		expect(downloadUrl).toContain('transcript.json')
	})
})
