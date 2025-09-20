import { jest } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import { randomUUIDv7 } from 'bun'
import { app } from '../app'
import { signIn, signUp } from './auth'
import { db } from './db'
import { envs } from './envs'
import type { ContentType, Platform, SocialPlatform } from './generated/prisma'
import { genId } from './nanoid'

export const apiTest = treaty(app)

class TestFactory {
	createUser(body?: { name?: string; email?: string; password?: string }) {
		const data = {
			name: body?.name ?? `Ada Lovelace`,
			email: body?.email ?? `ada-${randomUUIDv7()}@example.com`,
			password: body?.password ?? 'password'
		}

		const save = async () => {
			const userResponse = await signUp(data.name, data.email, data.password)

			const session = await signIn(data.email, data.password)
			const cookie = session.headers.get('set-cookie') as string

			return { user: userResponse.user, cookie }
		}

		return { data, save }
	}

	createCalendarAccount(body?: {
		googleId?: string
		email?: string
		name?: string
		userId?: string
		createdAt?: Date
	}) {
		const data = {
			googleId: body?.googleId ?? `google-${genId('random')}`,
			email: body?.email ?? `test-${genId('random')}@gmail.com`,
			name: body?.name ?? 'Test Account',
			userId: body?.userId ?? genId('user'),
			createdAt: body?.createdAt ?? new Date()
		}

		const save = async () => {
			return await db.calendarAccount.create({
				data: {
					id: genId('calendarAccount'),
					googleId: data.googleId,
					email: data.email,
					name: data.name,
					accessToken: 'test-access-token',
					userId: data.userId,
					createdAt: data.createdAt
				}
			})
		}

		return { data, save }
	}

	createCalendarEvent(body?: {
		title?: string
		googleAccountId?: string
		startTime?: Date
		endTime?: Date
		description?: string
		meetingUrl?: string
		platform?: string
		attendees?: string
		location?: string
	}) {
		const now = new Date()
		const data = {
			title: body?.title ?? 'Test Meeting',
			googleAccountId: body?.googleAccountId ?? genId('calendarAccount'),
			startTime: body?.startTime ?? now,
			endTime: body?.endTime ?? new Date(now.getTime() + 60 * 60 * 1000),
			description: body?.description ?? null,
			meetingUrl: body?.meetingUrl ?? null,
			platform: body?.platform ?? null,
			attendees: body?.attendees ?? null,
			location: body?.location ?? null
		}

		const save = async () => {
			return await db.calendarEvent.create({
				data: {
					id: genId('calendarEvent'),
					externalId: `external-${genId('random')}`,
					title: data.title,
					googleAccountId: data.googleAccountId,
					startTime: data.startTime,
					endTime: data.endTime,
					description: data.description,
					meetingUrl: data.meetingUrl,
					platform: data.platform as Platform,
					attendees: data.attendees,
					location: data.location
				}
			})
		}

		return { data, save }
	}

	createCalendarEventMock(body?: {
		id?: string
		summary?: string
		description?: string
		startDateTime?: string
		endDateTime?: string
		attendees?: Array<{ email: string; displayName?: string }>
		location?: string
	}) {
		const now = new Date()
		const endTime = new Date(now.getTime() + 60 * 60 * 1000)

		return {
			id: body?.id ?? `event_${Date.now()}`,
			summary: body?.summary ?? 'Test Calendar Event',
			description: body?.description ?? 'Test event with zoom link: https://zoom.us/j/123456789',
			start: {
				dateTime: body?.startDateTime ?? now.toISOString()
			},
			end: {
				dateTime: body?.endDateTime ?? endTime.toISOString()
			},
			attendees: body?.attendees ?? [{ email: 'test@example.com', displayName: 'Test User' }],
			location: body?.location ?? 'Test Location'
		}
	}

	createSocialMediaAccount(
		userId: string,
		platform: SocialPlatform,
		body?: {
			externalId?: string
			username?: string
			displayName?: string
		}
	) {
		const data = {
			externalId: body?.externalId ?? `${platform.toLowerCase()}-${genId('random')}`,
			username: body?.username ?? `user_${genId('random')}`,
			displayName: body?.displayName ?? `${platform} User`,
			platform,
			userId
		}

		const save = async () => {
			return await db.socialMediaAccount.create({
				data: {
					id: genId('socialMediaAccount'),
					platform: data.platform,
					externalId: data.externalId,
					username: data.username,
					displayName: data.displayName,
					accessToken: 'test-access-token',
					userId: data.userId
				}
			})
		}

		return { data, save }
	}

	createAutomation(
		userId: string,
		socialMediaAccountId: string,
		body?: {
			name?: string
			contentType?: ContentType
			prompt?: string
			isActive?: boolean
			createdAt?: Date
			description?: string
			example?: string
		}
	) {
		const data = {
			name: body?.name ?? 'Test Automation',
			type: 'GENERATE_POST' as const,
			platform: (body?.contentType === 'FACEBOOK_POST' ? 'FACEBOOK' : 'LINKEDIN') as SocialPlatform,
			description: body?.description ?? 'Generate a LinkedIn post from the meeting transcript.',
			example: body?.example ?? 'Just had an amazing meeting about AI trends...',
			contentType: body?.contentType ?? ('LINKEDIN_POST' as ContentType),
			isActive: body?.isActive ?? true,
			userId,
			socialMediaAccountId,
			createdAt: body?.createdAt ?? new Date()
		}

		const save = async () => {
			return await db.automation.create({
				data: {
					id: genId('automation'),
					name: data.name,
					type: data.type,
					platform: data.platform,
					description: data.description,
					example: data.example,
					contentType: data.contentType,
					isActive: data.isActive,
					userId: data.userId,
					socialMediaAccountId: data.socialMediaAccountId,
					createdAt: data.createdAt
				}
			})
		}

		return { data, save }
	}

