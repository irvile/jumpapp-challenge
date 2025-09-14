import { useQuery } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

type GetMeetingTranscriptParams = {
	googleAccountId: string
	eventId: string
}

async function getMeetingTranscript({ googleAccountId, eventId }: GetMeetingTranscriptParams) {
	const response = await backend.api.v1
		.calendars({ calendarAccountId: googleAccountId })
		.events({ eventId })
		.transcript.get()

	if (response.error) {
		throw new Error('Failed to get transcript')
	}

	return response.data
}

export type MeetingTranscript = Awaited<ReturnType<typeof getMeetingTranscript>>

export function useMeetingTranscript(googleAccountId: string, eventId: string, enabled = true) {
	return useQuery({
		queryKey: ['meeting-transcript', googleAccountId, eventId],
		queryFn: () => getMeetingTranscript({ googleAccountId, eventId }),
		enabled: enabled && !!googleAccountId && !!eventId,
		retry: (failureCount, error) => {
			if (
				error.message.includes('No bot found') ||
				error.message.includes('Bot recording is not completed') ||
				error.message.includes('not ready for download')
			) {
				return failureCount < 3
			}
			return false
		},
		retryDelay: 5000
	})
}
