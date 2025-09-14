import type { LLMOptimizedTranscript } from '@backend/libs/recall/transcript/llm-optimizer'

export function generateEnhancedTwitterPrompt(optimized: LLMOptimizedTranscript, tone: string = 'professional'): string {
	const baseContext = `${optimized.meetingContext}

${optimized.participantsContext}

${optimized.analyticsContext}

Conversation:
${optimized.conversationText}`

	return `Create an X (Twitter) thread based on this meeting transcript:

${baseContext}

Requirements:
- ${tone} tone appropriate for X audience
- Create 3-5 tweets maximum
- Each tweet must be under 280 characters
- Start with an engaging hook tweet
- Include key takeaways, insights, or actionable advice
- Add 2-3 relevant hashtags per thread (not every tweet)
- Make it valuable and shareable
- Do not mention private or confidential details
- Focus on the most engaging insights that spark conversation

Format as:
1/5 [First tweet content]
2/5 [Second tweet content]
etc.`
}