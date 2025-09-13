import type { CalendarEventListItem } from '../calendar-accounts/queries/use-calendar-events'

export type MeetingPlatform = 'zoom' | 'meet' | 'teams'

export interface WeeklyMeetings {
	[dayKey: string]: {
		[hour: number]: CalendarEventListItem['events']
	}
}
