import { createContext, type ReactNode, useCallback, useContext } from 'react'
import { type AuthSession, useSession } from '../libs/auth'

export interface AuthContextType {
	session: AuthSession | null
	isLoading: boolean
	isAuthenticated(): boolean
	getUserId(): string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, isPending } = useSession()

	const isAuthenticated = useCallback(() => session !== null, [session])
	const getUserId = useCallback(() => session?.user?.id ?? null, [session])

	const value = {
		session,
		isLoading: isPending,
		isAuthenticated,
		getUserId
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)

	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}

	return context
}
