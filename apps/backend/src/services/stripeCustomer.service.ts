import type { User } from '@backend/libs/generated/prisma'
import { db } from '@backend/libs/db'
import { stripe } from '@backend/libs/stripe'

export const StripeCustomerService = {
	async createOrGetCustomer(user: User) {
		const existingCustomer = await db.stripeCustomer.findUnique({
			where: { userId: user.id }
		})

		if (existingCustomer) {
			return existingCustomer
		}

		const stripeCustomer = await stripe.customers.create({
			email: user.email,
			name: user.name,
			metadata: {
				userId: user.id
			}
		})

		const customer = await db.stripeCustomer.create({
			data: {
				stripeCustomerId: stripeCustomer.id,
				userId: user.id
			}
		})

		return customer
	},

	async findByUserId(userId: string) {
		return db.stripeCustomer.findUnique({
			where: { userId },
			include: {
				subscriptions: true
			}
		})
	},

	async findByStripeCustomerId(stripeCustomerId: string) {
		return db.stripeCustomer.findUnique({
			where: { stripeCustomerId },
			include: {
				subscriptions: true
			}
		})
	}
}