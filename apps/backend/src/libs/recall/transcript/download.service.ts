import type { RecallTranscript } from './types'

export async function downloadTranscript(downloadUrl: string): Promise<RecallTranscript> {
	const response = await fetch(downloadUrl)

	if (!response.ok) {
		throw new Error(`Failed to download transcript: ${response.status} ${response.statusText}`)
	}

	const transcript = await response.json()
	return transcript as RecallTranscript
}