	createStripeCustomer(body?: { userId?: string; stripeCustomerId?: string }) {
		const data = {
			userId: body?.userId ?? genId('user'),
			stripeCustomerId: body?.stripeCustomerId ?? `cus_${genId('random')}`
		}

		const save = async () => {
			return {
				stripeCustomer: await db.stripeCustomer.create({
					data: {
						id: genId('stripeCustomer'),
						userId: data.userId,
						stripeCustomerId: data.stripeCustomerId
					}
				})
			}
		}

		return { data, save }
	}

	createSubscription(body: {
		stripeCustomerId: string
		stripeSubscriptionId?: string
		status?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'paused'
		currentPeriodStart?: Date
		currentPeriodEnd?: Date
		cancelAtPeriodEnd?: boolean
		canceledAt?: Date | null
		priceId?: string
		productId?: string
		metadata?: Record<string, unknown>
	}) {
		const data = {
			stripeCustomerId: body.stripeCustomerId,
			stripeSubscriptionId: body.stripeSubscriptionId ?? `sub_${genId('random')}`,
			status: body.status ?? 'active',
			currentPeriodStart: body.currentPeriodStart ?? new Date(),
			currentPeriodEnd: body.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: body.cancelAtPeriodEnd ?? false,
			canceledAt: body.canceledAt ?? null,
			priceId: body.priceId ?? `price_${genId('random')}`,
			productId: body.productId ?? `prod_${genId('random')}`,
			metadata: body.metadata ?? {}
		}

		const save = async () => {
			return await db.subscription.create({
				data: {
					id: genId('subscription'),
					stripeSubscriptionId: data.stripeSubscriptionId,
					stripeCustomerId: data.stripeCustomerId,
					status: data.status,
					currentPeriodStart: data.currentPeriodStart,
					currentPeriodEnd: data.currentPeriodEnd,
					cancelAtPeriodEnd: data.cancelAtPeriodEnd,
					canceledAt: data.canceledAt,
					priceId: data.priceId,
					productId: data.productId,
					metadata: data.metadata as any
				}
			})
		}

		return { data, save }
	}

	async cleanDatabase() {
		if (envs.NODE_ENV !== 'production') {
			await db.aiGeneratedContent.deleteMany()
			await db.socialMediaPost.deleteMany()
			await db.automation.deleteMany()
			await db.socialMediaAccount.deleteMany()
			await db.transcript.deleteMany()
			await db.bot.deleteMany()
			await db.calendarEvent.deleteMany()
			await db.calendarAccount.deleteMany()
			await db.subscription.deleteMany()
			await db.stripeCustomer.deleteMany()
			await db.user.deleteMany()
		}
	}
}

type CapturedRequest = {
	url?: string
	method?: string
	headers?: Record<string, string>
	body?: Record<string, unknown>
	searchParams?: Record<string, string>
	// biome-ignore lint/suspicious/noExplicitAny: its okay
	rawBody?: any
}

export function createMockFetchImplementation<TResponse>(
	responseBody: TResponse,
	options: { status?: number; statusText?: string; headers?: Record<string, string> } = {}
) {
	const capturedRequests: CapturedRequest[] = []

	// biome-ignore lint/suspicious/noExplicitAny: its okay
	const mockImplementation = jest.fn(async (url: string, init?: RequestInit): Promise<any> => {
		let parsedBody: Record<string, unknown> | undefined
		try {
			parsedBody = init?.body ? JSON.parse(init.body.toString()) : undefined
		} catch (e) {
			console.warn('Failed to parse request body as JSON in mock fetch:', e)
			parsedBody = undefined
		}

		const request: CapturedRequest = {
			url,
			method: init?.method || 'GET',
			headers: (init?.headers || {}) as Record<string, string>,
			rawBody: init?.body,
			body: parsedBody,
			// @ts-expect-error
			searchParams: init?.searchParams
		}
		capturedRequests.push(request)

		const { status = 200, statusText = 'OK', headers = { 'Content-Type': 'application/json' } } = options

		return {
			ok: status >= 200 && status < 300,
			status,
			statusText,
			headers: new Headers(headers),
			json: async () => responseBody,
			text: async () => JSON.stringify(responseBody),
			blob: async () =>
				new Blob([JSON.stringify(responseBody)], { type: headers['Content-Type'] || 'application/json' }),
			arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(responseBody)).buffer
		}
	})

	return {
		mockImplementation,
		getCapturedRequests: () => capturedRequests,
		getLastRequest: (): CapturedRequest | null =>
			capturedRequests.length > 0 ? capturedRequests[capturedRequests.length - 1] : null,
		clearCapturedRequests: () => {
			capturedRequests.length = 0
		}
	}
}

export const testFactory = new TestFactory()
