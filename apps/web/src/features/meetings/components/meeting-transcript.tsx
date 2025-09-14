import { Label } from '@web/components/ui/label'
import { genereateFrontendId } from '@web/libs/utils'
import { AlertCircle, FileText, Loader2 } from 'lucide-react'
import { useMeetingTranscript } from '../queries/use-meeting-transcript'

interface MeetingTranscriptProps {
	meeting: {
		id: string
		googleAccountId: string
	}
	isPastEvent: boolean
	botEnabled: boolean
}

export function MeetingTranscript({ meeting, isPastEvent, botEnabled }: MeetingTranscriptProps) {
	const {
		data: transcript,
		isLoading: isLoadingTranscript,
		error: transcriptError
	} = useMeetingTranscript(meeting.googleAccountId, meeting.id, isPastEvent && botEnabled)

	if (!isPastEvent || !botEnabled) {
		return null
	}

	return (
		<div className="border-t pt-4">
			<div className="flex items-center gap-2 mb-4">
				<FileText className="h-4 w-4" />
				<Label className="font-medium">Meeting Transcript</Label>
			</div>

			{isLoadingTranscript && (
				<div className="flex items-center justify-center p-8">
					<div className="text-center">
						<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
						<p className="text-sm text-muted-foreground">Loading transcript...</p>
					</div>
				</div>
			)}

			{transcriptError && (
				<div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
					<AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
					<div className="text-sm text-red-700">
						{transcriptError.message.includes('No bot found')
							? 'No recording bot was found for this meeting.'
							: transcriptError.message.includes('not completed')
								? 'Recording is still being processed. Please try again later.'
								: transcriptError.message.includes('not ready')
									? 'Transcript is being generated. Please try again in a few minutes.'
									: 'Failed to load transcript. Please try again later.'}
					</div>
				</div>
			)}

			{transcript?.transcript && (
				<div className="max-h-96 overflow-y-auto">
					<div className="p-4 bg-muted/30 rounded-lg border">
						<div className="prose prose-sm max-w-none">
							<div className="space-y-3">
								{transcript.transcript.conversation.map((segment) => (
									<div key={genereateFrontendId()} className="text-sm">
										<div className="font-medium text-foreground mb-1">{segment.participant}:</div>
										<div className="text-muted-foreground leading-relaxed pl-2">{segment.text}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{!isLoadingTranscript && !transcriptError && !transcript?.transcript && (
				<div className="flex items-center justify-center p-8">
					<div className="text-center">
						<FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
						<p className="text-sm text-muted-foreground">No transcript available yet.</p>
					</div>
				</div>
			)}
		</div>
	)
}