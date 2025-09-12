import type { auth } from '@backend/libs/auth'
import { customSessionClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { envs } from './envs'

export const authClient = createAuthClient({
	baseURL: envs.VITE_PUBLIC_BACKEND_API_URL,
	plugins: [customSessionClient<typeof auth>()]
})

export const useSession = authClient.useSession
export const signIn = authClient.signIn
export const signOut = authClient.signOut
export const signUp = authClient.signUp

async function justForInferSession() {
	const session = await authClient.getSession()
	if (session.error) {
		return null
	}

	return session.data
}

export type AuthSession = NonNullable<Awaited<ReturnType<typeof justForInferSession>>>

export async function forgotPassword(email: string) {
	const { data, error } = await authClient.forgetPassword({
		email,
		redirectTo: '/reset-password'
	})

	if (error) {
		throw new Error(error.message)
	}

	return data
}

export async function resetPassword(token: string, newPassword: string) {
	const { data, error } = await authClient.resetPassword({
		newPassword,
		token
	})

	if (error) {
		throw new Error(error.message)
	}

	return data
}

export async function updatePassword(currentPassword: string, newPassword: string) {
	const { data, error } = await authClient.changePassword({
		currentPassword,
		newPassword,
		revokeOtherSessions: true
	})

	if (error) {
		if (error.code === 'INVALID_PASSWORD') {
			return { error: { currentPassword: 'Senha incorreta' } }
		}

		if (error.code === 'PASSWORD_TOO_SHORT') {
			return { error: { newPassword: 'Senha muito curta' } }
		}

		return { error: { currentPassword: 'Erro ao atualizar senha' } }
	}

	return { data, error: null }
}
