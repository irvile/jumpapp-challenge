import { useMutation } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'

interface EmailRecapRequest {
	eventId: string
	provider?: 'openai' | 'anthropic' | 'gemini'
}

interface EmailRecapResponse {
	subject: string
	content: string
	metadata: {
		model: string
		generatedAt: string
		provider: string
	}
}

export function useEmailRecap() {
	return useMutation({
		mutationFn: async (request: EmailRecapRequest): Promise<EmailRecapResponse> => {
			const response = await backend.api.v1.ai['generate-email-recap'].post({
				eventId: request.eventId,
				provider: request.provider
			})

			if (!response.data) {
				throw new Error('Failed to generate email recap')
			}

			return response.data
		}
	})
}
