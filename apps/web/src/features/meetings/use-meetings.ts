import { dayjs } from '@web/libs/dayjs'
import { useState } from 'react'
import type { Meeting, WeeklyMeetings } from './types'

const createMockMeeting = (
	id: string,
	title: string,
	date: dayjs.Dayjs,
	hour: number,
	minute: number,
	duration: number,
	platform: 'zoom' | 'meet' | 'teams',
	participantNames: string[] = [],
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' = 'scheduled'
): Meeting => {
	const startTime = date.hour(hour).minute(minute).second(0)
	const endTime = startTime.add(duration, 'minute')

	return {
		id,
		title,
		startTime: startTime.toDate(),
		endTime: endTime.toDate(),
		platform,
		meetingUrl: `https://${platform}.us/j/123456789`,
		participants: participantNames.map((name, index) => ({
			id: `participant-${id}-${index}`,
			name,
			email: `${name.toLowerCase().replace(' ', '.')}@company.com`,
			avatar: `https://i.pravatar.cc/32?img=${index + 1}`
		})),
		organizer: {
			id: 'current-user',
			name: 'You',
			email: 'you@company.com',
			avatar: 'https://i.pravatar.cc/32?img=50'
		},
		status,
		description: `Meeting about ${title.toLowerCase()}`
	}
}

const generateMockMeetings = (): Meeting[] => {
	const today = dayjs()
	const meetings: Meeting[] = []

	meetings.push(
		createMockMeeting(
			'1',
			'Daily Standup',
			today.startOf('week').add(1, 'day'),
			9,
			0,
			30,
			'teams',
			['Ana Silva', 'João Santos'],
			'completed'
		),
		createMockMeeting(
			'2',
			'Review de Design',
			today.startOf('week').add(1, 'day'),
			14,
			30,
			60,
			'zoom',
			['Maria Costa', 'Pedro Lima', 'Julia Ferreira'],
			'completed'
		),
		createMockMeeting(
			'3',
			'Planning Sprint',
			today.startOf('week').add(1, 'day'),
			16,
			0,
			90,
			'meet',
			['Todo Time Dev', 'Product Owner'],
			'completed'
		),

		createMockMeeting(
			'4',
			'1:1 com Manager',
			today.startOf('week').add(2, 'day'),
			10,
			0,
			30,
			'zoom',
			['Carlos Manager'],
			'completed'
		),
		createMockMeeting(
			'5',
			'Demo Client',
			today.startOf('week').add(2, 'day'),
			15,
			0,
			60,
			'teams',
			['Client ABC', 'Sales Team'],
			'completed'
		),

		createMockMeeting(
			'6',
			'Tech Talk React',
			today.startOf('week').add(3, 'day'),
			11,
			0,
			45,
			'meet',
			['Tech Team'],
			'completed'
		),
		createMockMeeting(
			'7',
			'Code Review',
			today.startOf('week').add(3, 'day'),
			13,
			30,
			30,
			'zoom',
			['Senior Dev', 'Tech Lead'],
			'completed'
		),
		createMockMeeting(
			'8',
			'Retrospective',
			today.startOf('week').add(3, 'day'),
			17,
			0,
			60,
			'teams',
			['Scrum Master', 'Dev Team'],
			'completed'
		),

		createMockMeeting(
			'9',
			'Morning Sync',
			today,
			8,
			30,
			15,
			'teams',
			['Quick Team'],
			today.hour() > 8 ? 'completed' : 'scheduled'
		),
		createMockMeeting(
			'10',
			'Product Review',
			today,
			11,
			0,
			60,
			'meet',
			['Product Team', 'Stakeholders'],
			today.hour() > 11 ? 'completed' : today.hour() === 11 ? 'in_progress' : 'scheduled'
		),
		createMockMeeting(
			'11',
			'Client Meeting',
			today,
			14,
			0,
			90,
			'zoom',
			['Cliente XYZ', 'Account Manager'],
			today.hour() >= 14 && today.hour() < 15.5 ? 'in_progress' : today.hour() >= 15.5 ? 'completed' : 'scheduled'
		),
		createMockMeeting('12', 'Team Building', today, 18, 0, 60, 'teams', ['All Hands'], 'scheduled'),

		createMockMeeting(
			'13',
			'Weekly Review',
			today.startOf('week').add(5, 'day'),
			9,
			30,
			30,
			'meet',
			['Management'],
			'scheduled'
		),
		createMockMeeting(
			'14',
			'Demo Day',
			today.startOf('week').add(5, 'day'),
			15,
			0,
			120,
			'zoom',
			['All Company'],
			'scheduled'
		),

		createMockMeeting(
			'15',
			'Kick-off New Project',
			today.add(1, 'week').startOf('week').add(1, 'day'),
			10,
			0,
			60,
			'teams',
			['New Project Team'],
			'scheduled'
		),
		createMockMeeting(
			'16',
			'Architecture Review',
			today.add(1, 'week').startOf('week').add(2, 'day'),
			14,
			0,
			90,
			'meet',
			['Tech Leads', 'Architects'],
			'scheduled'
		),
		createMockMeeting(
			'17',
			'Client Onboarding',
			today.add(1, 'week').startOf('week').add(3, 'day'),
			16,
			30,
			45,
			'zoom',
			['New Client', 'Success Team'],
			'scheduled'
		),

		createMockMeeting(
			'18',
			'Monthly Review',
			today.subtract(1, 'week').startOf('week').add(1, 'day'),
			10,
			0,
			60,
			'teams',
			['Directors'],
			'completed'
		),
		createMockMeeting(
			'19',
			'Training Session',
			today.subtract(1, 'week').startOf('week').add(3, 'day'),
			13,
			0,
			120,
			'zoom',
			['HR Team', 'All Staff'],
			'completed'
		),
		createMockMeeting(
			'20',
			'Vendor Meeting',
			today.subtract(1, 'week').startOf('week').add(5, 'day'),
			15,
			30,
			60,
			'meet',
			['External Vendor'],
			'completed'
		)
	)

	return meetings
}

