import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@web/components/ui/dialog'
import { Label } from '@web/components/ui/label'
import { Switch } from '@web/components/ui/switch'
import { dayjs } from '@web/libs/dayjs'
import { genereateFrontendId } from '@web/libs/utils'
import { backend } from '@web/services/backend-api'
import { AlertCircle, Bot, Calendar, Clock, ExternalLink, FileText, Loader2, Users } from 'lucide-react'
import { useState } from 'react'
import type { CalendarEventListItem } from '../calendar-accounts/queries/use-calendar-events'
import { useMeetingTranscript } from './queries/use-meeting-transcript'

interface MeetingDialogProps {
	googleAccountId: string
	event: CalendarEventListItem['events'][0]
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function MeetingDialog({ googleAccountId, event, open, onOpenChange }: MeetingDialogProps) {
	const queryClient = useQueryClient()
	const [botEnabled, setBotEnabled] = useState(event.hasBot)

	const startTime = dayjs(event.startTime)
	const endTime = dayjs(event.endTime)
	const duration = endTime.diff(startTime, 'minutes')
	const isPastEvent = startTime.isBefore(dayjs())
	const attendees = event.attendees ? JSON.parse(event.attendees) : []

	const {
		data: transcript,
		isLoading: isLoadingTranscript,
		error: transcriptError
	} = useMeetingTranscript(googleAccountId, event.id, isPastEvent && botEnabled)

	const botToggleMutation = useMutation({
		mutationFn: async (enabled: boolean) => {
			const response = await backend.api.v1
				.calendars({ calendarAccountId: googleAccountId })
				.events({ eventId: event.id })
				.bot.put({
					enabled
				})

			console.log('response', JSON.stringify(response.error, null, 2))
			if (response.error) {
				throw new Error(response.error.value || 'Failed to toggle bot')
			}

			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
		},
		onError: (error) => {
			setBotEnabled(!botEnabled)
			console.error('Failed to toggle bot:', error)
		}
	})

	const handleBotToggle = (enabled: boolean) => {
		setBotEnabled(enabled)
		botToggleMutation.mutate(enabled)
	}

	const formatTime = (time: dayjs.Dayjs) => {
		return time.format('dddd, MMMM D, YYYY [at] HH:mm')
	}

	const platformConfig: Record<string, { name: string; color: string }> = {
		'ZOOM': { name: 'Zoom', color: 'bg-blue-500' },
		'GOOGLE_MEET': { name: 'Google Meet', color: 'bg-green-500' },
		'MICROSOFT_TEAMS': { name: 'Microsoft Teams', color: 'bg-purple-500' }
	}

	const platform = platformConfig[event.platform || 'ZOOM'] || platformConfig['ZOOM']

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						{event.title}
					</DialogTitle>
					<DialogDescription>Meeting details and notetaker settings</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
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

						{event.platform && (
							<div className="flex items-center gap-3">
								<div className={`h-4 w-4 rounded ${platform.color}`} />
								<div className="flex-1">
									<div className="font-medium">{platform.name}</div>
									{event.meetingUrl && (
										<Button
											variant="link"
											className="h-auto p-0 text-sm text-muted-foreground"
											onClick={() => window.open(`${event.meetingUrl}`, '_blank')}
										>
											Join meeting <ExternalLink className="h-3 w-3 ml-1" />
										</Button>
									)}
								</div>
							</div>
						)}

						{attendees.length > 0 && (
							<div className="flex items-center gap-3">
								<Users className="h-4 w-4 text-muted-foreground" />
								<div className="flex-1">
									<div className="font-medium">{attendees.length} attendees</div>
									<div className="flex items-center gap-2 mt-2">
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
											<span className="text-xs text-muted-foreground ml-1">+{attendees.length - 5} more</span>
										)}
									</div>
								</div>
							</div>
						)}

						{event.location && (
							<div className="text-sm text-muted-foreground">
								<strong>Location:</strong> {event.location}
							</div>
						)}
					</div>

					<div className="border-t pt-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label htmlFor="bot-toggle" className="flex items-center gap-2">
									<Bot className="h-4 w-4" />
									Request Notetaker
								</Label>
								<div className="text-sm text-muted-foreground">
									{isPastEvent
										? 'Cannot add notetaker to past events'
										: 'Add an AI notetaker to record and transcribe this meeting'}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{botToggleMutation.isPending && <div className="text-xs text-muted-foreground">Updating...</div>}
								<Switch
									checked={botEnabled}
									onCheckedChange={handleBotToggle}
									disabled={isPastEvent || botToggleMutation.isPending}
								/>
							</div>
						</div>

						{botEnabled && (
							<div className="mt-3 p-3 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="flex items-center gap-1">
										<Bot className="h-3 w-3" />
										Notetaker Enabled
									</Badge>
								</div>
								<div className="text-xs text-muted-foreground mt-1">
									A notetaker bot will join this meeting to record and provide transcripts.
								</div>
							</div>
						)}

						{isPastEvent && (
							<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="text-sm text-yellow-800">
									This meeting has already occurred. Notetaker settings cannot be changed.
								</div>
							</div>
						)}
					</div>

					{isPastEvent && botEnabled && (
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
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
