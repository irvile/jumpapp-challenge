import { describe, expect, it } from 'bun:test'
import { parseTranscript } from '../parser'
import type { RecallTranscript } from '../types'

const mockRecallData: RecallTranscript = [
	{
		participant: {
			id: 100,
			name: 'Irvile Rodrigues',
			extra_data: {
				google_meet: {
					static_participant_id: 'ucOUK7a50yI2S7E57B58v4708mKissla2qF2pTCsF_o='
				}
			},
			is_host: true,
			platform: 'unknown'
		},
		words: [
			{
				text: 'Good',
				start_timestamp: {
					relative: 11.537663,
					absolute: '2025-09-13T11:39:34.094Z'
				},
				end_timestamp: {
					relative: 11.737663,
					absolute: '2025-09-13T11:39:34.294Z'
				}
			},
			{
				text: 'morning.',
				start_timestamp: {
					relative: 11.737663,
					absolute: '2025-09-13T11:39:34.294Z'
				},
				end_timestamp: {
					relative: 12.097663,
					absolute: '2025-09-13T11:39:34.654Z'
				}
			}
		]
	},
	{
		participant: {
			id: 101,
			name: 'John Doe',
			is_host: false,
			platform: 'unknown'
		},
		words: [
			{
				text: 'Hello',
				start_timestamp: {
					relative: 15.0,
					absolute: '2025-09-13T11:39:37.557Z'
				},
				end_timestamp: {
					relative: 15.5,
					absolute: '2025-09-13T11:39:38.057Z'
				}
			}
		]
	}
]

describe('parseTranscript', () => {
	it('should parse recall transcript data correctly', () => {
		const result = parseTranscript(mockRecallData)

		expect(result).toHaveProperty('meeting')
		expect(result).toHaveProperty('participants')
		expect(result).toHaveProperty('conversation')
	})

	it('should create conversation segments from participant blocks', () => {
		const result = parseTranscript(mockRecallData)

		expect(result.conversation).toHaveLength(2)

		const firstSegment = result.conversation[0]
		expect(firstSegment.participant).toBe('Irvile Rodrigues')
		expect(firstSegment.participantId).toBe(100)
		expect(firstSegment.text).toBe('Good morning.')
		expect(firstSegment.segmentIndex).toBe(1)
	})

	it('should create participants info with correct roles', () => {
		const result = parseTranscript(mockRecallData)

		expect(result.participants).toHaveLength(2)

		const hostParticipant = result.participants.find((p) => p.id === 100)
		expect(hostParticipant?.role).toBe('host')
		expect(hostParticipant?.name).toBe('Irvile Rodrigues')
		expect(hostParticipant?.platformId).toBe('ucOUK7a50yI2S7E57B58v4708mKissla2qF2pTCsF_o=')

		const regularParticipant = result.participants.find((p) => p.id === 101)
		expect(regularParticipant?.role).toBe('participant')
		expect(regularParticipant?.name).toBe('John Doe')
	})

	it('should calculate speaking time and segment count correctly', () => {
		const result = parseTranscript(mockRecallData)

		const firstParticipant = result.participants.find((p) => p.id === 100)
		expect(firstParticipant?.segmentCount).toBe(1)
		expect(firstParticipant?.totalSpeakingTime).toBeCloseTo(0.56, 2)

		const secondParticipant = result.participants.find((p) => p.id === 101)
		expect(secondParticipant?.segmentCount).toBe(1)
		expect(secondParticipant?.totalSpeakingTime).toBe(0.5)
	})

	it('should create meeting info with correct duration and platform', () => {
		const result = parseTranscript(mockRecallData)

		expect(result.meeting.platform).toBe('google_meet')
		expect(result.meeting.duration).toBeGreaterThan(0)
		expect(result.meeting.startTime).toBe('2025-09-13T11:39:34.094Z')
	})

	it('should detect platform as unknown when no google meet data', () => {
		const dataWithoutGoogleMeet: RecallTranscript = [
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
		]

		const result = parseTranscript(dataWithoutGoogleMeet)
		expect(result.meeting.platform).toBe('unknown')
	})

	it('should throw error for empty transcript data', () => {
		expect(() => parseTranscript([])).toThrow('Invalid transcript data: empty or null')
		// @ts-expect-error - test error
		expect(() => parseTranscript(null)).toThrow('Invalid transcript data: empty or null')
	})

	it('should handle participant blocks with no words', () => {
		const dataWithEmptyWords: RecallTranscript = [
			{
				participant: {
					id: 100,
					name: 'Test User',
					is_host: true,
					platform: 'unknown'
				},
				words: []
			},
			{
				participant: {
					id: 101,
					name: 'Another User',
					is_host: false,
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
		]

		const result = parseTranscript(dataWithEmptyWords)
		expect(result.conversation).toHaveLength(1)
		expect(result.participants).toHaveLength(2)
	})
})
