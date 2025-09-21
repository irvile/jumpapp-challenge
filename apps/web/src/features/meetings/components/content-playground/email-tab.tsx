import { Button } from '@web/components/ui/button'
import { Input } from '@web/components/ui/input'
import { Label } from '@web/components/ui/label'
import { Textarea } from '@web/components/ui/textarea'
import { Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useEmailRecap } from '../../hooks/use-email-recap'

interface EmailTabProps {
	transcript: any
	meetingId: string
}

export function EmailTab({ transcript, meetingId }: EmailTabProps) {
	const [emailSubject, setEmailSubject] = useState('')
	const [emailContent, setEmailContent] = useState('')

	const emailRecapMutation = useEmailRecap()

	const generateEmailRecap = async () => {
		try {
			const recap = await emailRecapMutation.mutateAsync({
				eventId: meetingId,
				provider: 'openai'
			})

			setEmailSubject(recap.subject)
			setEmailContent(recap.content)
		} catch (error) {
			console.error('Failed to generate email recap:', error)
		}
	}

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text)
	}

	const copyFullEmail = async () => {
		const fullEmail = `Subject: ${emailSubject}\n\n${emailContent}`
		await copyToClipboard(fullEmail)
	}

	return (
		<div className="space-y-4 m-0">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">AI-generated Follow-up Email</Label>
				<Button
					onClick={generateEmailRecap}
					disabled={emailRecapMutation.isPending || !transcript?.transcript}
					size="sm"
					variant="outline"
				>
					{emailRecapMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
					Generate Recap
				</Button>
			</div>

			<div className="space-y-3">
				<div>
					<Label htmlFor="email-subject" className="text-xs text-muted-foreground">
						Subject
					</Label>
					<Input
						value={emailSubject}
						onChange={(e) => setEmailSubject(e.target.value)}
						placeholder={
							transcript?.transcript
								? 'Email subject will be generated automatically'
								: 'Transcript required to generate email'
						}
						disabled={!transcript?.transcript}
						className="mt-1"
					/>
				</div>

				<div>
					<Label htmlFor="email-content" className="text-xs text-muted-foreground">
						Content
					</Label>
					<Textarea
						value={emailContent}
						onChange={(e) => setEmailContent(e.target.value)}
						placeholder={
							transcript?.transcript
								? "Click 'Generate Recap' to create a follow-up email based on your meeting transcript"
								: 'Transcript required to generate email content'
						}
						className="min-h-[350px] resize-none mt-1"
						disabled={!transcript?.transcript}
					/>
				</div>
			</div>

			<div className="flex gap-2">
				<Button onClick={copyFullEmail} disabled={!emailContent || !emailSubject} variant="outline" size="sm">
					<Copy className="h-4 w-4 mr-2" />
					Copy Email
				</Button>
				<Button disabled={!emailContent || !emailSubject} size="sm">
					Send Email
				</Button>
			</div>
		</div>
	)
}
