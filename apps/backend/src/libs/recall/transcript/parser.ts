import type { ConversationSegment, ParsedParticipant, ParsedTranscript, RecallTranscript } from './types'

export function parseTranscript(recallData: RecallTranscript): ParsedTranscript {
	if (!recallData || recallData.length === 0) {
		throw new Error('Invalid transcript data: empty or null')
	}

	const segments = createConversationSegments(recallData)
	const participants = createParticipantsInfo(recallData, segments)
	const meeting = createMeetingInfo(segments, participants)

	return {
		meeting,
		participants,
		conversation: segments
	}
}

function createConversationSegments(recallData: RecallTranscript): ConversationSegment[] {
	const segments: ConversationSegment[] = []

	for (const participantBlock of recallData) {
		if (!participantBlock.words || participantBlock.words.length === 0) {
			continue
		}

		const words = participantBlock.words
		const firstWord = words[0]
		const lastWord = words[words.length - 1]

		const text = words
			.map((word) => word.text)
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim()

		segments.push({
			participant: participantBlock.participant.name,
			participantId: participantBlock.participant.id,
			timestamp: firstWord.start_timestamp.absolute,
			startTime: firstWord.start_timestamp.relative,
			endTime: lastWord.end_timestamp.relative,
			duration: lastWord.end_timestamp.relative - firstWord.start_timestamp.relative,
			text,
			segmentIndex: 0
		})
	}

	const sortedSegments = segments.sort((a, b) => a.startTime - b.startTime)

	return sortedSegments.map((segment, index) => ({
		...segment,
		segmentIndex: index + 1
	}))
}

function createParticipantsInfo(recallData: RecallTranscript, segments: ConversationSegment[]): ParsedParticipant[] {
	const participantsMap = new Map<number, ParsedParticipant>()

	for (const block of recallData) {
		const participant = block.participant

		if (!participantsMap.has(participant.id)) {
			participantsMap.set(participant.id, {
				id: participant.id,
				name: participant.name,
				role: participant.is_host ? 'host' : 'participant',
				platformId: participant.extra_data?.google_meet?.static_participant_id,
				totalSpeakingTime: 0,
				segmentCount: 0
			})
		}
	}

	for (const segment of segments) {
		const participant = participantsMap.get(segment.participantId)
		if (participant) {
			participant.totalSpeakingTime += segment.duration
			participant.segmentCount += 1
		}
	}

	return Array.from(participantsMap.values()).sort((a, b) => a.id - b.id)
}

function createMeetingInfo(
	segments: ConversationSegment[],
	participants: ParsedParticipant[]
): ParsedTranscript['meeting'] {
	if (segments.length === 0) {
		throw new Error('No conversation segments found')
	}

	const firstSegment = segments[0]
	const lastSegment = segments[segments.length - 1]

	const platform = detectPlatform(participants)

	return {
		duration: Math.round(((lastSegment.endTime - firstSegment.startTime) / 60) * 100) / 100,
		startTime: firstSegment.timestamp,
		endTime: lastSegment.timestamp,
		platform
	}
}

function detectPlatform(participants: ParsedParticipant[]): string {
	const hasGoogleMeetId = participants.some((p) => p.platformId)

	if (hasGoogleMeetId) {
		return 'google_meet'
	}

	return 'unknown'
}
