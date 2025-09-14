import { Label } from '@web/components/ui/label'
import { Sparkles } from 'lucide-react'
import type { GeneratedContent } from '../../hooks/use-content-generator'
import { ContentCard } from './content-card'

interface SocialPostsTabProps {
	generatedContents: GeneratedContent[]
}

export function SocialPostsTab({ generatedContents }: SocialPostsTabProps) {
	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text)
	}

	return (
		<div className="space-y-4 m-0">
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
						<ContentCard key={content.metadata.generatedAt} content={content} onCopy={copyToClipboard} />
					))
				)}
			</div>
		</div>
	)
}