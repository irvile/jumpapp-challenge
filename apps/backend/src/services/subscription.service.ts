import type { SubscriptionStatus } from '../libs/generated/prisma'
import { db } from '../libs/db'
import type { SubscriptionStatusResponse } from '../libs/stripe/types'

export const SubscriptionService = {
	async getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse> {
		const customer = await db.stripeCustomer.findUnique({
			where: { userId },
			include: {
				subscriptions: {
					where: {
						status: {
							in: ['ACTIVE', 'TRIALING']
						}
					},
					orderBy: {
						createdAt: 'desc'
					},
					take: 1
				}
			}
		})

		if (!customer || customer.subscriptions.length === 0) {
			return {
				hasActiveSubscription: false,
				status: null,
				currentPeriodEnd: null,
				cancelAtPeriodEnd: false
			}
		}

		const subscription = customer.subscriptions[0]

		return {
			hasActiveSubscription: true,
			status: subscription.status,
			currentPeriodEnd: subscription.currentPeriodEnd,
			cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
		}
	},

	async createOrUpdateSubscription(data: {
		stripeSubscriptionId: string
		stripeCustomerId: string
		status: SubscriptionStatus
		currentPeriodStart: Date
		currentPeriodEnd: Date
		cancelAtPeriodEnd?: boolean
		canceledAt?: Date | null
		priceId: string
		productId: string
		metadata?: Record<string, unknown>
	}) {
		const customer = await db.stripeCustomer.findUnique({
			where: { stripeCustomerId: data.stripeCustomerId }
		})

		if (!customer) {
			throw new Error('Customer not found')
		}

		return db.subscription.upsert({
			where: {
				stripeSubscriptionId: data.stripeSubscriptionId
			},
			create: {
				stripeSubscriptionId: data.stripeSubscriptionId,
				stripeCustomerId: customer.id,
				status: data.status,
				currentPeriodStart: data.currentPeriodStart,
				currentPeriodEnd: data.currentPeriodEnd,
				cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
				canceledAt: data.canceledAt,
				priceId: data.priceId,
				productId: data.productId,
				metadata: data.metadata as any
			},
			update: {
				status: data.status,
				currentPeriodStart: data.currentPeriodStart,
				currentPeriodEnd: data.currentPeriodEnd,
				cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
				canceledAt: data.canceledAt,
				priceId: data.priceId,
				productId: data.productId,
				metadata: data.metadata as any
			}
		})
	},

	async deleteSubscription(stripeSubscriptionId: string) {
		return db.subscription.delete({
			where: { stripeSubscriptionId }
		})
	}
}