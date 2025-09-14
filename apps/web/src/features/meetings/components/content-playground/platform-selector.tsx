import { Label } from '@web/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@web/components/ui/select'
import { Bot, Facebook, LinkedinIcon, MessageSquare, Sparkles, Twitter } from 'lucide-react'
import type { Platform, Provider, Tone } from '../../hooks/use-content-generator'

interface PlatformSelectorProps {
	selectedPlatform: Platform
	selectedTone: Tone
	selectedProvider: Provider
	onPlatformChange: (platform: Platform) => void
	onToneChange: (tone: Tone) => void
	onProviderChange: (provider: Provider) => void
}

export function PlatformSelector({
	selectedPlatform,
	selectedTone,
	selectedProvider,
	onPlatformChange,
	onToneChange,
	onProviderChange
}: PlatformSelectorProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div className="space-y-2">
				<Label className="text-sm">Platform</Label>
				<Select value={selectedPlatform} onValueChange={onPlatformChange}>
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
				<Select value={selectedTone} onValueChange={onToneChange}>
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
				<Select value={selectedProvider} onValueChange={onProviderChange}>
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
	)
}