import { createFileRoute } from '@tanstack/react-router'
import { GoogleAccountSwitcher } from '@web/features/calendar-accounts/google-account-switcher'
import { useCalendarAccounts } from '@web/features/calendar-accounts/queries/use-calendar-accounts'
import {
	type CalendarEventListItem,
	useCalendarEvents
} from '@web/features/calendar-accounts/queries/use-calendar-events'
import { WeekNavigation } from '@web/features/meetings/week-navigation'
import { WeeklyMeetings } from '@web/features/meetings/weekly-meetings'
import { useMultipleBotPolling } from '@web/features/meetings/hooks/use-multiple-bot-polling'
import { dayjs } from '@web/libs/dayjs'
import { AlertCircle, Video } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/app/meetings/')({
	component: RouteComponent
})

function RouteComponent() {
	const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week').add(1, 'day'))
	const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>()

	const { data: calendarAccounts, isLoading: isLoadingAccounts } = useCalendarAccounts()
	const primaryAccount = calendarAccounts?.[0]

	const activeAccountId = selectedAccountId || primaryAccount?.id

	const { data: eventsData, isLoading: isLoadingEvents } = useCalendarEvents(activeAccountId, currentWeek)
	
	useMultipleBotPolling(eventsData?.events || [], activeAccountId)

	const goToPreviousWeek = () => {
		setCurrentWeek((prev) => prev.subtract(1, 'week'))
	}

	const goToNextWeek = () => {
		setCurrentWeek((prev) => prev.add(1, 'week'))
	}

	const goToCurrentWeek = () => {
		setCurrentWeek(dayjs().startOf('week').add(1, 'day'))
	}

	const organizeEventsByDayHour = () => {
		if (!eventsData?.events) return {}

		const weeklyMeetings: Record<string, Record<number, CalendarEventListItem['events']>> = {}

		eventsData.events.forEach((event) => {
			const eventDate = dayjs(event.startTime)
			const dayKey = eventDate.format('YYYY-MM-DD')
			const hour = eventDate.hour()

			if (!weeklyMeetings[dayKey]) {
				weeklyMeetings[dayKey] = {}
			}
			if (!weeklyMeetings[dayKey][hour]) {
				weeklyMeetings[dayKey][hour] = []
			}

			weeklyMeetings[dayKey][hour].push(event)
		})

		return weeklyMeetings
	}

	const getWorkingHours = () => {
		if (!eventsData?.events || eventsData.events.length === 0) {
			return Array.from({ length: 10 }, (_, i) => 8 + i)
		}

		const hours = new Set<number>()
		eventsData.events.forEach((event) => {
			hours.add(dayjs(event.startTime).hour())
		})

		const sortedHours = Array.from(hours).sort((a, b) => a - b)
		const minHour = Math.min(sortedHours[0] || 8, 8)
		const maxHour = Math.max(sortedHours[sortedHours.length - 1] || 17, 17)

		return Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i)
	}

	if (isLoadingAccounts) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-sm text-muted-foreground">Loading calendar accounts...</p>
				</div>
			</div>
		)
	}

	if (!primaryAccount) {
		return (
			<div className="flex flex-col h-full">
				<div className="mb-6 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
					<div className="flex items-center gap-3">
						<div className="bg-primary/10 p-2 rounded-lg">
							<Video className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
							<p className="text-muted-foreground">Your meetings in a weekly format</p>
						</div>
					</div>
				</div>

				<GoogleAccountSwitcher selectedAccountId={activeAccountId} onAccountChange={setSelectedAccountId} />

				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium mb-2">No Google Account Connected</h3>
						<p className="text-muted-foreground mb-4">Connect your Google account to view your calendar events.</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full">
			<div className="mb-6 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
				<div className="flex items-center gap-3">
					<div className="bg-primary/10 p-2 rounded-lg">
						<Video className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
						<p className="text-muted-foreground">Your meetings in a weekly format</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<GoogleAccountSwitcher selectedAccountId={activeAccountId} onAccountChange={setSelectedAccountId} />
				</div>
			</div>

			<div className="mb-6">
				<WeekNavigation
					currentWeek={currentWeek}
					onPreviousWeek={goToPreviousWeek}
					onNextWeek={goToNextWeek}
					onCurrentWeek={goToCurrentWeek}
				/>
			</div>

			<div className="flex-1 overflow-auto max-h-[calc(100vh-200px)]">
				{isLoadingEvents ? (
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
							<p className="mt-2 text-sm text-muted-foreground">Loading calendar events...</p>
						</div>
					</div>
				) : (
					<WeeklyMeetings
						currentWeek={currentWeek}
						weeklyMeetings={organizeEventsByDayHour()}
						workingHours={getWorkingHours()}
					/>
				)}
			</div>
		</div>
	)
}
