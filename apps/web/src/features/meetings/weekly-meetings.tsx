import { Card, CardContent } from '@web/components/ui/card'
import { dayjs } from '@web/libs/dayjs'
import { MeetingCard } from './meeting-card'
import type { WeeklyMeetings as WeeklyMeetingsType } from './types'

interface WeeklyMeetingsProps {
	currentWeek: dayjs.Dayjs
	weeklyMeetings: WeeklyMeetingsType
	workingHours: number[]
}

export function WeeklyMeetings({ currentWeek, weeklyMeetings, workingHours }: WeeklyMeetingsProps) {
	const weekDays = Array.from({ length: 7 }, (_, i) => currentWeek.add(i, 'day'))

	const isToday = (date: dayjs.Dayjs) => {
		return date.isSame(dayjs(), 'day')
	}

	return (
		<Card className="@container/card">
			<CardContent className="p-0">
				<div className="w-full overflow-x-auto">
					<div className="min-w-[800px]">
						<div className="grid grid-cols-8 border-b">
							<div className="p-4 border-r bg-muted/30 flex items-center justify-center">
								<div className="text-center">
									<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hours</div>
									<div className="text-[10px] text-muted-foreground/70 mt-0.5">Meetings</div>
								</div>
							</div>
							{weekDays.map((day) => (
								<div
									key={day.format('YYYY-MM-DD')}
									className={`p-4 border-r text-center relative group hover:bg-muted/40 transition-colors ${
										isToday(day) ? 'bg-primary/10 border-b-2 border-b-primary' : 'bg-muted/30'
									}`}
								>
									<div className="flex flex-col items-center gap-1">
										<div
											className={`text-xs font-bold uppercase tracking-widest ${
												isToday(day) ? 'text-primary' : 'text-muted-foreground'
											}`}
										>
											{day.format('ddd')}
										</div>
										<div
											className={`text-2xl font-bold tabular-nums ${isToday(day) ? 'text-primary' : 'text-foreground'}`}
										>
											{day.format('DD')}
										</div>
										<div
											className={`text-xs font-medium ${isToday(day) ? 'text-primary/70' : 'text-muted-foreground/70'}`}
										>
											{day.format('MMM').toLowerCase()}
										</div>
									</div>

									{isToday(day) && (
										<div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
									)}

									<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary/40 group-hover:w-8 transition-all duration-200"></div>
								</div>
							))}
						</div>

						{workingHours.map((hour) => (
							<div key={hour} className="grid grid-cols-8 border-b min-h-[100px]">
								<div className="p-3 border-r bg-muted/10 flex items-center justify-center relative group">
									<div className="text-center">
										<div className="text-base font-bold text-foreground/80 tabular-nums">
											{String(hour).padStart(2, '0')}:00
										</div>
									</div>
									<div className="absolute left-0 top-1/2 w-1 h-6 bg-primary/20 rounded-r-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
								</div>

								{weekDays.map((day) => {
									const dayKey = day.format('YYYY-MM-DD')
									const dayMeetings = weeklyMeetings[dayKey]?.[hour] || []

									return (
										<div
											key={`${dayKey}-${hour}`}
											className={`p-2 border-r min-h-[100px] ${isToday(day) ? 'bg-primary/5' : ''}`}
										>
											{dayMeetings.map((meeting) => (
												<MeetingCard key={meeting.id} meeting={meeting} />
											))}
										</div>
									)
								})}
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
