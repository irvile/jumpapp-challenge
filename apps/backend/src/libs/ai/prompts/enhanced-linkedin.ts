import type { LLMOptimizedTranscript } from '@backend/libs/recall/transcript/llm-optimizer'

export function generateEnhancedLinkedInPrompt(optimized: LLMOptimizedTranscript, tone: string = 'professional'): string {
	const baseContext = `${optimized.meetingContext}

${optimized.participantsContext}

${optimized.analyticsContext}

Conversation:
${optimized.conversationText}`

	return `Create a professional LinkedIn post based on this meeting transcript:

${baseContext}

Requirements:
- ${tone} tone suitable for professional LinkedIn audience
- 2-4 paragraphs maximum (up to 3000 characters)
- Focus on key business insights, learnings, or strategic takeaways
- Include actionable advice or thought-provoking questions
- Add 4-5 relevant professional hashtags
- Use storytelling elements to make it engaging
- Structure with clear value proposition for readers
- Do not mention private, confidential, or sensitive details
- End with a call-to-action or question to encourage engagement

Format with proper paragraph breaks and hashtags at the end.`
}