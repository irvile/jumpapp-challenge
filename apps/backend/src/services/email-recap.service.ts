import { type AIProvider, aiProviders } from '@backend/libs/ai/providers'
import { dayjs } from '@backend/libs/date'
import { db } from '@backend/libs/db'
import { optimizeForLLM } from '@backend/libs/recall/transcript/llm-optimizer'
import type { GenerateEmailRecapBody } from '@backend/routes/ai/generate-email-recap.route'
import { generateText } from 'ai'
import { transcriptService } from './transcript.service'

export interface EmailRecap {
	subject: string
	content: string
	metadata: {
		model: string
		generatedAt: string
		provider: AIProvider
	}
}

const EMAIL_RECAP_SYSTEM_PROMPT = `You are an AI assistant specialized in creating professional follow-up emails based on meeting transcripts. 

Your task is to generate a concise, professional follow-up email that:
1. Summarizes the key points discussed in the meeting
2. Highlights action items and next steps
3. Mentions important decisions made
4. Uses a professional but friendly tone
5. Is structured with clear paragraphs

Return ONLY a JSON object with this structure:
{
  "subject": "Brief, descriptive email subject line",
  "content": "Full email body content with proper formatting"
}

Do not include any other text outside the JSON response.`

export async function generateEmailRecapForMeeting(
	request: GenerateEmailRecapBody,
	userId: string
): Promise<EmailRecap> {
	const transcriptResult = await transcriptService.getTranscriptByEventId(request.eventId, userId)

	if (transcriptResult.isErr()) {
		throw new Error(transcriptResult.error)
	}

	const calendarEvent = await db.calendarEvent.findUnique({
		where: {
			id: request.eventId,
			calendarAccount: {
				userId: userId
			}
		}
	})

	if (!calendarEvent) {
		throw new Error('Calendar event not found')
	}

	const optimized = optimizeForLLM(transcriptResult.value)
	const duration = dayjs(calendarEvent.endTime).diff(dayjs(calendarEvent.startTime), 'minutes')
	const participants = calendarEvent.attendees?.split(',')

	const prompt = `Please generate a professional follow-up email recap based on this meeting transcript:

Meeting Transcript:
${optimized.conversationText}

Key Information:
- Meeting Date: ${new Date(calendarEvent.startTime).toLocaleDateString()}
- Duration: ${duration} minutes
- Participants: ${participants}

Generate a follow-up email that captures the essence of what was discussed and any action items or next steps mentioned.`

	const provider: AIProvider = request.provider || 'openai'

	console.log('ai.emailRecap.model', provider, aiProviders[provider])
	console.log('ai.emailRecap.prompt', prompt)

	const { text } = await generateText({
		model: aiProviders[provider],
		system: EMAIL_RECAP_SYSTEM_PROMPT,
		prompt
	})

	console.log('ai.emailRecap.generatedContent.text', text)

	try {
		const parsedResponse = JSON.parse(text.trim())
		return {
			subject: parsedResponse.subject,
			content: parsedResponse.content,
			metadata: {
				model:
					provider === 'openai'
						? 'gpt-4-turbo-preview'
						: provider === 'anthropic'
							? 'claude-3-haiku-20240307'
							: 'gemini-pro',
				generatedAt: new Date().toISOString(),
				provider
			}
		}
	} catch (error) {
		console.error('Failed to parse AI response for email recap', error)
		throw new Error('Failed to parse AI response for email recap')
	}
}
