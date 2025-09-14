import { Button } from '@web/components/ui/button'
import { Textarea } from '@web/components/ui/textarea'
import { AlertCircle, Bot, Copy, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import {
	type GeneratedContent,
	type Platform,
	type Provider,
	type Tone,
	useContentGenerator
} from '../../hooks/use-content-generator'
import { PlatformSelector } from './platform-selector'

interface DraftGeneratorTabProps {
	transcript: any
	meetingId: string
	onContentGenerated: (content: GeneratedContent) => void
}

export function DraftGeneratorTab({ transcript, meetingId, onContentGenerated }: DraftGeneratorTabProps) {
	const [selectedPlatform, setSelectedPlatform] = useState<Platform>('linkedin')
	const [selectedTone, setSelectedTone] = useState<Tone | string>('professional')
	const [selectedProvider, setSelectedProvider] = useState<Provider>('openai')
	const [selectedAutomationId, setSelectedAutomationId] = useState<string>('')
	const [socialDraft, setSocialDraft] = useState('')

	// const { data: automations } = useAutomations()
	const generateContentMutation = useContentGenerator()

	// const selectedAutomation = automations?.find((a) => a.id === selectedAutomationId)
	const isUsingAutomation = selectedTone === 'use_automation'

	const generateSocialPost = async () => {
		try {
			const content = await generateContentMutation.mutateAsync({
				meetingId,
				platform: selectedPlatform,
				tone: isUsingAutomation ? undefined : selectedTone as Tone,
				provider: selectedProvider,
				...(isUsingAutomation && selectedAutomationId && { automationId: selectedAutomationId })
			})
			setSocialDraft(content.content)
			onContentGenerated(content)
		} catch (error) {
			console.error('Failed to generate social post:', error)
		}
	}

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text)
	}

	const handleToneChange = (tone: Tone | string) => {
		setSelectedTone(tone)
		if (tone !== 'use_automation') {
			setSelectedAutomationId('')
		}
	}

	const handlePlatformChange = (platform: Platform) => {
		setSelectedPlatform(platform)
		if (selectedTone === 'use_automation') {
			setSelectedAutomationId('')
		}
	}

	return (
		<div className="space-y-4 m-0">
			<div>
				<h4 className="text-base font-medium">AI Content Generator</h4>
				<p className="text-sm text-muted-foreground">
					Generate platform-specific content using AI based on your meeting transcript
				</p>
			</div>

			<PlatformSelector
				selectedPlatform={selectedPlatform}
				selectedTone={selectedTone}
				selectedProvider={selectedProvider}
				selectedAutomationId={selectedAutomationId}
				onPlatformChange={handlePlatformChange}
				onToneChange={handleToneChange}
				onProviderChange={setSelectedProvider}
				onAutomationChange={setSelectedAutomationId}
			/>

			<Textarea
				value={socialDraft}
				onChange={(e) => setSocialDraft(e.target.value)}
				placeholder={
					transcript?.transcript
						? isUsingAutomation
							? "Click 'Generate with Automation' to create content using your custom automation settings"
							: "Click 'Generate Content' to create AI-powered content based on your meeting transcript"
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
					disabled={
						generateContentMutation.isPending || !transcript?.transcript || (isUsingAutomation && !selectedAutomationId)
					}
					className="w-full"
				>
					{generateContentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
					{isUsingAutomation ? <Bot className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
					{isUsingAutomation ? 'Generate with Automation' : 'Generate Content'}
				</Button>

				<div className="flex gap-2">
					<Button onClick={() => copyToClipboard(socialDraft)} disabled={!socialDraft} variant="outline" size="sm">
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
		</div>
	)
}
