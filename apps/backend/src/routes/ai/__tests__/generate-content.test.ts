import { beforeEach, describe, expect, jest, test } from 'bun:test'
import { db } from '@backend/libs/db'
import { genId } from '@backend/libs/nanoid'
import { apiTest, testFactory } from '@backend/libs/test-utils'
import * as aiSdk from 'ai'

const mockLinkedInResponse =
	'Just had an amazing strategy meeting! 🚀 Key insights: Always validate assumptions with data, customer feedback drives innovation, and rapid prototyping accelerates learning. These principles are transforming how we approach product development. What strategies have worked best for your team? #strategy #innovation #leadership #productdevelopment'

const mockFacebookResponse =
	'Had one of those meetings today where everything just clicked! 💡 We talked about how listening to users and iterating quickly can completely change your product direction. Sometimes the best insights come from the most unexpected conversations. Anyone else had those "aha!" moments in meetings recently? #innovation #teamwork #startup'

const mockTwitterResponse =
	'1/3 Just wrapped an incredible strategy session! 🚀\n\n2/3 Key insight: Data-driven decisions > gut feelings every time. Customer feedback loops are everything.\n\n3/3 Next up: implementing rapid prototyping to test our assumptions faster. What tools do you use for rapid iteration? #strategy #startups'

const mockThreadsResponse =
	'Just had one of those meetings where everything clicked ✨ Sometimes the best ideas really do come from unexpected conversations. Anyone else find their best insights happen in casual chats rather than formal presentations? #brainstorming #ideas'

function createRealisticTranscriptData() {
	return {
		meeting: {
			duration: 45,
			platform: 'google_meet',
			startTime: new Date().toISOString()
		},
		participants: [
			{
				id: 1,
				name: 'Sarah Johnson',
				role: 'host',
				totalSpeakingTime: 1800,
				segmentCount: 8
			},
			{
				id: 2,
				name: 'Mike Chen',
				role: 'participant',
				totalSpeakingTime: 1200,
				segmentCount: 6
			}
		],
		conversation: [
			{
				participant: 'Sarah Johnson',
				text: 'Thanks everyone for joining. I wanted to discuss our product strategy for the next quarter.',
				timestamp: new Date(Date.now() - 2700000).toISOString()
			},
			{
				participant: 'Mike Chen',
				text: 'I think we need to focus more on user feedback. The data shows customers are asking for better integration capabilities.',
				timestamp: new Date(Date.now() - 2400000).toISOString()
			},
			{
				participant: 'Sarah Johnson',
				text: 'Absolutely. Data-driven decisions have to be our priority. We cannot rely on gut feelings when we have actual user feedback.',
				timestamp: new Date(Date.now() - 2100000).toISOString()
			},
			{
				participant: 'Mike Chen',
				text: 'I suggest we implement rapid prototyping cycles. Build, test, iterate - that should be our mantra.',
				timestamp: new Date(Date.now() - 1800000).toISOString()
			},
			{
				participant: 'Sarah Johnson',
				text: 'Perfect. Customer feedback drives innovation, and rapid iteration helps us validate assumptions quickly. This is the strategy we need.',
				timestamp: new Date(Date.now() - 1500000).toISOString()
			}
		]
	}
}

async function createEventWithTranscript(userId: string) {
	const calendarAccount = await testFactory.createCalendarAccount({ userId }).save()
	const botId = genId('bot')

	const calendarEvent = await db.calendarEvent.create({
		data: {
			id: genId('calendarEvent'),
			externalId: 'test-external-id',
			title: 'Strategy Meeting',
			googleAccountId: calendarAccount.id,
			startTime: new Date(),
			endTime: new Date(Date.now() + 3600000),
			bot: {
				create: {
					id: botId,
					botId: 'recall-bot-123',
					recallBotId: 'recall-bot-123',
					status: 'COMPLETED',
					transcript: {
						create: {
							content: JSON.stringify(createRealisticTranscriptData()),
							rawContent: JSON.stringify({})
						}
					}
				}
			}
		}
	})

	return calendarEvent
}

