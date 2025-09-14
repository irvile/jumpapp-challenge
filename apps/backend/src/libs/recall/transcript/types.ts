export interface RecallWord {
	text: string
	start_timestamp: {
		relative: number
		absolute: string
	}
	end_timestamp: {
		relative: number
		absolute: string
	}
}

export interface RecallParticipant {
	id: number
	name: string
	extra_data?: {
		google_meet?: {
			static_participant_id: string
		}
	}
	is_host: boolean
	platform: string
}

export interface RecallTranscriptBlock {
	participant: RecallParticipant
	words: RecallWord[]
}

export type RecallTranscript = RecallTranscriptBlock[]

export interface RecordingRecall {
	id: string
	status: {
		code: string
		updated_at: string
	}
	media_shortcuts: {
		transcript: {
			id: string
			created_at: string
			status: {
				code: string
				updated_at: string
			}
			data: {
				download_url: string
				provider_data_download_url: string
			}
		}
	}
}

export interface ParsedParticipant {
	id: number
	name: string
	role: 'host' | 'participant'
	platformId?: string
	totalSpeakingTime: number
	segmentCount: number
}

export interface ConversationSegment {
	participant: string
	participantId: number
	timestamp: string
	startTime: number
	endTime: number
	duration: number
	text: string
	segmentIndex: number
}

export interface ParsedTranscript {
	meeting: {
		duration: number
		startTime: string
		endTime: string
		platform: string
	}
	participants: ParsedParticipant[]
	conversation: ConversationSegment[]
}
