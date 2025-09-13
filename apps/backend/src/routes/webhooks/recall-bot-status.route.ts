import { db } from '@backend/libs/db'
import type { BotStatus } from '@backend/libs/generated/prisma'
import type { BotStatusChangeRecall } from '@backend/libs/recall/recall'
import Elysia, { status, t } from 'elysia'

const webhookBodySchema = t.Object({
	bot_id: t.String(),
	status_change: t.Object({
		code: t.Union([
			t.Literal('joining_call'),
			t.Literal('in_waiting_room'),
			t.Literal('in_call_not_recording'),
			t.Literal('in_call_recording'),
			t.Literal('call_ended'),
			t.Literal('recording_done'),
			t.Literal('done')
		]),
		message: t.String(),
		timestamp: t.String(),
		sub_code: t.String()
	})
})

async function handleBotStatusWebhook(botId: string, statusChange: BotStatusChangeRecall) {
	const bot = await db.bot.findFirst({
		where: {
			recallBotId: botId
		}
	})

	if (!bot) {
		return status(404, { error: 'Bot not found' })
	}

	let newStatus: BotStatus = bot.status
	let joinedAt = bot.joinedAt
	let leftAt = bot.leftAt

	switch (statusChange.code) {
		case 'joining_call':
		case 'in_waiting_room':
			newStatus = 'JOINING'
			break
		case 'in_call_not_recording':
			newStatus = 'JOINED'
			if (!joinedAt) {
				joinedAt = new Date(statusChange.timestamp)
			}
			break
		case 'in_call_recording':
			newStatus = 'RECORDING'
			if (!joinedAt) {
				joinedAt = new Date(statusChange.timestamp)
			}
			break
		case 'call_ended':
		case 'recording_done':
		case 'done':
			newStatus = 'COMPLETED'
			if (!leftAt) {
				leftAt = new Date(statusChange.timestamp)
			}
			break
		default:
			break
	}

	await db.bot.update({
		where: {
			id: bot.id
		},
		data: {
			status: newStatus,
			webhookReceived: true,
			lastStatusCheck: new Date(),
			joinedAt,
			leftAt
		}
	})

	return {
		success: true,
		message: 'Status updated successfully'
	}
}

export const recallBotStatusWebhookRoute = new Elysia().post(
	'/recall/bot-status',
	async ({ body }) => {
		return await handleBotStatusWebhook(body.bot_id, body.status_change)
	},
	{
		body: webhookBodySchema
	}
)
