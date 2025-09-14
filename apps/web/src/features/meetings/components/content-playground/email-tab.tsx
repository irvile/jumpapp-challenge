import { Button } from '@web/components/ui/button'
import { Label } from '@web/components/ui/label'
import { Textarea } from '@web/components/ui/textarea'
import { Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useContentGenerator } from '../../hooks/use-content-generator'

interface EmailTabProps {
	transcript: any
	meetingId: string
}

export function EmailTab({ transcript, meetingId }: EmailTabProps) {
	const [emailDraft, setEmailDraft] = useState('')
	const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
	
	const generateContentMutation = useContentGenerator()

	const generateEmailDraft = async () => {
		setIsGeneratingEmail(true)
		try {
			const linkedinContent = await generateContentMutation.mutateAsync({
				meetingId,
				platform: 'linkedin',
				tone: 'professional',
				provider: 'openai'
			})

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

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text)
	}

	return (
		<div className="space-y-4 m-0">
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
		</div>
	)
}