describe('AI Generate Content API Tests', () => {
	beforeEach(async () => {
		await testFactory.cleanDatabase()
		jest.clearAllMocks()
	})

	describe('POST /api/v1/ai/generate', () => {
		test('should generate linkedin content successfully', async () => {
			const user = await testFactory.createUser().save()
			const calendarEvent = await createEventWithTranscript(user.user.id)

			jest.spyOn(aiSdk, 'generateText').mockResolvedValue({
				text: mockLinkedInResponse,
				finishReason: 'stop',
				// @ts-expect-error - test
				usage: { promptTokens: 100, completionTokens: 50 }
			})

			const response = await apiTest.api.v1.ai.generate.post(
				{
					eventId: calendarEvent.id,
					platform: 'linkedin'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.error).toBeNull()
			expect(response.data).toBeDefined()

			if (response.data) {
				expect(response.data.content).toBe(mockLinkedInResponse)
				expect(response.data.platform).toBe('linkedin')
				expect(response.data.hashtags).toContain('#strategy')
				expect(response.data.hashtags).toContain('#innovation')
				expect(response.data.hashtags).toContain('#leadership')
				expect(response.data.hashtags.length).toBeLessThanOrEqual(5)
				expect(response.data.characterCount).toBe(mockLinkedInResponse.length)
				expect(response.data.metadata.tone).toBe('professional')
				expect(response.data.metadata.provider).toBe('openai')
				expect(response.data.metadata.model).toBe('gpt-4-turbo-preview')
			}
		})

		test('should generate facebook content successfully', async () => {
			const user = await testFactory.createUser().save()
			const calendarEvent = await createEventWithTranscript(user.user.id)

			jest.spyOn(aiSdk, 'generateText').mockResolvedValue({
				text: mockFacebookResponse,
				finishReason: 'stop',
				// @ts-expect-error - test
				usage: { promptTokens: 120, completionTokens: 80 }
			})

			const response = await apiTest.api.v1.ai.generate.post(
				{
					eventId: calendarEvent.id,
					platform: 'facebook',
					tone: 'casual'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.data?.platform).toBe('facebook')
			expect(response.data?.content).toBe(mockFacebookResponse)
			expect(response.data?.characterCount).toBe(mockFacebookResponse.length)
			expect(response.data?.hashtags).toContain('#innovation')
			expect(response.data?.hashtags).toContain('#teamwork')
			expect(response.data?.hashtags).toContain('#startup')
			expect(response.data?.hashtags.length).toBeLessThanOrEqual(10)
			expect(response.data?.metadata.tone).toBe('casual')
			expect(response.data?.metadata.provider).toBe('openai')
		})

		test('should return 401 when user is not authenticated', async () => {
			const response = await apiTest.api.v1.ai.generate.post({
				eventId: 'test-event-id',
				platform: 'linkedin'
			})

			expect(response.status).toBe(401)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should return 500 when eventId does not exist', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.ai.generate.post(
				{
					eventId: 'non-existent-event-id',
					platform: 'linkedin'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(500)
			expect(response.error).toBeDefined()
			expect(response.data).toBeNull()
		})

		test('should validate platform enum correctly', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.ai.generate.post(
				{
					eventId: 'test-event-id',
					// @ts-expect-error - test
					platform: 'instagram'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})

		test('should validate tone enum correctly', async () => {
			const user = await testFactory.createUser().save()

			const response = await apiTest.api.v1.ai.generate.post(
				{
					eventId: 'test-event-id',
					platform: 'linkedin',
					// @ts-expect-error - test
					tone: 'funny'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(422)
			expect(response.error).toBeDefined()
		})

		test('should generate X (twitter) thread successfully', async () => {
			const user = await testFactory.createUser().save()
			const calendarEvent = await createEventWithTranscript(user.user.id)

			jest.spyOn(aiSdk, 'generateText').mockResolvedValue({
				text: mockTwitterResponse,
				finishReason: 'stop',
				// @ts-expect-error - test
				usage: { promptTokens: 90, completionTokens: 70 }
			})

			const response = await apiTest.api.v1.ai.generate.post(
				{
					eventId: calendarEvent.id,
					platform: 'X',
					provider: 'anthropic'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.data?.platform).toBe('X')
			expect(response.data?.content).toBe(mockTwitterResponse)
			expect(response.data?.content).toContain('1/3')
			expect(response.data?.content).toContain('2/3')
			expect(response.data?.content).toContain('3/3')
			expect(response.data?.hashtags).toContain('#strategy')
			expect(response.data?.hashtags).toContain('#startups')
			expect(response.data?.hashtags.length).toBeLessThanOrEqual(3)
			expect(response.data?.metadata.provider).toBe('anthropic')
		})

		test('should generate threads content successfully', async () => {
			const user = await testFactory.createUser().save()
			const calendarEvent = await createEventWithTranscript(user.user.id)

			jest.spyOn(aiSdk, 'generateText').mockResolvedValue({
				text: mockThreadsResponse,
				finishReason: 'stop',
				// @ts-expect-error - test
				usage: { promptTokens: 80, completionTokens: 60 }
			})

			const response = await apiTest.api.v1.ai.generate.post(
				{
					eventId: calendarEvent.id,
					platform: 'threads',
					tone: 'casual'
				},
				{
					headers: {
						Cookie: user.cookie
					}
				}
			)

			expect(response.status).toBe(200)
			expect(response.data?.platform).toBe('threads')
			expect(response.data?.content).toBe(mockThreadsResponse)
			expect(response.data?.characterCount).toBeLessThanOrEqual(500)
			expect(response.data?.hashtags).toContain('#brainstorming')
			expect(response.data?.hashtags).toContain('#ideas')
			expect(response.data?.hashtags.length).toBeLessThanOrEqual(5)
			expect(response.data?.metadata.tone).toBe('casual')
		})
	})
})
