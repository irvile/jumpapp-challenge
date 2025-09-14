import type { LLMOptimizedTranscript } from '@backend/libs/recall/transcript/llm-optimizer'
import type { Platform } from '@backend/libs/ai/providers'
import { generateFacebookPrompt } from './facebook'
import { generateThreadsPrompt } from './threads'
import { generateEnhancedLinkedInPrompt } from './enhanced-linkedin'
import { generateEnhancedTwitterPrompt } from './enhanced-twitter'

export function generateEnhancedPrompt(
	optimized: LLMOptimizedTranscript,
	options: {
		type: Platform
		tone?: string
	}
): string {
	const tone = options.tone || 'professional'

	switch (options.type) {
		case 'linkedin':
			return generateEnhancedLinkedInPrompt(optimized, tone)
		case 'facebook':
			return generateFacebookPrompt(optimized, tone)
		case 'X':
			return generateEnhancedTwitterPrompt(optimized, tone)
		case 'threads':
			return generateThreadsPrompt(optimized, tone)
		default:
			throw new Error(`Unsupported platform: ${options.type}`)
	}
}

export function getSystemPrompt(platform: Platform): string {
	switch (platform) {
		case 'linkedin':
			return 'You are a professional content creator specializing in LinkedIn posts. Create engaging, valuable content that resonates with business professionals.'
		case 'facebook':
			return 'You are a social media content creator specializing in Facebook posts. Create engaging, shareable content that encourages meaningful interactions.'
		case 'X':
			return 'You are a social media expert specializing in X (Twitter) content. Create concise, engaging threads that capture attention and encourage engagement.'
		case 'threads':
			return 'You are a social media creator specializing in Threads. Create authentic, conversational content that feels natural and encourages discussion.'
		default:
			return 'You are a professional content creator. Create engaging, valuable content for social media.'
	}
}