import { authPlugin } from '@backend/plugins/auth'
import { getLinkedAccounts } from '@backend/services/accountLinking.service'
import Elysia from 'elysia'

export const linkedAccountsRoute = new Elysia().use(authPlugin).get(
	'/linkedAccounts',
	async ({ user }) => {
		const accounts = await getLinkedAccounts(user.id)
		return { accounts }
	},
	{
		auth: true
	}
)
