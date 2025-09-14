import { db } from '@backend/libs/db'
import type { AutomationType, ContentType, SocialPlatform } from '@backend/libs/generated/prisma'

export interface CreateAutomationData {
	name: string
	type: string
	platform: SocialPlatform
	description: string
	example?: string
}

export interface UpdateAutomationData extends CreateAutomationData {
	isActive?: boolean
}

export const automationService = {
	async getUserAutomations(userId: string) {
		return db.automation.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' }
		})
	},

	async createAutomation(userId: string, data: CreateAutomationData) {
		const contentType = data.platform === 'LINKEDIN' ? 'LINKEDIN_POST' : 'FACEBOOK_POST'

		return db.automation.create({
			data: {
				name: data.name,
				type: data.type as AutomationType,
				platform: data.platform,
				description: data.description,
				example: data.example,
				contentType: contentType as ContentType,
				userId,
				socialMediaAccountId: null,
				isActive: true
			}
		})
	},

	async updateAutomation(userId: string, automationId: string, data: UpdateAutomationData) {
		const automation = await db.automation.findFirst({
			where: { id: automationId, userId }
		})

		if (!automation) {
			throw new Error('Automation not found')
		}

		const contentType = data.platform === 'LINKEDIN' ? 'LINKEDIN_POST' : 'FACEBOOK_POST'

		return db.automation.update({
			where: { id: automationId },
			data: {
				name: data.name,
				type: data.type as AutomationType,
				platform: data.platform,
				description: data.description,
				example: data.example,
				contentType: contentType as ContentType,
				socialMediaAccountId: null,
				...(data.isActive !== undefined && { isActive: data.isActive })
			}
		})
	},

	async getAutomation(userId: string, automationId: string) {
		const automation = await db.automation.findFirst({
			where: { id: automationId, userId, isActive: true }
		})

		if (!automation) {
			throw new Error('Automation not found')
		}

		return automation
	},

	async deleteAutomation(userId: string, automationId: string) {
		const automation = await db.automation.findFirst({
			where: { id: automationId, userId }
		})

		if (!automation) {
			throw new Error('Automation not found')
		}

		await db.automation.delete({
			where: { id: automationId }
		})
	}
}
