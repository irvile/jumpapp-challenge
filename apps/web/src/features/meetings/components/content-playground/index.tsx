import { Tabs, TabsContent, TabsList, TabsTrigger } from '@web/components/ui/tabs'
import { FileText, Mail, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import type { GeneratedContent } from '../../hooks/use-content-generator'
import { DraftGeneratorTab } from './draft-generator-tab'
import { EmailTab } from './email-tab'
import { SocialPostsTab } from './social-posts-tab'

interface ContentPlaygroundProps {
	transcript: any
	meetingId: string
}

export function ContentPlayground({ transcript, meetingId }: ContentPlaygroundProps) {
	const [activeTab, setActiveTab] = useState('followup')
	const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])

	const handleContentGenerated = (content: GeneratedContent) => {
		setGeneratedContents((prev) => [...prev, content])
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
						<TabsContent value="followup">
							<EmailTab transcript={transcript} meetingId={meetingId} />
						</TabsContent>

						<TabsContent value="social-posts">
							<SocialPostsTab generatedContents={generatedContents} />
						</TabsContent>

						<TabsContent value="draft-generator">
							<DraftGeneratorTab 
								transcript={transcript} 
								meetingId={meetingId} 
								onContentGenerated={handleContentGenerated}
							/>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	)
}