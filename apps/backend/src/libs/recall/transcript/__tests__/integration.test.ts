import { afterAll, describe, expect, it, mock, spyOn } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { downloadTranscript } from '../download.service'
import { generatePrompt, optimizeForLLM } from '../llm-optimizer'
import { parseTranscript } from '../parser'
import type { RecallTranscript, RecordingRecall } from '../types'

const mockRecordingRecall: RecordingRecall = {
	id: 'recording_123',
	status: {
		code: 'done',
		updated_at: '2025-09-13T12:00:00Z'
	},
	media_shortcuts: {
		transcript: {
			id: 'transcript_456',
			created_at: '2025-09-13T11:45:00Z',
			status: {
				code: 'done',
				updated_at: '2025-09-13T11:50:00Z'
			},
			data: {
				download_url: 'https://recall.ai/downloads/diarized-processed1.1.json',
				provider_data_download_url: 'https://recall.ai/downloads/raw-data.json'
			}
		}
	}
}

const fetchSpy = spyOn(global, 'fetch')

afterAll(() => {
	mock.restore()
})

describe('Transcript Integration Flow', () => {
	it('should download and parse real transcript data from Recall API', async () => {
		const filePath = join(__dirname, 'diarized-processed1.1.json')
		const fileContent = readFileSync(filePath, 'utf-8')
		const transcriptData = JSON.parse(fileContent) as RecallTranscript

		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => transcriptData
		} as Response)

		const recording = mockRecordingRecall
		expect(recording.media_shortcuts.transcript.data.download_url).toBeDefined()

		const downloadedTranscript = await downloadTranscript(recording.media_shortcuts.transcript.data.download_url)

		expect(fetchSpy).toHaveBeenCalledWith(recording.media_shortcuts.transcript.data.download_url)
		expect(Array.isArray(downloadedTranscript)).toBe(true)
		expect(downloadedTranscript.length).toBeGreaterThan(0)

		const firstBlock = downloadedTranscript[0]
		expect(firstBlock).toHaveProperty('participant')
		expect(firstBlock).toHaveProperty('words')
		expect(firstBlock.participant).toHaveProperty('id')
		expect(firstBlock.participant).toHaveProperty('name')
		expect(firstBlock.participant).toHaveProperty('is_host')

		const parsed = parseTranscript(downloadedTranscript)

		expect(parsed).toHaveProperty('meeting')
		expect(parsed).toHaveProperty('participants')
		expect(parsed).toHaveProperty('conversation')

		// 5. Valida dados específicos do arquivo real
		expect(parsed.participants).toHaveLength(1)
		expect(parsed.participants[0].name).toBe('Irvile Rodrigues')
		expect(parsed.participants[0].role).toBe('host')
		expect(parsed.participants[0].platformId).toBe('ucOUK7a50yI2S7E57B58v4708mKissla2qF2pTCsF_o=')

		expect(parsed.conversation).toHaveLength(1)
		expect(parsed.conversation[0].participant).toBe('Irvile Rodrigues')
		expect(parsed.conversation[0].text).toContain('Good morning')

		expect(parsed.meeting.platform).toBe('google_meet')
		expect(parsed.meeting.duration).toBeGreaterThan(0)
	})

	it('should optimize real transcript data for LLM consumption', async () => {
		const filePath = join(__dirname, 'diarized-processed1.1.json')
		const fileContent = readFileSync(filePath, 'utf-8')
		const transcriptData = JSON.parse(fileContent) as RecallTranscript

		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => transcriptData
		} as Response)

		const downloadedTranscript = await downloadTranscript(
			mockRecordingRecall.media_shortcuts.transcript.data.download_url
		)
		const parsed = parseTranscript(downloadedTranscript)

		const optimized = optimizeForLLM(parsed)

		expect(optimized.meetingContext).toContain('Duration:')
		expect(optimized.meetingContext).toContain('Platform: google_meet')
		expect(optimized.participantsContext).toContain('Irvile Rodrigues')
		expect(optimized.participantsContext).toContain('Host')
		expect(optimized.conversationText).toContain('Good morning')
		expect(optimized.analyticsContext).toContain('Total Speaking Time')
	})

	it('should generate content prompts from real transcript data', async () => {
		const filePath = join(__dirname, 'diarized-processed1.1.json')
		const fileContent = readFileSync(filePath, 'utf-8')
		const transcriptData = JSON.parse(fileContent) as RecallTranscript

		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => transcriptData
		} as Response)

		const downloadedTranscript = await downloadTranscript(
			mockRecordingRecall.media_shortcuts.transcript.data.download_url
		)
		const parsed = parseTranscript(downloadedTranscript)
		const optimized = optimizeForLLM(parsed)

		const summaryPrompt = generatePrompt(optimized, { type: 'summary' })
		expect(summaryPrompt).toContain('Based on the following meeting transcript')
		expect(summaryPrompt).toContain('Irvile Rodrigues')
		expect(summaryPrompt).toContain('Good morning')

		const linkedinPrompt = generatePrompt(optimized, {
			type: 'linkedin',
			participantName: 'Irvile Rodrigues'
		})
		expect(linkedinPrompt).toContain('Create a professional LinkedIn post')
		expect(linkedinPrompt).toContain('Focus especially on insights and contributions from Irvile Rodrigues')

		const twitterPrompt = generatePrompt(optimized, { type: 'twitter' })
		expect(twitterPrompt).toContain('Create a Twitter thread')
		expect(twitterPrompt).toContain('🧵 1/5')
	})

	it('should handle transcript download flow error scenarios', () => {
		expect(() => parseTranscript([])).toThrow('Invalid transcript data: empty or null')

		const invalidTranscript = [
			{
				participant: {
					id: 100,
					name: 'Test User',
					is_host: true,
					platform: 'unknown'
				},
				words: []
			}
		] as RecallTranscript

		expect(() => parseTranscript(invalidTranscript)).toThrow('No conversation segments found')

		const validMinimalTranscript = [
			{
				participant: {
					id: 100,
					name: 'Test User',
					is_host: true,
					platform: 'unknown'
				},
				words: [
					{
						text: 'Hello',
						start_timestamp: {
							relative: 0,
							absolute: '2025-09-13T11:39:34.094Z'
						},
						end_timestamp: {
							relative: 1,
							absolute: '2025-09-13T11:39:35.094Z'
						}
					}
				]
			}
		] as RecallTranscript

		const result = parseTranscript(validMinimalTranscript)
		expect(result.conversation).toHaveLength(1)
		expect(result.participants).toHaveLength(1)
	})

	it('should validate RecordingRecall structure for download flow', () => {
		expect(mockRecordingRecall.id).toBeDefined()
		expect(mockRecordingRecall.status.code).toBe('done')
		expect(mockRecordingRecall.media_shortcuts.transcript.id).toBeDefined()
		expect(mockRecordingRecall.media_shortcuts.transcript.status.code).toBe('done')
		expect(mockRecordingRecall.media_shortcuts.transcript.data.download_url).toBeDefined()

		const downloadUrl = mockRecordingRecall.media_shortcuts.transcript.data.download_url
		expect(downloadUrl).toMatch(/^https?:\/\//)
		expect(downloadUrl).toContain('json')
	})

	it('should handle real file content structure correctly', () => {
		const filePath = join(__dirname, 'diarized-processed1.1.json')
		const fileContent = readFileSync(filePath, 'utf-8')
		const transcriptData = JSON.parse(fileContent) as RecallTranscript

		expect(Array.isArray(transcriptData)).toBe(true)
		expect(transcriptData.length).toBe(1)

		const block = transcriptData[0]
		expect(block.participant.id).toBe(100)
		expect(block.participant.name).toBe('Irvile Rodrigues')
		expect(block.participant.is_host).toBe(true)
		expect(block.participant.extra_data?.google_meet?.static_participant_id).toBeDefined()

		expect(Array.isArray(block.words)).toBe(true)
		expect(block.words.length).toBeGreaterThan(0)

		const firstWord = block.words[0]
		expect(firstWord.text).toBe('Good')
		expect(firstWord.start_timestamp.relative).toBeDefined()
		expect(firstWord.start_timestamp.absolute).toBeDefined()
		expect(firstWord.end_timestamp.relative).toBeDefined()
		expect(firstWord.end_timestamp.absolute).toBeDefined()
	})

	it('should handle download errors', async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: 'Not Found'
		} as Response)

		expect(downloadTranscript('https://example.com/transcript.json')).rejects.toThrow(
			'Failed to download transcript: 404 Not Found'
		)
	})

	it('should handle network errors', async () => {
		fetchSpy.mockRejectedValueOnce(new Error('Network error'))

		expect(downloadTranscript('https://example.com/transcript.json')).rejects.toThrow('Network error')
	})

	it('should handle invalid JSON response', async () => {
		// @ts-expect-error - test
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => {
				throw new Error('Invalid JSON')
			}
		} as Response)

		expect(downloadTranscript('https://example.com/transcript.json')).rejects.toThrow('Invalid JSON')
	})
})
