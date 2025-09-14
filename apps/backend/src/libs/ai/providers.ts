import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { envs } from '@backend/libs/envs'
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli'

const geminiProvider = createGeminiProvider({
	authType: 'api-key',
	apiKey: envs.GEMINI_API_KEY
})

export const aiProviders = {
	openai: openai('gpt-5-nano'),
	gemini: geminiProvider('gemini-2.5-flash'),
	anthropic: anthropic('claude-3-5-haiku-latest')
} as const

export type AIProvider = keyof typeof aiProviders

export const PLATFORM_LIMITS = {
	linkedin: { maxChars: 3000, hashtagLimit: 5 },
	facebook: { maxChars: 63206, hashtagLimit: 10 },
	X: { maxChars: 280, hashtagLimit: 3 },
	threads: { maxChars: 500, hashtagLimit: 5 }
} as const

export type Platform = keyof typeof PLATFORM_LIMITS

export function getPlatformTokenLimit(platform: Platform): number {
	return Math.ceil(PLATFORM_LIMITS[platform].maxChars / 4)
}
