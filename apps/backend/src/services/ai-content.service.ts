import { generateEnhancedPrompt, getSystemPrompt } from '@backend/libs/ai/prompts'
import {
	type AIProvider,
	aiProviders,
	getPlatformTokenLimit,
	PLATFORM_LIMITS,
	type Platform
} from '@backend/libs/ai/providers'
import { optimizeForLLM } from '@backend/libs/recall/transcript/llm-optimizer'
import type { GenerateContentBody } from '@backend/routes/ai/generate-content.route'
import { generateText } from 'ai'
import { automationService } from './automation.service'
import { transcriptService } from './transcript.service'

export interface GeneratedContent {
	content: string
	platform: Platform
	characterCount: number
	hashtags: string[]
	metadata: {
		model: string
		generatedAt: string
		tone: string
		provider: AIProvider
	}
}

export async function generateContentForMeeting(request: GenerateContentBody, userId: string) {
	if (request.automationId) {
		return generateContentWithAutomation(
			{
				eventId: request.eventId,
				automationId: request.automationId,
				provider: request.provider
			},
			userId
		)
	}

	const transcriptResult = await transcriptService.getTranscriptByEventId(request.eventId, userId)

	if (transcriptResult.isErr()) {
		throw new Error(transcriptResult.error)
	}

	const optimized = optimizeForLLM(transcriptResult.value)

	const prompt = generateEnhancedPrompt(optimized, {
		type: request.platform,
		tone: request.tone || 'professional'
	})

	const provider = request.provider || 'openai'

	console.log('ai.model', provider, aiProviders[provider])
	console.log('ai.prompt', prompt)
	console.log('ai.platform', request.platform)
	console.log('ai.maxOutputTokens', getPlatformTokenLimit(request.platform))
	console.log('ai.system', getSystemPrompt(request.platform))

	const { text } = await generateText({
		model: aiProviders[provider],
		system: getSystemPrompt(request.platform),
		prompt
	})

	console.log('ai.generatedContent.text', text)

	return formatGeneratedContent(text, request.platform, provider, request.tone || 'professional')
}

function formatGeneratedContent(
	text: string,
	platform: Platform,
	provider: AIProvider,
	tone: string
): GeneratedContent {
	const hashtags = extractHashtags(text)
	const cleanContent = removeExcessHashtags(text, hashtags, platform)

	return {
		content: cleanContent.trim(),
		platform,
		characterCount: cleanContent.length,
		hashtags,
		metadata: {
			model: provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-haiku-20240307',
			generatedAt: new Date().toISOString(),
			tone,
			provider
		}
	}
}

function extractHashtags(text: string): string[] {
	const hashtagRegex = /#[\w]+/g
	const matches = text.match(hashtagRegex) || []
	return Array.from(new Set(matches))
}

function removeExcessHashtags(text: string, hashtags: string[], platform: Platform): string {
	const limit = PLATFORM_LIMITS[platform].hashtagLimit

	if (hashtags.length <= limit) {
		return text
	}

	const removeHashtags = hashtags.slice(limit)

	let cleanedText = text
	for (const hashtag of removeHashtags) {
		cleanedText = cleanedText.replace(new RegExp(hashtag, 'g'), '')
	}

	return cleanedText.replace(/\s+/g, ' ')
}

async function generateContentWithAutomation(
	request: { eventId: string; automationId: string; provider?: string },
	userId: string
): Promise<GeneratedContent> {
	const automation = await automationService.getAutomation(userId, request.automationId)

	const transcriptResult = await transcriptService.getTranscriptByEventId(request.eventId, userId)

	if (transcriptResult.isErr()) {
		throw new Error(transcriptResult.error)
	}

	const optimized = optimizeForLLM(transcriptResult.value)

	const customPrompt = `${automation.description}\n\nMeeting Transcript:\n${optimized}`

	const provider: AIProvider = request.provider ? (request.provider as AIProvider) : 'openai'

	console.log('ai.automation.model', provider, aiProviders[provider])
	console.log('ai.automation.prompt', customPrompt)
	console.log('ai.automation.platform', automation.platform)

	const { text } = await generateText({
		model: aiProviders[provider],
		system: 'You are an AI assistant. Follow the instructions precisely and use the meeting transcript provided.',
		prompt: customPrompt
	})

	console.log('ai.automation.generatedContent.text', text)

	const platformMapping: Record<string, Platform> = {
		LINKEDIN: 'linkedin',
		FACEBOOK: 'facebook',
		X: 'X',
		THREADS: 'threads'
	}

	return formatGeneratedContent(text, platformMapping[automation.platform] || 'linkedin', provider, 'automation')
}