export function useMeetings() {
	const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week').add(1, 'day'))
	const mockMeetings = generateMockMeetings()

	const goToPreviousWeek = () => {
		setCurrentWeek((prev) => prev.subtract(1, 'week'))
	}

	const goToNextWeek = () => {
		setCurrentWeek((prev) => prev.add(1, 'week'))
	}

	const goToCurrentWeek = () => {
		setCurrentWeek(dayjs().startOf('week').add(1, 'day'))
	}

	const weeklyMeetings: WeeklyMeetings = mockMeetings.reduce((acc, meeting) => {
		const meetingDate = dayjs(meeting.startTime)
		const dayKey = meetingDate.format('YYYY-MM-DD')
		const hour = meetingDate.hour()

		if (!acc[dayKey]) {
			acc[dayKey] = {}
		}
		if (!acc[dayKey][hour]) {
			acc[dayKey][hour] = []
		}
		acc[dayKey][hour].push(meeting)
		return acc
	}, {} as WeeklyMeetings)

	const weekStart = currentWeek.startOf('day')
	const weekEnd = currentWeek.add(6, 'day').endOf('day')

	const currentWeekMeetings = mockMeetings.filter((meeting) => {
		const meetingDate = dayjs(meeting.startTime)
		return meetingDate.isAfter(weekStart) && meetingDate.isBefore(weekEnd)
	})

	const getWorkingHours = () => {
		if (currentWeekMeetings.length === 0) {
			return Array.from({ length: 10 }, (_, i) => 8 + i)
		}

		const hours = new Set<number>()
		currentWeekMeetings.forEach((meeting) => {
			hours.add(dayjs(meeting.startTime).hour())
		})

		const sortedHours = Array.from(hours).sort((a, b) => a - b)
		const minHour = Math.min(sortedHours[0], 8)
		const maxHour = Math.max(sortedHours[sortedHours.length - 1], 17)

		return Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i)
	}

	return {
		currentWeek,
		meetings: mockMeetings,
		weeklyMeetings,
		currentWeekMeetings,
		workingHours: getWorkingHours(),
		goToPreviousWeek,
		goToNextWeek,
		goToCurrentWeek
	}
}
