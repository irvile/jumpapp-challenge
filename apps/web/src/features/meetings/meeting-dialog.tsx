import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@web/components/ui/dialog'
import { Label } from '@web/components/ui/label'
import { Switch } from '@web/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@web/components/ui/tabs'
import { Textarea } from '@web/components/ui/textarea'
import { dayjs } from '@web/libs/dayjs'
import { genereateFrontendId } from '@web/libs/utils'
import { backend } from '@web/services/backend-api'
import {
	AlertCircle,
	Bot,
	Calendar,
	Clock,
	Copy,
	ExternalLink,
	FileText,
	LinkedinIcon,
	Loader2,
	Mail,
	MessageSquare,
	Users
} from 'lucide-react'
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
			<DialogContent className="max-w-7xl h-[80vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						{event.title}
					</DialogTitle>
					<DialogDescription>Meeting details and AI-powered content generation</DialogDescription>
				</DialogHeader>

				<div className="flex gap-6 h-full overflow-hidden">
					<div className="w-1/3 space-y-6 overflow-y-auto pr-4">
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

					{isPastEvent && botEnabled && (
						<div className="w-2/3 border-l pl-6">
							<ContentPlayground transcript={transcript} />
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}

function ContentPlayground({ transcript }: { transcript: any }) {
	const [activeTab, setActiveTab] = useState('followup')
	const [emailDraft, setEmailDraft] = useState('')
	const [socialDraft, setSocialDraft] = useState('')
	const [selectedPlatform, setSelectedPlatform] = useState('linkedin')
	const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
	const [isGeneratingSocial, setIsGeneratingSocial] = useState(false)

	const mockSocialPosts = [
		{
			id: '1',
			platform: 'LinkedIn',
			content:
				'Great discussion on AI implementation strategies in our quarterly planning meeting. Key takeaways: focus on user experience and gradual rollout.',
			status: 'posted',
			createdAt: '2 hours ago'
		},
		{
			id: '2',
			platform: 'Facebook',
			content:
				'Exciting team meeting today! We covered new project milestones and upcoming launches. The energy in the room was incredible! 🚀',
			status: 'draft',
			createdAt: '1 hour ago'
		}
	]

	const generateEmailDraft = async () => {
		setIsGeneratingEmail(true)
		await new Promise((resolve) => setTimeout(resolve, 2000))
		setEmailDraft(`Subject: Follow-up on Meeting - Key Decisions & Next Steps

Hi team,

Thank you for the productive meeting today. Here are the key points we discussed and our action items:

**Key Decisions Made:**
• Approved the Q4 budget allocation for the new project
• Selected the preferred vendor for implementation
• Agreed on the timeline for the beta launch

**Action Items:**
• John: Prepare technical specifications by Friday
• Sarah: Schedule follow-up meeting with stakeholders
• Mike: Review budget details and send confirmation

**Next Steps:**
The next milestone review is scheduled for next week. Please ensure all deliverables are ready for discussion.

Best regards,
Meeting Organizer`)
		setIsGeneratingEmail(false)
	}

	const generateSocialPost = async () => {
		setIsGeneratingSocial(true)
		await new Promise((resolve) => setTimeout(resolve, 2000))
		const posts = {
			linkedin:
				'Just wrapped up an insightful strategy meeting with the team. Key focus areas: innovation, customer experience, and sustainable growth. Excited about the initiatives we discussed! #TeamWork #Strategy',
			facebook:
				"Amazing brainstorming session with the team today! 🎯 We covered some exciting new projects and initiatives. Can't wait to share more updates soon! #TeamWork #Innovation",
			twitter:
				'Great team meeting today! Key takeaways: focus on user experience, sustainable growth, and innovative solutions. Exciting times ahead! 🚀 #TeamWork #Innovation'
		}
		setSocialDraft(posts[selectedPlatform as keyof typeof posts])
		setIsGeneratingSocial(false)
	}

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text)
	}

	return (
		<div className="h-full overflow-hidden">
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-2">AI Content Generator</h3>
				<p className="text-sm text-muted-foreground">
					Generate follow-up emails and social media posts based on your meeting transcript
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="followup" className="flex items-center gap-2">
						<Mail className="h-4 w-4" />
						Follow-up Email
					</TabsTrigger>
					<TabsTrigger value="social-posts" className="flex items-center gap-2">
						<MessageSquare className="h-4 w-4" />
						Social Posts
					</TabsTrigger>
					<TabsTrigger value="draft-generator" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						Draft Generator
					</TabsTrigger>
				</TabsList>

				<div className="flex-1 overflow-hidden mt-4">
					<TabsContent value="followup" className="h-full m-0">
						<div className="h-full flex flex-col space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">AI-generated Follow-up Email</Label>
								<Button
									onClick={generateEmailDraft}
									disabled={isGeneratingEmail || !transcript?.transcript}
									size="sm"
									variant="outline"
								>
									{isGeneratingEmail && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
									Generate Email
								</Button>
							</div>

							<div className="flex-1">
								<Textarea
									value={emailDraft}
									onChange={(e) => setEmailDraft(e.target.value)}
									placeholder={
										transcript?.transcript
											? "Click 'Generate Email' to create a follow-up email based on your meeting transcript"
											: 'Transcript required to generate email content'
									}
									className="h-full resize-none"
									disabled={!transcript?.transcript}
								/>
							</div>

							<div className="flex gap-2">
								<Button onClick={() => copyToClipboard(emailDraft)} disabled={!emailDraft} variant="outline" size="sm">
									<Copy className="h-4 w-4 mr-2" />
									Copy
								</Button>
								<Button disabled={!emailDraft} size="sm">
									Send Email
								</Button>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="social-posts" className="h-full m-0">
						<div className="h-full flex flex-col space-y-4">
							<Label className="text-sm font-medium">Generated Social Media Posts</Label>

							<div className="flex-1 overflow-y-auto space-y-4">
								{mockSocialPosts.map((post) => (
									<div key={post.id} className="border rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<LinkedinIcon className="h-4 w-4" />
												<span className="text-sm font-medium">{post.platform}</span>
												<Badge variant={post.status === 'posted' ? 'default' : 'secondary'}>{post.status}</Badge>
											</div>
											<span className="text-xs text-muted-foreground">{post.createdAt}</span>
										</div>
										<p className="text-sm mb-3">{post.content}</p>
										<div className="flex gap-2">
											<Button variant="outline" size="sm">
												Edit
											</Button>
											{post.status === 'draft' && <Button size="sm">Post</Button>}
										</div>
									</div>
								))}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="draft-generator" className="h-full m-0">
						<div className="h-full flex flex-col space-y-4">
							<div>
								<h4 className="text-base font-medium">Draft post</h4>
								<p className="text-sm text-muted-foreground">Generate a post based on insights from this meeting</p>
							</div>

							<div className="space-y-3">
								<Label className="text-sm">Select Platform</Label>
								<div className="flex gap-2">
									{['linkedin', 'facebook', 'twitter'].map((platform) => (
										<Button
											key={platform}
											variant={selectedPlatform === platform ? 'default' : 'outline'}
											size="sm"
											onClick={() => setSelectedPlatform(platform)}
										>
											{platform === 'linkedin' && <LinkedinIcon className="h-4 w-4 mr-2" />}
											{platform}
										</Button>
									))}
								</div>
							</div>

							<div className="flex-1">
								<Textarea
									value={socialDraft}
									onChange={(e) => setSocialDraft(e.target.value)}
									placeholder={
										transcript?.transcript
											? "Click 'Generate Post' to create content based on your meeting transcript"
											: 'Transcript required to generate social media content'
									}
									className="h-full resize-none"
									disabled={!transcript?.transcript}
								/>
							</div>

							<div className="space-y-3">
								<Button
									onClick={generateSocialPost}
									disabled={isGeneratingSocial || !transcript?.transcript}
									variant="outline"
									className="w-full"
								>
									{isGeneratingSocial && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
									Generate Post
								</Button>

								<div className="flex gap-2">
									<Button
										onClick={() => copyToClipboard(socialDraft)}
										disabled={!socialDraft}
										variant="outline"
										size="sm"
									>
										<Copy className="h-4 w-4 mr-2" />
										Copy
									</Button>
									<Button disabled={!socialDraft} variant="outline" size="sm">
										Cancel
									</Button>
									<Button disabled={!socialDraft} size="sm">
										Post
									</Button>
								</div>
							</div>
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	)
}
