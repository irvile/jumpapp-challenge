import { createFileRoute, useParams } from '@tanstack/react-router'
import { BotControls } from '@web/features/meetings/components/bot-controls'
import { ContentPlayground } from '@web/features/meetings/components/content-playground'
import { MeetingHeader } from '@web/features/meetings/components/meeting-header'
import { MeetingInfoCard } from '@web/features/meetings/components/meeting-info-card'
import { MeetingTranscript } from '@web/features/meetings/components/meeting-transcript'
import { useMeetingDetails } from '@web/features/meetings/hooks/use-meeting-details'
import { useMeetingTranscript } from '@web/features/meetings/queries/use-meeting-transcript'
import { dayjs } from '@web/libs/dayjs'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/app/meetings/$id')({
	component: MeetingDetailsPage
})

function MeetingDetailsPage() {
	const { id } = useParams({ from: '/app/meetings/$id' })
	const { data: meetingDetails, isLoading: isLoadingMeeting } = useMeetingDetails(id)

	if (isLoadingMeeting) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		)
	}

	if (!meetingDetails) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-lg font-semibold">Meeting not found</h2>
					<p className="text-muted-foreground">The meeting you're looking for doesn't exist.</p>
				</div>
			</div>
		)
	}

	return <MeetingDetailsContent meeting={meetingDetails} />
}

function MeetingDetailsContent({ meeting }: { meeting: any }) {
	const startTime = dayjs(meeting.startTime)
	const isPastEvent = startTime.isBefore(dayjs())

	const { data: transcript } = useMeetingTranscript(meeting.googleAccountId, meeting.id, isPastEvent && meeting.hasBot)

	return (
		<div className="min-h-screen bg-background">
			<MeetingHeader title={meeting.title} />

			<div className="container mx-auto px-4 max-w-6xl">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-1 space-y-6">
						<MeetingInfoCard meeting={meeting} />
						<BotControls meeting={meeting} />
						<MeetingTranscript meeting={meeting} isPastEvent={isPastEvent} botEnabled={meeting.hasBot} />
					</div>

					<div className="lg:col-span-2">
						<ContentPlayground
							transcript={transcript}
							meetingId={meeting.id}
							disabled={!isPastEvent || !meeting.hasBot}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
