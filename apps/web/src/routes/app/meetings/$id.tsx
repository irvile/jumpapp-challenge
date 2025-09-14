import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Label } from '@web/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@web/components/ui/select'
import { Switch } from '@web/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@web/components/ui/tabs'
import { Textarea } from '@web/components/ui/textarea'
import { dayjs } from '@web/libs/dayjs'
import { genereateFrontendId } from '@web/libs/utils'
import { backend } from '@web/services/backend-api'
import {
	AlertCircle,
	ArrowLeft,
	Bot,
	Calendar,
	Clock,
	Copy,
	ExternalLink,
	Facebook,
	FileText,
	LinkedinIcon,
	Loader2,
	Mail,
	MessageSquare,
	Sparkles,
	Twitter,
	Users
} from 'lucide-react'
import { useState } from 'react'
import { PlatformBadge } from '../../../components/platform-badge'
import { useCalendarAccounts } from '../../../features/calendar-accounts/queries/use-calendar-accounts'
import type { CalendarEventListItem } from '../../../features/calendar-accounts/queries/use-calendar-events'
import { useMeetingTranscript } from '../../../features/meetings/queries/use-meeting-transcript'

export const Route = createFileRoute('/app/meetings/$id')({
	component: MeetingDetailsPage
})

async function findEventInCache(queryClient: any, eventId: string): Promise<CalendarEventListItem['events'][0] | null> {
	const queryCache = queryClient.getQueryCache()
	const queries = queryCache.findAll({ queryKey: ['calendar-events'] })

	for (const query of queries) {
		if (query.state.data?.events) {
			const event = query.state.data.events.find((e: any) => e.id === eventId)
			if (event) return event
		}
	}
	return null
}

