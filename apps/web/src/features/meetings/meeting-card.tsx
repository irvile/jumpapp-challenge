import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import { dayjs } from '@web/libs/dayjs'
import { Users } from 'lucide-react'
import type { Meeting, MeetingPlatform } from './types'

interface MeetingCardProps {
	meeting: Meeting
	onClick?: () => void
}

const platformConfig: Record<MeetingPlatform, { color: string; logo: React.ReactNode; name: string }> = {
	zoom: {
		color: 'bg-blue-500',
		logo: <img src="/static/img/zoom.svg" alt="Zoom" className="h-8 w-8" />,
		name: 'Zoom'
	},
	meet: {
		color: 'bg-green-500',
		logo: <img src="/static/img/google-meet.svg" alt="Google Meet" className="h-8 w-8" />,
		name: 'Google Meet'
	},
	teams: {
		color: 'bg-purple-500',
		logo: <img src="/static/img/microsoft-teams.svg" alt="Microsoft Teams" className="h-8 w-8" />,
		name: 'Microsoft Teams'
	}
}

const statusConfig = {
	scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
	in_progress: { color: 'bg-green-100 text-green-800', label: 'In progress' },
	completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
	cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
	const platform = platformConfig[meeting.platform]
	const status = statusConfig[meeting.status]

	const startTime = dayjs(meeting.startTime)
	const endTime = dayjs(meeting.endTime)
	const timeRange = `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`

	const participantCount = meeting.participants.length
	const showParticipants = participantCount > 0

	return (
		<div
			className="w-full mb-2 p-3 text-xs rounded border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] bg-white border-border"
			onClick={onClick}
			role="button"
		>
			<div className="flex items-center justify-between mb-2">
				<div className="font-semibold text-foreground">{timeRange}</div>
				<div className="flex items-center gap-1 ">
					<span className="text-xs text-muted-foreground h-8 w-8">{platform.logo}</span>
				</div>
			</div>

			<div className="font-medium text-sm mb-2 text-foreground truncate">{meeting.title}</div>

			{showParticipants && (
				<div className="flex items-center gap-2 mb-2">
					<Users className="h-3 w-3 text-muted-foreground" />
					<div className="flex items-center gap-1 flex-1 min-w-0">
						{meeting.participants.slice(0, 3).map((participant) => (
							<Avatar key={participant.id} className="h-5 w-5">
								<AvatarImage src={participant.avatar} />
								<AvatarFallback className="text-xs">
									{participant.name
										.split(' ')
										.map((n) => n[0])
										.join('')
										.slice(0, 2)}
								</AvatarFallback>
							</Avatar>
						))}
						{participantCount > 3 && <div className="text-xs text-muted-foreground ml-1">+{participantCount - 3}</div>}
					</div>
				</div>
			)}

			<div className="flex items-center justify-between">
				<Badge variant="secondary" className={`text-xs ${status.color} border-0 flex items-center gap-1`}>
					<span>{status.label}</span>
				</Badge>
			</div>
		</div>
	)
}
