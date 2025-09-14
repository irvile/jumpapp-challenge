import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { signUp } from '@backend/libs/auth'
import { BotStatus, type CalendarAccount, Platform, PrismaClient, type User } from '@backend/libs/generated/prisma'
import { genId } from '@backend/libs/nanoid'
import { parseTranscript } from '@backend/libs/recall/transcript/parser'
import type { ParsedTranscript, RecallTranscript } from '@backend/libs/recall/transcript/types'
import { testFactory } from '@backend/libs/test-utils'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

async function main() {
	await testFactory.cleanDatabase()
	const userCreated = await userSeeds()
	const calendarAccountCreated = await calendarAccountSeeds(userCreated)
	await meetingSeeds(calendarAccountCreated)
}

async function userSeeds() {
	const user = testFactory.createUser({
		email: 'ada@example.com',
		name: 'Ada Lovelace',
		password: 'password123'
	})
	await signUp(user.data.name, user.data.email, user.data.password)

	const userCreated = await prisma.user.findUniqueOrThrow({
		where: {
			email: user.data.email
		}
	})

	return userCreated
}

async function calendarAccountSeeds(user: User) {
	const calendarAccount = await prisma.calendarAccount.create({
		data: {
			user: {
				connect: {
					id: user.id
				}
			},
			email: 'ada@example.com',
			name: 'Ada Lovelace',
			googleId: '1234567890',
			accessToken: '1234567890'
		}
	})

	return calendarAccount
}

async function meetingSeeds(calendarAccount: CalendarAccount) {
	const now = dayjs()

	const days = [-1, 0, 1]

	const meetingTemplates = [
		{
			title: 'Daily Standup',
			description: 'Team aligning daily priorities and blockers',
			platform: Platform.GOOGLE_MEET,
			hour: 9,
			duration: 60,
			attendees: JSON.stringify([
				{ email: 'ada@example.com', displayName: 'Ada Lovelace', organizer: true, responseStatus: 'accepted' },
				{ email: 'john@example.com', displayName: 'John Doe', responseStatus: 'accepted' },
				{ email: 'mary@example.com', displayName: 'Mary Smith', responseStatus: 'accepted' }
			]),
			status: BotStatus.COMPLETED,
			hasTranscript: true
		},
		{
			title: 'Sprint Planning',
			description: 'Planning upcoming sprint tasks and user stories',
			platform: Platform.ZOOM,
			hour: 14,
			duration: 90,
			attendees: JSON.stringify([
				{ email: 'ada@example.com', displayName: 'Ada Lovelace', organizer: true, responseStatus: 'accepted' },
				{ email: 'dev@example.com', displayName: 'Dev Team Lead', responseStatus: 'accepted' },
				{ email: 'pm@example.com', displayName: 'Project Manager', responseStatus: 'tentative' }
			]),
			status: BotStatus.RECORDING,
			hasTranscript: false
		},
		{
			title: 'Client Presentation',
			description: 'Presenting project progress to client stakeholders',
			platform: Platform.MICROSOFT_TEAMS,
			hour: 16,
			duration: 120,
			attendees: JSON.stringify([
				{ email: 'ada@example.com', displayName: 'Ada Lovelace', organizer: true, responseStatus: 'accepted' },
				{ email: 'client@example.com', displayName: 'Client Representative', responseStatus: 'accepted' },
				{ email: 'manager@example.com', displayName: 'Team Manager', responseStatus: 'accepted' }
			]),
			status: BotStatus.SCHEDULED,
			hasTranscript: false
		}
	]

	for (const dayOffset of days) {
		const currentDay = now.add(dayOffset, 'day')

		for (let i = 0; i < meetingTemplates.length; i++) {
			const template = meetingTemplates[i]
			const startTime = currentDay.hour(template.hour).minute(0).second(0)
			const endTime = startTime.add(template.duration, 'minute')

			const calendarEvent = await prisma.calendarEvent.create({
				data: {
					externalId: `meeting-${startTime.format('YYYYMMDD-HHmm')}-${i}`,
					title: template.title,
					description: template.description,
					startTime: startTime.toDate(),
					endTime: endTime.toDate(),
					meetingUrl: generateMeetingUrl(template.platform),
					platform: template.platform,
					attendees: template.attendees,
					googleAccountId: calendarAccount.id
				}
			})

			const bot = await prisma.bot.create({
				data: {
					botId: `bot-${calendarEvent.id}`,
					recallBotId: `recall-${calendarEvent.id}`,
					calendarEventId: calendarEvent.id,
					status: template.status,
					webhookReceived: template.hasTranscript,
					joinedAt: template.hasTranscript ? startTime.add(5, 'minute').toDate() : null,
					leftAt: template.hasTranscript ? endTime.toDate() : null
				}
			})

			if (template.hasTranscript) {
				const transcriptData = generateTranscriptData(template.title, startTime, endTime)
				await prisma.transcript.create({
					data: {
						content: transcriptData.content,
						rawContent: transcriptData.rawContent,
						recallBotId: bot.id
					}
				})
			}
		}
	}
}

