export type MeetingPlatform = 'zoom' | 'meet' | 'teams'

export interface Meeting {
	id: string
	title: string
	startTime: Date
	endTime: Date
	platform: MeetingPlatform
	meetingUrl: string
	participants: {
		id: string
		name: string
		email: string
		avatar?: string
	}[]
	organizer: {
		id: string
		name: string
		email: string
		avatar?: string
	}
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
	description?: string
}

export interface WeeklyMeetings {
	[dayKey: string]: {
		[hour: number]: Meeting[]
	}
}