import { db } from '@backend/libs/db'
import { getBot } from '@backend/libs/recall/recall'
import { downloadTranscript } from '@backend/libs/recall/transcript/download.service'
import { parseTranscript } from '@backend/libs/recall/transcript/parser'
import type { ParsedTranscript } from '@backend/libs/recall/transcript/types'
import { err, ok } from 'neverthrow'

export class TranscriptService {
	async getOrDownloadTranscript(eventId: string, userId: string) {
		const calendarEvent = await db.calendarEvent.findFirst({
			where: {
				id: eventId,
				calendarAccount: {
					userId: userId
				}
			},
			include: {
				bot: {
					include: {
						transcript: true
					}
				}
			}
		})

		if (!calendarEvent) {
			return { success: false, error: 'Calendar event not found' }
		}

		if (!calendarEvent.bot) {
			return { success: false, error: 'No bot found for this event' }
		}

		if (calendarEvent.bot.transcript) {
			try {
				const parsedTranscript = JSON.parse(calendarEvent.bot.transcript.content) as ParsedTranscript
				return { success: true, transcript: parsedTranscript }
			} catch {
				return { success: false, error: 'Failed to parse existing transcript' }
			}
		}

		if (calendarEvent.bot.status !== 'COMPLETED') {
			return { success: false, error: 'Bot recording is not completed yet' }
		}

		if (!calendarEvent.bot.recallBotId) {
			return { success: false, error: 'No Recall bot ID found' }
		}

		return await this.downloadAndParseTranscript(calendarEvent.bot.id, calendarEvent.bot.recallBotId)
	}

	async downloadAndParseTranscript(botId: string, recallBotId: string) {
		try {
			const recallBot = await getBot(recallBotId)

			const recording = recallBot.recordings?.[0]
			if (!recording || recording.status.code !== 'done') {
				return { success: false, error: 'Recording not ready for download' }
			}

			const transcriptData = recording.media_shortcuts?.transcript
			if (!transcriptData || transcriptData.status.code !== 'done') {
				return { success: false, error: 'Transcript not ready for download' }
			}

			const downloadUrl = transcriptData.data.download_url
			const rawTranscript = await downloadTranscript(downloadUrl)
			const parsedTranscript = parseTranscript(rawTranscript)

			await this.saveTranscriptToDb(botId, parsedTranscript, rawTranscript)

			return { success: true, transcript: parsedTranscript }
		} catch {
			return { success: false, error: 'Failed to download and parse transcript' }
		}
	}

	async saveTranscriptToDb(botId: string, parsedTranscript: ParsedTranscript, rawTranscript: unknown) {
		await db.transcript.create({
			data: {
				content: JSON.stringify(parsedTranscript),
				rawContent: JSON.stringify(rawTranscript),
				recallBotId: botId
			}
		})
	}

	async getTranscriptByEventId(eventId: string, userId: string) {
		const calendarEvent = await db.calendarEvent.findFirst({
			where: {
				id: eventId,
				calendarAccount: {
					userId: userId
				}
			},
			include: {
				bot: {
					include: {
						transcript: true
					}
				}
			}
		})

		if (!calendarEvent) {
			return err('Calendar event not found')
		}

		if (!calendarEvent.bot) {
			return err('No bot found for this event')
		}

		if (!calendarEvent.bot.transcript) {
			return err('No transcript available')
		}

		try {
			const parsedTranscript = JSON.parse(calendarEvent.bot.transcript.content) as ParsedTranscript
			return ok(parsedTranscript)
		} catch {
			return err('Failed to parse transcript')
		}
	}
}

export const transcriptService = new TranscriptService()
