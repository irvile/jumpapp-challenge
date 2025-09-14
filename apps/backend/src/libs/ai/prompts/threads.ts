import type { LLMOptimizedTranscript } from '@backend/libs/recall/transcript/llm-optimizer'

export function generateThreadsPrompt(optimized: LLMOptimizedTranscript, tone: string = 'casual'): string {
	const baseContext = `${optimized.meetingContext}

${optimized.participantsContext}

${optimized.analyticsContext}

Conversation:
${optimized.conversationText}`

	return `Create a Threads post based on this meeting transcript:

${baseContext}

Requirements:
- ${tone} and conversational tone perfect for Threads
- Maximum 500 characters total
- Focus on one key insight or takeaway from the meeting
- Make it relatable and discussion-worthy
- Add 2-3 relevant hashtags
- Use engaging language that encourages replies
- Do not mention private or confidential details
- Keep it authentic and human

Format as a single engaging post with hashtags included.`
}