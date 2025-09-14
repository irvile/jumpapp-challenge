import { envs } from '@backend/libs/envs'
import { createFetch } from '@zimic/fetch'
import type { HttpSchema } from '@zimic/http'

export const RECALL_BASE_URL = 'https://us-west-2.recall.ai/api/v1'

export const recallAuthBasic = `Token ${envs.RECALL_API_KEY}`

export type CreateBotBodyRecall = {
	meeting_url: string
	bot_name: string
	join_at: string
	recording_config: {
		transcript: {
			provider: {
				recallai_streaming: {
					language_code: 'auto'
				}
			}
		}
	}
}

export type BotStatusChangeRecall = {
	code:
		| 'joining_call'
		| 'in_waiting_room'
		| 'in_call_not_recording'
		| 'in_call_recording'
		| 'call_ended'
		| 'recording_done'
		| 'done'
	message: string
	created_at: string // ISO 8601
	sub_code: string
}

export type RecordingRecall = {
	id: string
	status: {
		code: string
		updated_at: string // ISO 8601
	}
	media_shortcuts: {
		transcript: {
			id: string
			created_at: string // ISO 8601
			status: {
				code: string
				updated_at: string // ISO 8601
			}
			data: {
				download_url: string
				provider_data_download_url: string
			}
		}
	}
}

export type BotResponseRecall = {
	id: string
	meeting_url: string
	bot_name: string
	join_at: string
	status_changes: BotStatusChangeRecall[]
	recordings: RecordingRecall[]
	recording_config: {
		transcript: {
			provider: {
				recallai_streaming: {
					language_code: 'auto'
				}
			}
		}
	}
}

export type RecallHttpSchema = HttpSchema<{
	'/bot': {
		POST: {
			request: {
				body: CreateBotBodyRecall
				headers: {
					'content-type': 'application/json; charset=utf-8'
					'authorization': string
				}
			}
			response: {
				201: { body: BotResponseRecall }
			}
		}
	}
	'/bot/:id': {
		DELETE: {
			response: {
				// biome-ignore lint/complexity/noBannedTypes: okay
				204: {}
			}
		}
		GET: {
			request: {
				headers: {
					'authorization': string
				}
			}
			response: {
				200: { body: BotResponseRecall }
			}
		}
	}
}>

export const recallFetch = createFetch<RecallHttpSchema>({
	baseURL: RECALL_BASE_URL
})

export async function createBot(botData: CreateBotBodyRecall): Promise<BotResponseRecall> {
	const response = await recallFetch('/bot', {
		method: 'POST',
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'authorization': recallAuthBasic
		},
		body: JSON.stringify(botData)
	})

	if (!response.ok) {
		console.error('Failed to create bot with Recall API', response.status, response.statusText)
		throw new Error(`Failed to create bot: ${response.status} ${response.statusText}`)
	}

	return response.json()
}

export async function getBot(id: string): Promise<BotResponseRecall> {
	const response = await recallFetch(`/bot/${id}`, {
		method: 'GET',
		headers: {
			'authorization': recallAuthBasic
		}
	})

	if (!response.ok) {
		console.error('Failed to get bot with Recall API', response.status, response.statusText)
		throw new Error(`Failed to get bot: ${response.status} ${response.statusText}`)
	}

	return response.json()
}

export async function deleteBot(id: string): Promise<void> {
	const response = await recallFetch(`/bot/${id}`, {
		method: 'DELETE'
	})

	if (!response.ok) {
		throw new Error(`Failed to delete bot: ${response.status} ${response.statusText}`)
	}
}