function generateMeetingUrl(platform: Platform): string {
	switch (platform) {
		case Platform.GOOGLE_MEET:
			return `https://meet.google.com/${genId('random')}`
		case Platform.ZOOM:
			return `https://zoom.us/j/${genId('random')}`
		case Platform.MICROSOFT_TEAMS:
			return `https://teams.microsoft.com/meeting/${genId('random')}`
		default:
			return `https://meet.example.com/${genId('random')}`
	}
}

function generateTranscriptData(
	title: string,
	startTime: dayjs.Dayjs,
	endTime: dayjs.Dayjs
): { content: string; rawContent: string } {
	const duration = endTime.diff(startTime, 'second')

	const transcriptFilePath = join(__dirname, 'meet-diarized-processed1.1.json')
	const realTranscriptData = JSON.parse(readFileSync(transcriptFilePath, 'utf-8')) as RecallTranscript
	const timeOffset = startTime.valueOf() - dayjs('2025-09-13T19:31:20.135Z').valueOf()

	const adjustedTranscript: RecallTranscript = realTranscriptData.map((participant) => ({
		participant: {
			...participant.participant,
			name: participant.participant.id === 100 ? 'Ada Lovelace' : 'John Doe',
			is_host: participant.participant.id === 100
		},
		words: participant.words.map((word) => ({
			text: word.text,
			start_timestamp: {
				relative: word.start_timestamp.relative,
				absolute: dayjs(word.start_timestamp.absolute).add(timeOffset, 'ms').format()
			},
			end_timestamp: {
				relative: word.end_timestamp.relative,
				absolute: dayjs(word.end_timestamp.absolute).add(timeOffset, 'ms').format()
			}
		}))
	}))

	try {
		const parsedTranscript = parseTranscript(adjustedTranscript)
		return {
			content: JSON.stringify(parsedTranscript),
			rawContent: JSON.stringify(adjustedTranscript)
		}
	} catch {
		const fallbackContent: ParsedTranscript = {
			meeting: {
				duration: duration / 60,
				startTime: startTime.format(),
				endTime: endTime.format(),
				platform: 'google_meet'
			},
			participants: [
				{
					id: 1,
					name: 'Ada Lovelace',
					role: 'host',
					totalSpeakingTime: 30,
					segmentCount: 1
				}
			],
			conversation: [
				{
					participant: 'Ada Lovelace',
					participantId: 1,
					timestamp: startTime.format(),
					startTime: 0,
					endTime: 30,
					duration: 30,
					text: `Hello everyone. Let's discuss ${title.toLowerCase()}`,
					segmentIndex: 1
				}
			]
		}

		return {
			content: JSON.stringify(fallbackContent),
			rawContent: JSON.stringify([])
		}
	}
}

main()
	.then(() => {
		console.log('Database seeded successfully')
	})
	.catch((error) => {
		console.error(error)
	})
