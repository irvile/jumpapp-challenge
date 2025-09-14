import { describe, expect, it } from 'bun:test'
import { generatePrompt, optimizeForLLM } from '../llm-optimizer'
import type { ParsedTranscript } from '../types'

const mockParsedTranscript: ParsedTranscript = {
	meeting: {
		duration: 5.5,
		startTime: '2025-09-13T11:39:34.094Z',
		endTime: '2025-09-13T11:39:39.594Z',
		platform: 'google_meet'
	},
	participants: [
		{
			id: 100,
			name: 'Irvile Rodrigues',
			role: 'host',
			platformId: 'ucOUK7a50yI2S7E57B58v4708mKissla2qF2pTCsF_o=',
			totalSpeakingTime: 180,
			segmentCount: 3
		},
		{
			id: 101,
			name: 'John Doe',
			role: 'participant',
			totalSpeakingTime: 120,
			segmentCount: 2
		}
	],
	conversation: [
		{
			participant: 'Irvile Rodrigues',
			participantId: 100,
			timestamp: '2025-09-13T11:39:34.094Z',
			startTime: 11.537663,
			endTime: 12.097663,
			duration: 0.56,
			text: 'Good morning. How are you today?',
			segmentIndex: 1
		},
		{
			participant: 'John Doe',
			participantId: 101,
			timestamp: '2025-09-13T11:39:37.557Z',
			startTime: 15.0,
			endTime: 15.5,
			duration: 0.5,
			text: 'Hello there!',
			segmentIndex: 2
		}
	]
}

describe('optimizeForLLM', () => {
	it('should create LLM optimized transcript with all required sections', () => {
		const result = optimizeForLLM(mockParsedTranscript)

		expect(result).toHaveProperty('meetingContext')
		expect(result).toHaveProperty('participantsContext')
		expect(result).toHaveProperty('conversationText')
		expect(result).toHaveProperty('analyticsContext')
	})

	it('should format meeting context correctly', () => {
		const result = optimizeForLLM(mockParsedTranscript)

		expect(result.meetingContext).toContain('Duration: 5.5 minutes')
		expect(result.meetingContext).toContain('Platform: google_meet')
		expect(result.meetingContext).toContain('Total Participants: 2')
	})

	it('should format participants context with speaking times', () => {
		const result = optimizeForLLM(mockParsedTranscript)

		expect(result.participantsContext).toContain('Irvile Rodrigues (Host): 3 minutes speaking, 3 contributions')
		expect(result.participantsContext).toContain('John Doe: 2 minutes speaking, 2 contributions')
	})

	it('should format conversation with timestamps', () => {
		const result = optimizeForLLM(mockParsedTranscript)

		expect(result.conversationText).toContain('[11:39:34 AM] Irvile Rodrigues: Good morning. How are you today?')
		expect(result.conversationText).toContain('[11:39:37 AM] John Doe: Hello there!')
	})

	it('should format analytics context with percentages', () => {
		const result = optimizeForLLM(mockParsedTranscript)

		expect(result.analyticsContext).toContain('Total Speaking Time: 5 minutes')
		expect(result.analyticsContext).toContain('Irvile Rodrigues: 60%')
		expect(result.analyticsContext).toContain('John Doe: 40%')
		expect(result.analyticsContext).toContain('Total Segments: 2')
	})
})

describe('generatePrompt', () => {
	const optimizedTranscript = optimizeForLLM(mockParsedTranscript)

	it('should generate summary prompt correctly', () => {
		const prompt = generatePrompt(optimizedTranscript, { type: 'summary' })

		expect(prompt).toContain('Based on the following meeting transcript, create a comprehensive meeting summary')
		expect(prompt).toContain('Key Discussion Points')
		expect(prompt).toContain('Decisions Made')
		expect(prompt).toContain('Action Items')
		expect(prompt).toContain('Next Steps')
		expect(prompt).toContain(optimizedTranscript.meetingContext)
	})

	it('should generate LinkedIn prompt correctly', () => {
		const prompt = generatePrompt(optimizedTranscript, {
			type: 'linkedin',
			participantName: 'Irvile Rodrigues'
		})

		expect(prompt).toContain('Create a professional LinkedIn post')
		expect(prompt).toContain('Focus especially on insights and contributions from Irvile Rodrigues')
		expect(prompt).toContain('Professional tone suitable for LinkedIn')
		expect(prompt).toContain('Do not mention private/confidential details')
	})

	it('should generate Twitter prompt correctly', () => {
		const prompt = generatePrompt(optimizedTranscript, {
			type: 'twitter',
			participantName: 'John Doe'
		})

		expect(prompt).toContain('Create a Twitter thread')
		expect(prompt).toContain('Highlight quotes or insights from John Doe')
		expect(prompt).toContain('3-5 tweets maximum')
		expect(prompt).toContain('Each tweet under 280 characters')
		expect(prompt).toContain('🧵 1/5 [Tweet content]')
	})

	it('should generate LinkedIn prompt without participant name', () => {
		const prompt = generatePrompt(optimizedTranscript, { type: 'linkedin' })

		expect(prompt).toContain('Focus on the most valuable insights shared')
		expect(prompt).not.toContain('Focus especially on insights and contributions from')
	})

	it('should generate Twitter prompt without participant name', () => {
		const prompt = generatePrompt(optimizedTranscript, { type: 'twitter' })

		expect(prompt).toContain('Focus on the most engaging insights')
		expect(prompt).not.toContain('Highlight quotes or insights from')
	})

	it('should throw error for unsupported content type', () => {
		// @ts-expect-error - test error
		expect(() => generatePrompt(optimizedTranscript, { type: 'unsupported' })).toThrow(
			'Unsupported content type: unsupported'
		)
	})
})
