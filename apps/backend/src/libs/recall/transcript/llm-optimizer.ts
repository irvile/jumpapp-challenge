import type { ParsedTranscript } from './types'

export interface LLMOptimizedTranscript {
	meetingContext: string
	participantsContext: string
	conversationText: string
	analyticsContext: string
}

export interface ContentGenerationRequest {
	type: 'summary' | 'linkedin' | 'twitter'
	participantId?: number
	participantName?: string
}

export function optimizeForLLM(parsed: ParsedTranscript): LLMOptimizedTranscript {
	const meetingContext = formatMeetingContext(parsed)
	const participantsContext = formatParticipantsContext(parsed.participants)
	const conversationText = formatConversation(parsed.conversation)
	const analyticsContext = formatAnalytics(parsed)

	return {
		meetingContext,
		participantsContext,
		conversationText,
		analyticsContext
	}
}

function formatMeetingContext(parsed: ParsedTranscript): string {
	const { meeting } = parsed

	return `Meeting Details:
- Duration: ${meeting.duration} minutes
- Platform: ${meeting.platform}
- Start Time: ${new Date(meeting.startTime).toLocaleString()}
- Total Participants: ${parsed.participants.length}`
}

function formatParticipantsContext(participants: ParsedTranscript['participants']): string {
	const participantsList = participants
		.map((p) => {
			const speakingTime = Math.round((p.totalSpeakingTime / 60) * 100) / 100
			const role = p.role === 'host' ? ' (Host)' : ''
			return `- ${p.name}${role}: ${speakingTime} minutes speaking, ${p.segmentCount} contributions`
		})
		.join('\n')

	return `Participants:\n${participantsList}`
}

function formatConversation(conversation: ParsedTranscript['conversation']): string {
	return conversation
		.map((segment) => {
			const timestamp = new Date(segment.timestamp).toLocaleTimeString()
			return `[${timestamp}] ${segment.participant}: ${segment.text}`
		})
		.join('\n\n')
}

function formatAnalytics(parsed: ParsedTranscript): string {
	const totalSpeaking = parsed.participants.reduce((sum, p) => sum + p.totalSpeakingTime, 0)

	const distribution = parsed.participants
		.map((p) => {
			const percentage = Math.round((p.totalSpeakingTime / totalSpeaking) * 100)
			return `${p.name}: ${percentage}%`
		})
		.join(', ')

	const totalSegments = parsed.conversation.length
	const averageSegmentLength = Math.round(totalSpeaking / totalSegments)

	return `Speaking Analytics:
- Total Speaking Time: ${Math.round(totalSpeaking / 60)} minutes
- Distribution: ${distribution}
- Total Segments: ${totalSegments}
- Average Segment Length: ${averageSegmentLength} seconds`
}

export function generatePrompt(optimized: LLMOptimizedTranscript, request: ContentGenerationRequest): string {
	const baseContext = `${optimized.meetingContext}

${optimized.participantsContext}

${optimized.analyticsContext}

Conversation:
${optimized.conversationText}`

	switch (request.type) {
		case 'summary':
			return generateSummaryPrompt(baseContext)

		case 'linkedin':
			return generateLinkedInPrompt(baseContext, request.participantName)

		case 'twitter':
			return generateTwitterPrompt(baseContext, request.participantName)

		default:
			throw new Error(`Unsupported content type: ${request.type}`)
	}
}

function generateSummaryPrompt(context: string): string {
	return `Based on the following meeting transcript, create a comprehensive meeting summary:

${context}

Please provide:
## Meeting Summary

### Key Discussion Points
- List 3-5 main topics discussed

### Decisions Made
- List any decisions or conclusions reached

### Action Items
- List any tasks or follow-ups mentioned

### Key Insights
- Highlight important insights or discoveries

### Next Steps
- Mention any planned next meetings or deadlines

Keep the summary professional and concise.`
}

function generateLinkedInPrompt(context: string, participantName?: string): string {
	const participantFocus = participantName
		? `Focus especially on insights and contributions from ${participantName}.`
		: 'Focus on the most valuable insights shared.'

	return `Create a professional LinkedIn post based on this meeting transcript:

${context}

${participantFocus}

Requirements:
- Professional tone suitable for LinkedIn
- 1-3 paragraphs maximum
- Include key insights or learnings
- Add relevant hashtags
- Make it engaging and valuable for professional network
- Do not mention private/confidential details`
}

function generateTwitterPrompt(context: string, participantName?: string): string {
	const participantFocus = participantName
		? `Highlight quotes or insights from ${participantName}.`
		: 'Focus on the most engaging insights.'

	return `Create a Twitter thread based on this meeting transcript:

${context}

${participantFocus}

Requirements:
- Create 3-5 tweets maximum
- Each tweet under 280 characters
- Start with an engaging hook
- Include key takeaways or insights
- Add relevant hashtags
- Make it engaging for general audience
- Do not mention private/confidential details

Format as:
🧵 1/5 [Tweet content]
2/5 [Tweet content]
etc.`
}
