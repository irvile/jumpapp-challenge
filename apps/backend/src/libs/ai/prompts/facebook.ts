import type { LLMOptimizedTranscript } from '@backend/libs/recall/transcript/llm-optimizer'

export function generateFacebookPrompt(optimized: LLMOptimizedTranscript, tone: string = 'professional'): string {
	const baseContext = `${optimized.meetingContext}

${optimized.participantsContext}

${optimized.analyticsContext}

Conversation:
${optimized.conversationText}`

	return `Create a Facebook post based on this meeting transcript:

${baseContext}

Requirements:
- ${tone} tone appropriate for Facebook audience
- 1-3 paragraphs maximum (up to 1000 words allowed but keep concise)
- Include key insights, takeaways, or interesting moments from the meeting  
- Add 3-5 relevant hashtags at the end
- Make it engaging and shareable for personal/professional network
- Use a conversational style that invites engagement
- Do not mention private or confidential details
- Focus on valuable insights that others can learn from

Format the response as clean text with hashtags at the end.`
}