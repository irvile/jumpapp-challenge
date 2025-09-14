import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Button } from '@web/components/ui/button'
import { dayjs } from '@web/libs/dayjs'
import { Clock, ExternalLink, Users } from 'lucide-react'
import { PlatformBadge } from '../../../components/platform-badge'

interface MeetingInfoCardProps {
	meeting: {
		startTime: string
		endTime: string
		platform: string
		meetingUrl?: string
		location?: string
		attendees?: string
	}
}

export function MeetingInfoCard({ meeting }: MeetingInfoCardProps) {
	const startTime = dayjs(meeting.startTime)
	const endTime = dayjs(meeting.endTime)
	const duration = endTime.diff(startTime, 'minutes')
	const attendees = meeting.attendees ? JSON.parse(meeting.attendees) : []

	const formatTime = (time: dayjs.Dayjs) => {
		return time.format('dddd, MMMM D, YYYY [at] HH:mm')
	}

	return (
		<div className="bg-card rounded-lg border p-6 space-y-6">
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<div className="flex-1">
						<div className="font-medium">{formatTime(startTime)}</div>
						<div className="text-sm text-muted-foreground">
							{duration} minutes • Ends at {endTime.format('HH:mm')}
						</div>
					</div>
				</div>

				<div className="flex items-start justify-between gap-3">
					<PlatformBadge platform={meeting.platform} />
					{meeting.meetingUrl && (
						<Button
							variant="outline"
							size="sm"
							className="h-auto px-3 py-1.5 text-xs"
							onClick={() => window.open(`${meeting.meetingUrl}`, '_blank')}
						>
							Join meeting
							<ExternalLink className="h-3 w-3 ml-1.5 opacity-60" />
						</Button>
					)}
				</div>

				{attendees.length > 0 && (
					<div className="flex flex-col gap-1">
						<p className="text-[13px] font-medium">Attendees</p>
						<div className="flex items-center gap-2">
							{attendees.slice(0, 5).map((attendee: any, index: number) => (
								<Avatar key={attendee.email || index} className="h-6 w-6">
									<AvatarImage src={attendee.avatar} />
									<AvatarFallback className="text-xs">
										{attendee.displayName
											?.split(' ')
											?.map((n: string) => n[0])
											?.join('')
											?.slice(0, 2) ||
											attendee.email?.slice(0, 2).toUpperCase() ||
											'U'}
									</AvatarFallback>
								</Avatar>
							))}
							{attendees.length > 5 && (
								<span className="text-xs text-muted-foreground ml-1">+{attendees.length - 5}</span>
							)}
						</div>
					</div>
				)}

				{meeting.location && (
					<div className="text-sm text-muted-foreground">
						<strong>Location:</strong> {meeting.location}
					</div>
				)}
			</div>
		</div>
	)
}
