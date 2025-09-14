import { db } from '@backend/libs/db'
import { genId } from '@backend/libs/nanoid'

export class UserSettingsService {
	async getUserSettings(userId: string) {
		let settings = await db.userSettings.findUnique({
			where: { userId }
		})

		if (!settings) {
			settings = await db.userSettings.create({
				data: {
					id: genId('userSettings'),
					userId,
					joinMinutesBefore: 5,
					botName: 'MeetPost AI'
				}
			})
		}

		return settings
	}

	async updateUserSettings(userId: string, updates: { joinMinutesBefore?: number; botName?: string }) {
		const existingSettings = await this.getUserSettings(userId)

		return await db.userSettings.update({
			where: { id: existingSettings.id },
			data: {
				...updates,
				updatedAt: new Date()
			}
		})
	}
}

export const userSettingsService = new UserSettingsService()
