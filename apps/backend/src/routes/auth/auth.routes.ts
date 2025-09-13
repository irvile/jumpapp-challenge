import Elysia from 'elysia'
import { linkedAccountsRoute } from './linkedAccounts.route'
import { unlinkGoogleRoute } from './unlinkGoogle.route'

export const authRoutes = new Elysia({ prefix: '/v1/auth' }).use(linkedAccountsRoute).use(unlinkGoogleRoute)
