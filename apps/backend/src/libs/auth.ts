import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { bearer } from 'better-auth/plugins'
import { db } from './db'
import { envs } from './envs'

const isProduction = Bun.env.NODE_ENV === 'production'

export const auth = betterAuth({
	appName: 'backend',
	database: prismaAdapter(db, {
		provider: 'postgresql'
	}),
	trustedOrigins: isProduction ? [] : ['http://localhost:5173', 'http://192.168.15.3:5173', 'http://192.168.15.3:6173'],
	socialProviders: {
		google: {
			accessType: 'offline',
			prompt: 'select_account consent',
			clientId: envs.GOOGLE_CLIENT_ID,
			clientSecret: envs.GOOGLE_CLIENT_SECRET
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
		modelName: 'Account'
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
