import { db } from '@backend/libs/db'
import type { BotStatus } from '@backend/libs/generated/prisma'
import { createBot, deleteBot, getBot } from '@backend/libs/recall/recall'
import { err, ok } from 'neverthrow'

export class BotManagementService {
	async scheduleBotForEvent(eventId: string, userId: string) {
		const calendarEvent = await db.calendarEvent.findFirst({
			where: {
				id: eventId,
				calendarAccount: {
					userId: userId
				}
			},
			include: {
				bot: true
			}
		})

		console.log('calendarEvent', JSON.stringify(calendarEvent, null, 2))

		if (!calendarEvent) {
			return { success: false, error: 'Calendar event not found' }
		}

		if (new Date(calendarEvent.startTime) <= new Date()) {
			return { success: false, error: 'Cannot schedule bot for past events' }
		}

		if (!calendarEvent.meetingUrl) {
			return { success: false, error: 'No meeting URL available for this event' }
		}

		if (calendarEvent.bot) {
			return { success: true, bot: calendarEvent.bot }
		}

		try {
			const recallBot = await createBot({
				meeting_url: calendarEvent.meetingUrl,
				bot_name: `Meeting Bot - ${calendarEvent.title}`,
				join_at: calendarEvent.startTime.toISOString(),
				recording_config: {
					transcript: {
						provider: {
							recallai_streaming: {
								language_code: 'auto'
							}
						}
					}
				}
			})

			const bot = await db.bot.create({
				data: {
					botId: `bot_${Date.now()}`,
					recallBotId: recallBot.id,
					calendarEventId: calendarEvent.id,
					status: 'JOINING'
				}
			})

			return { success: true, bot }
		} catch (error) {
			console.error('Failed to create bot with Recall API', error)
			const bot = await db.bot.create({
				data: {
					botId: `bot_${Date.now()}`,
					calendarEventId: calendarEvent.id,
					status: 'FAILED'
				}
			})

			return { success: false, error: 'Failed to create bot with Recall API', bot }
		}
	}

	async cancelBotForEvent(eventId: string, userId: string) {
		const calendarEvent = await db.calendarEvent.findFirst({
			where: {
				id: eventId,
				calendarAccount: {
					userId: userId
				}
			},
			include: {
				bot: true
			}
		})

		if (!calendarEvent) {
			return { success: false, error: 'Calendar event not found' }
		}

		if (!calendarEvent.bot) {
			return { success: true, bot: null }
		}

		try {
			if (calendarEvent.bot.recallBotId) {
				await deleteBot(calendarEvent.bot.recallBotId)
			}

			await db.bot.delete({
				where: {
					id: calendarEvent.bot.id
				}
			})

			return { success: true, bot: null }
		} catch {
			return { success: false, error: 'Failed to cancel bot' }
		}
	}

	async syncBotWithRecall(botId: string) {
		const bot = await db.bot.findUnique({
			where: { id: botId }
		})

		if (!bot || !bot.recallBotId) {
			return
		}

		try {
			const recallBot = await getBot(bot.recallBotId)
			const latestStatus = recallBot.status_changes[recallBot.status_changes.length - 1]

			let newStatus: BotStatus = bot.status
			let joinedAt = bot.joinedAt
			let leftAt = bot.leftAt

			switch (latestStatus.code) {
				case 'joining_call':
					newStatus = 'JOINING'
					break
				case 'in_call_recording':
					newStatus = 'RECORDING'
					if (!joinedAt) {
						joinedAt = new Date(latestStatus.timestamp)
					}
					break
				case 'call_ended':
				case 'recording_done':
				case 'done':
					newStatus = 'COMPLETED'
					if (!leftAt) {
						leftAt = new Date(latestStatus.timestamp)
					}
					break
				default:
					break
			}

			await db.bot.update({
				where: { id: botId },
				data: {
					status: newStatus,
					lastStatusCheck: new Date(),
					joinedAt: joinedAt,
					leftAt: leftAt
				}
			})
		} catch {
			await db.bot.update({
				where: { id: botId },
				data: {
					status: 'FAILED',
					lastStatusCheck: new Date()
				}
			})
		}
	}

	async getBotStatus(eventId: string, userId: string) {
		const calendarEvent = await db.calendarEvent.findFirst({
			where: {
				id: eventId,
				calendarAccount: {
					userId: userId
				}
			},
			include: {
				bot: true
			}
		})

		if (!calendarEvent) {
			return err('Calendar event not found')
		}

		if (!calendarEvent.bot) {
			return ok({ bot: null })
		}

		if (calendarEvent.bot.recallBotId && !calendarEvent.bot.webhookReceived) {
			await this.syncBotWithRecall(calendarEvent.bot.id)

			const updatedBot = await db.bot.findUnique({
				where: { id: calendarEvent.bot.id }
			})

			return ok({ bot: updatedBot })
		}

		return ok({ bot: calendarEvent.bot })
	}
}

export const botManagementService = new BotManagementService()
