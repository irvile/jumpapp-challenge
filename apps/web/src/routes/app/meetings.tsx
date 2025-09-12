import { createFileRoute } from '@tanstack/react-router'
import { useMeetings } from '@web/features/meetings/use-meetings'
import { WeekNavigation } from '@web/features/meetings/week-navigation'
import { WeeklyMeetings } from '@web/features/meetings/weekly-meetings'
import { Calendar, Video } from 'lucide-react'

export const Route = createFileRoute('/app/meetings')({
	component: RouteComponent
})

function RouteComponent() {
	const { currentWeek, weeklyMeetings, workingHours, goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useMeetings()

	const handleMeetingClick = (meetingId: string) => {
		console.log('Clicked meeting:', meetingId)
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
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Calendar className="h-4 w-4" />
					<span>
						Week of {currentWeek.format('DD/MM')} to {currentWeek.add(6, 'day').format('DD/MM/YYYY')}
					</span>
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

			<div className="flex-1 overflow-hidden">
				<WeeklyMeetings
					currentWeek={currentWeek}
					weeklyMeetings={weeklyMeetings}
					workingHours={workingHours}
					onMeetingClick={handleMeetingClick}
				/>
			</div>
		</div>
	)
}
