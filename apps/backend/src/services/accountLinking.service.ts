import { db } from '@backend/libs/db'

export async function getLinkedAccounts(userId: string) {
	const accounts = await db.calendarAccount.findMany({
		where: {
			userId: userId
		},
		select: {
			id: true,
			googleId: true,
			email: true,
			name: true,
			expiresAt: true,
			createdAt: true
		},
		orderBy: {
			createdAt: 'asc'
		}
	})

	return accounts.map((account) => ({
		...account,
		isExpired: account.expiresAt ? new Date() > account.expiresAt : false
	}))
}

export async function unlinkGoogleAccount(accountId: string, userId: string) {
	const account = await db.calendarAccount.findFirst({
		where: {
			id: accountId,
			userId: userId
		}
	})

	if (!account) {
		throw new Error('Account not found')
	}

	await db.$transaction(async (tx) => {
		await tx.calendarEvent.deleteMany({
			where: {
				googleAccountId: accountId
			}
		})

		await tx.calendarAccount.delete({
			where: {
				id: accountId
			}
		})

		await tx.account.deleteMany({
			where: {
				accountId: account.googleId,
				userId: userId,
				providerId: 'google'
			}
		})
	})

	return { success: true }
}
