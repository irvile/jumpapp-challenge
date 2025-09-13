import { authPlugin } from '@backend/plugins/auth'
import { unlinkGoogleAccount } from '@backend/services/accountLinking.service'
import Elysia, { status, t } from 'elysia'

export const unlinkGoogleRoute = new Elysia().use(authPlugin).delete(
	'/unlinkGoogle/:accountId',
	async ({ params, user }) => {
		try {
			await unlinkGoogleAccount(params.accountId, user.id)

			return { success: true, message: 'Google account unlinked successfully' }
		} catch (error) {
			if (error instanceof Error && error.message === 'Account not found') {
				return status(404, 'Account not found')
			}

			return status(500, 'Failed to unlink account')
		}
	},
	{
		auth: true,
		params: t.Object({
			accountId: t.String()
		})
	}
)
