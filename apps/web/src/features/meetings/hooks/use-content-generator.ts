import { useMutation } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

export type Platform = 'linkedin' | 'facebook' | 'X' | 'threads'
export type Tone = 'professional' | 'casual' | 'technical'
export type Provider = 'openai' | 'anthropic' | 'gemini'

export interface GeneratedContent {
	content: string
	platform: Platform
	characterCount: number
	hashtags: string[]
	metadata: {
		model: string
		generatedAt: string
		tone: string
		provider: string
	}
}

export function useContentGenerator() {
	return useMutation({
		mutationFn: async ({ 
			meetingId, 
			platform, 
			tone, 
			provider,
			automationId
		}: { 
			meetingId: string
			platform: Platform
			tone?: Tone
			provider: Provider
			automationId?: string
		}) => {
			const response = await backend.api.v1.ai.generate.post({
				eventId: meetingId,
				platform,
				tone,
				provider,
				...(automationId && { automationId })
			})

			if (response.error) {
				throw new Error('Failed to generate content')
			}

			return response.data as GeneratedContent
		}
	})
}