function MeetingDetailsPage() {
	const { id } = useParams({ from: '/app/meetings/$id' })
	const queryClient = useQueryClient()
	const { data: calendarAccounts } = useCalendarAccounts()

	const { data: meetingDetails, isLoading: isLoadingMeeting } = useQuery({
		queryKey: ['meeting-details', id],
		queryFn: async () => {
			const cachedEvent = await findEventInCache(queryClient, id)
			if (cachedEvent) {
				return cachedEvent
			}

			if (!calendarAccounts?.length) {
				throw new Error('No calendar accounts found')
			}

			const today = dayjs()
			const startDate = today.subtract(30, 'days').startOf('day').toISOString()
			const endDate = today.add(30, 'days').endOf('day').toISOString()

			for (const account of calendarAccounts) {
				try {
					const response = await backend.api.v1.calendars({ calendarAccountId: account.id }).events.get({
						query: { startDate, endDate }
					})

					if (response.data?.events) {
						const event = response.data.events.find((e: any) => e.id === id)
						if (event) return event
					}
				} catch (error) {
					console.warn(`Failed to fetch events for account ${account.id}:`, error)
				}
			}

			throw new Error('Meeting not found')
		},
		enabled: !!id,
		retry: 1
	})

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
	const [botEnabled, setBotEnabled] = useState(meeting.hasBot)
	const queryClient = useQueryClient()

	const startTime = dayjs(meeting.startTime)
	const endTime = dayjs(meeting.endTime)
	const duration = endTime.diff(startTime, 'minutes')
	const isPastEvent = startTime.isBefore(dayjs())
	const attendees = meeting.attendees ? JSON.parse(meeting.attendees) : []

	const {
		data: transcript,
		isLoading: isLoadingTranscript,
		error: transcriptError
	} = useMeetingTranscript(meeting.googleAccountId, meeting.id, isPastEvent && botEnabled)

	const botToggleMutation = useMutation({
		mutationFn: async (enabled: boolean) => {
			const response = await backend.api.v1
				.calendars({ calendarAccountId: meeting.googleAccountId })
				.events({ eventId: meeting.id })
				.bot.put({
					enabled
				})

			if (response.error) {
				throw new Error(response.error.value || 'Failed to toggle bot')
			}

			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
			queryClient.invalidateQueries({ queryKey: ['meeting-details'] })
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

	return (
		<div className="min-h-screen bg-background">
			<div className="border-b">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="sm" onClick={() => window.history.back()}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to meetings
						</Button>
						<div className="flex-1">
							<h1 className="text-2xl font-bold flex items-center gap-3">
								<Calendar className="h-6 w-6" />
								{meeting.title}
							</h1>
							<p className="text-muted-foreground">Meeting details and AI-powered content generation</p>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-1">
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

								<div className="flex items-center gap-3">
									<div className="flex-1">
										<PlatformBadge platform={meeting.platform} />
										{meeting.meetingUrl && (
											<Button
												variant="link"
												className="h-auto p-0 text-sm text-muted-foreground mt-2"
												onClick={() => window.open(`${meeting.meetingUrl}`, '_blank')}
											>
												Join meeting <ExternalLink className="h-3 w-3 ml-1" />
											</Button>
										)}
									</div>
								</div>

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

								{meeting.location && (
									<div className="text-sm text-muted-foreground">
										<strong>Location:</strong> {meeting.location}
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
					</div>

					{isPastEvent && botEnabled && (
						<div className="lg:col-span-2">
							<ContentPlayground transcript={transcript} meetingId={meeting.id} />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

type Platform = 'linkedin' | 'facebook' | 'X' | 'threads'
type Tone = 'professional' | 'casual' | 'technical'
type Provider = 'openai' | 'anthropic' | 'gemini'

interface GeneratedContent {
	content: string
	platform: Platform
	characterCount: number
	hashtags: string[]
	metadata: {
		model: string
		generatedAt: string
		tone: string
		provider: string
	}
}

function ContentPlayground({ transcript, meetingId }: { transcript: any; meetingId: string }) {
	const [activeTab, setActiveTab] = useState('followup')
	const [emailDraft, setEmailDraft] = useState('')
	const [socialDraft, setSocialDraft] = useState('')
	const [selectedPlatform, setSelectedPlatform] = useState<Platform>('linkedin')
	const [selectedTone, setSelectedTone] = useState<Tone>('professional')
	const [selectedProvider, setSelectedProvider] = useState<Provider>('openai')
	const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
	const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
	const [isGeneratingSocial, setIsGeneratingSocial] = useState(false)

	const generateContentMutation = useMutation({
		mutationFn: async ({ platform, tone, provider }: { platform: Platform; tone: Tone; provider: Provider }) => {
			const response = await backend.api.v1.ai.generate.post({
				eventId: meetingId,
				platform,
				tone,
				provider
			})

			if (response.error) {
				throw new Error('Failed to generate content')
			}

			return response.data as GeneratedContent
		},
		onSuccess: (data) => {
			setGeneratedContents((prev) => [...prev, data])
			setSocialDraft(data.content)
		},
		onError: (error) => {
			console.error('Failed to generate content:', error)
		}
	})

	const generateEmailDraft = async () => {
		setIsGeneratingEmail(true)
		try {
			const linkedinContent = await generateContentMutation.mutateAsync({
				platform: 'linkedin',
				tone: 'professional',
				provider: selectedProvider
			})

			// Transform social content into email format
			const emailContent = `Subject: Follow-up on Meeting - Key Insights & Next Steps

Hi team,

Thank you for the productive meeting today. Based on our discussion, here are the key insights and action items:

${linkedinContent.content.replace(/#\w+/g, '').trim()}

Please review and let me know if you have any questions or additional items to add.

Best regards,
Meeting Organizer`

			setEmailDraft(emailContent)
		} catch (error) {
			console.error('Failed to generate email:', error)
		} finally {
			setIsGeneratingEmail(false)
		}
	}

	const generateSocialPost = async () => {
		setIsGeneratingSocial(true)
		try {
			await generateContentMutation.mutateAsync({
				platform: selectedPlatform,
				tone: selectedTone,
				provider: selectedProvider
			})
		} catch (error) {
			console.error('Failed to generate social post:', error)
		} finally {
			setIsGeneratingSocial(false)
		}
	}

	const getPlatformIcon = (platform: Platform) => {
		switch (platform) {
			case 'linkedin':
				return <LinkedinIcon className="h-4 w-4" />
			case 'facebook':
				return <Facebook className="h-4 w-4" />
			case 'X':
				return <Twitter className="h-4 w-4" />
			case 'threads':
				return <MessageSquare className="h-4 w-4" />
			default:
				return <MessageSquare className="h-4 w-4" />
		}
	}

	const getPlatformColor = (platform: Platform) => {
		switch (platform) {
			case 'linkedin':
				return 'bg-blue-100 text-blue-800'
			case 'facebook':
				return 'bg-blue-100 text-blue-800'
			case 'X':
				return 'bg-black text-white'
			case 'threads':
				return 'bg-purple-100 text-purple-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text)
	}

	return (
		<div className="bg-card rounded-lg border">
			<div className="p-6 border-b">
				<h3 className="text-lg font-semibold mb-2">AI Content Generator</h3>
				<p className="text-sm text-muted-foreground">
					Generate follow-up emails and social media posts based on your meeting transcript
				</p>
			</div>

			<div className="p-6">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
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

					<div className="mt-6">
						<TabsContent value="followup" className="space-y-4 m-0">
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

							<Textarea
								value={emailDraft}
								onChange={(e) => setEmailDraft(e.target.value)}
								placeholder={
									transcript?.transcript
										? "Click 'Generate Email' to create a follow-up email based on your meeting transcript"
										: 'Transcript required to generate email content'
								}
								className="min-h-[400px] resize-none"
								disabled={!transcript?.transcript}
							/>

							<div className="flex gap-2">
								<Button onClick={() => copyToClipboard(emailDraft)} disabled={!emailDraft} variant="outline" size="sm">
									<Copy className="h-4 w-4 mr-2" />
									Copy
								</Button>
								<Button disabled={!emailDraft} size="sm">
									Send Email
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="social-posts" className="space-y-4 m-0">
							<Label className="text-sm font-medium">Generated Social Media Posts</Label>

							<div className="space-y-4 max-h-[500px] overflow-y-auto">
								{generatedContents.length === 0 ? (
									<div className="text-center py-8">
										<Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
										<p className="text-sm text-muted-foreground">No content generated yet.</p>
										<p className="text-xs text-muted-foreground">Use the Draft Generator tab to create content.</p>
									</div>
								) : (
									generatedContents.map((content) => (
										<div key={genereateFrontendId()} className="border rounded-lg p-4">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													{getPlatformIcon(content.platform)}
													<span className="text-sm font-medium capitalize">{content.platform}</span>
													<Badge className={getPlatformColor(content.platform)}>Draft</Badge>
													<Badge variant="outline" className="text-xs">
														{content.metadata.provider}
													</Badge>
												</div>
												<span className="text-xs text-muted-foreground">
													{new Date(content.metadata.generatedAt).toLocaleTimeString()}
												</span>
											</div>
											<p className="text-sm mb-3 leading-relaxed">{content.content}</p>
											<div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
												<span>{content.characterCount} characters</span>
												<span>{content.hashtags.length} hashtags</span>
											</div>
											<div className="flex gap-2">
												<Button variant="outline" size="sm" onClick={() => copyToClipboard(content.content)}>
													<Copy className="h-3 w-3 mr-1" />
													Copy
												</Button>
												<Button variant="outline" size="sm">
													Edit
												</Button>
												<Button size="sm">Post to {content.platform}</Button>
											</div>
										</div>
									))
								)}
							</div>
						</TabsContent>

						<TabsContent value="draft-generator" className="space-y-4 m-0">
							<div>
								<h4 className="text-base font-medium">AI Content Generator</h4>
								<p className="text-sm text-muted-foreground">
									Generate platform-specific content using AI based on your meeting transcript
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label className="text-sm">Platform</Label>
									<Select value={selectedPlatform} onValueChange={(value: Platform) => setSelectedPlatform(value)}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="linkedin">
												<div className="flex items-center gap-2">
													<LinkedinIcon className="h-4 w-4" />
													LinkedIn
												</div>
											</SelectItem>
											<SelectItem value="facebook">
												<div className="flex items-center gap-2">
													<Facebook className="h-4 w-4" />
													Facebook
												</div>
											</SelectItem>
											<SelectItem value="X">
												<div className="flex items-center gap-2">
													<Twitter className="h-4 w-4" />X (Twitter)
												</div>
											</SelectItem>
											<SelectItem value="threads">
												<div className="flex items-center gap-2">
													<MessageSquare className="h-4 w-4" />
													Threads
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label className="text-sm">Tone</Label>
									<Select value={selectedTone} onValueChange={(value: Tone) => setSelectedTone(value)}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="professional">Professional</SelectItem>
											<SelectItem value="casual">Casual</SelectItem>
											<SelectItem value="technical">Technical</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label className="text-sm">AI Provider</Label>
									<Select value={selectedProvider} onValueChange={(value: Provider) => setSelectedProvider(value)}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="openai">
												<div className="flex items-center gap-2">
													<Sparkles className="h-4 w-4" />
													OpenAI (GPT-5 Nano)
												</div>
											</SelectItem>
											<SelectItem value="anthropic">
												<div className="flex items-center gap-2">
													<MessageSquare className="h-4 w-4" />
													Anthropic (Claude 3.5 Haiku)
												</div>
											</SelectItem>
											<SelectItem value="gemini">
												<div className="flex items-center gap-2">
													<Bot className="h-4 w-4" />
													Google (Gemini 2.5 Flash)
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<Textarea
								value={socialDraft}
								onChange={(e) => setSocialDraft(e.target.value)}
								placeholder={
									transcript?.transcript
										? "Click 'Generate Content' to create AI-powered content based on your meeting transcript"
										: 'Transcript required to generate social media content'
								}
								className="min-h-[300px] resize-none"
								disabled={!transcript?.transcript}
							/>

							{socialDraft && (
								<div className="flex items-center justify-between text-xs text-muted-foreground px-1">
									<span>{socialDraft.length} characters</span>
									<span>
										{selectedPlatform === 'linkedin' && socialDraft.length > 3000 && '⚠️ Exceeds LinkedIn limit (3000)'}
										{selectedPlatform === 'X' && socialDraft.length > 280 && '⚠️ Exceeds X limit (280)'}
										{selectedPlatform === 'threads' && socialDraft.length > 500 && '⚠️ Exceeds Threads limit (500)'}
									</span>
								</div>
							)}

							<div className="space-y-3">
								<Button
									onClick={generateSocialPost}
									disabled={generateContentMutation.isPending || !transcript?.transcript}
									className="w-full"
								>
									{generateContentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
									<Sparkles className="h-4 w-4 mr-2" />
									Generate Content
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
									<Button disabled={!socialDraft} variant="outline" size="sm" onClick={() => setSocialDraft('')}>
										Clear
									</Button>
									<Button disabled={!socialDraft} size="sm">
										Save & Post
									</Button>
								</div>
							</div>

							{generateContentMutation.error && (
								<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
									<AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
									<div className="text-sm text-red-700">Failed to generate content. Please try again.</div>
								</div>
							)}
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	)
}
