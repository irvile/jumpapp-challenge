import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { bearer } from 'better-auth/plugins'
import { db } from './db'
import { envs } from './envs'
import { genId } from './nanoid'

async function createCalendarAccount(
	account: {
		accountId: string
		userId: string
		accessToken: string | null | undefined
		refreshToken: string | null | undefined
		accessTokenExpiresAt: Date | null | undefined
	},
	name: string,
	email: string
) {
	try {
		const existingAccount = await db.calendarAccount.findFirst({
			where: {
				googleId: account.accountId,
				userId: account.userId
			}
		})

		if (!existingAccount) {
			console.log('Creating calendar account', account)
			await db.calendarAccount.create({
				data: {
					id: genId('calendarAccount'),
					userId: account.userId,
					googleId: account.accountId,
					email: email,
					name: name,
					accessToken: account.accessToken || '',
					refreshToken: account.refreshToken,
					expiresAt: account.accessTokenExpiresAt ? new Date(account.accessTokenExpiresAt) : null
				}
			})
		}
	} catch (error) {
		console.error('Error creating calendar account:', error)
	}
}

const isProduction = Bun.env.NODE_ENV === 'production'

export const auth = betterAuth({
	appName: 'backend',
	baseURL: envs.BETTER_AUTH_URL,
	database: prismaAdapter(db, {
		provider: 'postgresql'
	}),

	trustedOrigins: isProduction
		? ['https://jumpapp-production.fly.dev', 'https://jumpapp-challenge.vercel.app']
		: ['http://localhost:5173', 'http://192.168.15.3:5173', 'http://192.168.15.3:6173'],
	advanced: {
		cookies: {
			session_token: {
				attributes: {
					sameSite: 'none',
					secure: true,
					httpOnly: true,
					maxAge: 60 * 60 * 8
				}
			}
		}
	},
	socialProviders: {
		google: {
			accessType: 'offline',
			prompt: 'select_account consent',
			clientId: envs.GOOGLE_CLIENT_ID,
			clientSecret: envs.GOOGLE_CLIENT_SECRET,
			scope: ['https://www.googleapis.com/auth/calendar.events.readonly']
		},
		linkedin: {
			clientId: envs.LINKEDIN_CLIENT_ID,
			clientSecret: envs.LINKEDIN_CLIENT_SECRET,
			scope: []
		},
		facebook: {
			clientId: envs.FACEBOOK_CLIENT_ID,
			clientSecret: envs.FACEBOOK_CLIENT_SECRET,
			scope: ['email']
		}
	},
	emailAndPassword: {
		enabled: true,
		disableSignUp: false,
		minPasswordLength: 6,
		signUpFields: ['name', 'email', 'password', 'phone'],
		sendResetPassword: async ({ user, url, token }) => {
			console.log('sendResetPassword', { user, url, token })
		},
		password: {
			hash: async (password) => {
				if (isProduction) {
					return await Bun.password.hash(password, {
						algorithm: 'argon2id',
						memoryCost: 16384,
						timeCost: 10
					})
				}

				const hash = await Bun.password.hash(password, {
					algorithm: 'argon2id',
					memoryCost: 1,
					timeCost: 1
				})

				return hash
			},
			verify: async ({ password, hash }) => {
				return await Bun.password.verify(password, hash, 'argon2id')
			}
		}
	},
	user: {
		modelName: 'User'
	},
	session: {
		modelName: 'Session',
		expiresIn: 60 * 60 * 8,
		updateAge: 60 * 60 * 4
	},
	account: {
		modelName: 'Account',
		accountLinking: {
			enabled: true,
			allowDifferentEmails: true,
			trustedProviders: ['google', 'linkedin', 'facebook', 'microsoft']
		}
	},
	databaseHooks: {
		account: {
			create: {
				after: async (account, ctx) => {
					const user = await db.user.findUnique({
						where: {
							id: account.userId
						}
					})

					let googleEmail = user?.email || 'unknown@gmail.com'
					let googleName = user?.name || 'Unknown'

					if (account.providerId === 'google') {
						try {
							const googleAccountInfo = await auth.api.accountInfo({
								body: {
									accountId: account.accountId
								},
								headers: ctx?.headers
							})

							googleEmail = googleAccountInfo?.data.email || 'unknown@gmail.com'
							googleName = googleAccountInfo?.data.name || googleAccountInfo?.data.displayName || 'Unknown'
						} catch (error) {
							console.error('Error getting google account info', error)
						}

						await createCalendarAccount(
							{
								accountId: account.accountId,
								userId: account.userId,
								accessToken: account.accessToken,
								refreshToken: account.refreshToken,
								accessTokenExpiresAt: account.accessTokenExpiresAt
							},
							googleName,
							googleEmail
						)
					}
				}
			}
		}
	},
	plugins: [bearer()]
})

export type AuthInstanceOptions = typeof auth

async function justForInferSession() {
	const session = await auth.api.getSession({ headers: {} as Headers })
	return session
}

export type AuthSession = NonNullable<Awaited<ReturnType<typeof justForInferSession>>>
export type AuthUserLogged = AuthSession['user']
export async function signUp(name: string, email: string, password: string) {
	const response = await auth.api.signUpEmail({
		body: {
			name,
			email,
			password
		}
	})

	return response
}

export async function signIn(email: string, password: string) {
	const response = await auth.api.signInEmail({
		body: {
			email,
			password
		},
		asResponse: true
	})

	return response
}

export async function forgotPassword(email: string) {
	const response = await auth.api.forgetPassword({
		body: {
			email
		}
	})

	return response
}

export async function resetPassword(token: string, password: string) {
	const response = await auth.api.resetPassword({
		body: {
			token,
			newPassword: password
		}
	})

	return response
}
