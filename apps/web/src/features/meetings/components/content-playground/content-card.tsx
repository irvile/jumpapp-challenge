import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { genereateFrontendId } from '@web/libs/utils'
import { Copy, Facebook, LinkedinIcon, MessageSquare, Twitter } from 'lucide-react'
import type { GeneratedContent, Platform } from '../../hooks/use-content-generator'

interface ContentCardProps {
	content: GeneratedContent
	onCopy: (text: string) => void
}

export function ContentCard({ content, onCopy }: ContentCardProps) {
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

	return (
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
				<Button variant="outline" size="sm" onClick={() => onCopy(content.content)}>
					<Copy className="h-3 w-3 mr-1" />
					Copy
				</Button>
				<Button variant="outline" size="sm">
					Edit
				</Button>
				<Button size="sm">Post to {content.platform}</Button>
			</div>
		</div>
	)
}