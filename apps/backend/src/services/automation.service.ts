import { db } from '@backend/libs/db'
import type { AutomationType, ContentType, SocialPlatform } from '@backend/libs/generated/prisma'

export interface CreateAutomationData {
	name: string
	platform: SocialPlatform
	description: string
	example?: string
}

export interface UpdateAutomationData extends CreateAutomationData {
	isActive?: boolean
}

export interface AutomationResponse {
	id: string
	name: string
	type: AutomationType
	platform: SocialPlatform
	description: string
	example: string | null
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

export const automationService = {
	async getUserAutomations(userId: string): Promise<AutomationResponse[]> {
		return db.automation.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' }
		})
	},

	async createAutomation(userId: string, data: CreateAutomationData): Promise<AutomationResponse> {
		const socialMediaAccount = await db.socialMediaAccount.findFirst({
			where: {
				userId,
				platform: data.platform
			}
		})

		if (!socialMediaAccount) {
			throw new Error(`No ${data.platform} account connected`)
		}

		const contentType = data.platform === 'LINKEDIN' ? 'LINKEDIN_POST' : 'FACEBOOK_POST'

		return db.automation.create({
			data: {
				name: data.name,
				type: 'GENERATE_POST',
				platform: data.platform,
				description: data.description,
				example: data.example,
				contentType: contentType as ContentType,
				userId,
				socialMediaAccountId: socialMediaAccount.id,
				isActive: true
			}
		})
	},

	async updateAutomation(
		userId: string,
		automationId: string,
		data: UpdateAutomationData
	): Promise<AutomationResponse> {
		const automation = await db.automation.findFirst({
			where: { id: automationId, userId }
		})

		if (!automation) {
			throw new Error('Automation not found')
		}

		let socialMediaAccountId = automation.socialMediaAccountId

		if (data.platform !== automation.platform) {
			const socialMediaAccount = await db.socialMediaAccount.findFirst({
				where: {
					userId,
					platform: data.platform
				}
			})

			if (!socialMediaAccount) {
				throw new Error(`No ${data.platform} account connected`)
			}

			socialMediaAccountId = socialMediaAccount.id
		}

		const contentType = data.platform === 'LINKEDIN' ? 'LINKEDIN_POST' : 'FACEBOOK_POST'

		return db.automation.update({
			where: { id: automationId },
			data: {
				name: data.name,
				platform: data.platform,
				description: data.description,
				example: data.example,
				contentType: contentType as ContentType,
				socialMediaAccountId,
				...(data.isActive !== undefined && { isActive: data.isActive })
			}
		})
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
