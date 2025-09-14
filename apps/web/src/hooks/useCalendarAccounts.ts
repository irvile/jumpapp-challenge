import { useCalendarAccounts as useCalendarAccountsQuery } from '@web/features/calendar-accounts/queries/use-calendar-accounts'
import { useLinkAccount } from '@web/features/calendar-accounts/queries/use-link-account'
import { useUnlinkAccount } from '@web/features/calendar-accounts/queries/use-unlink-account'

interface CalendarAccount {
	id: string
	googleId: string
	email: string
	name: string
	expiresAt: Date | null
	createdAt: Date
	isExpired: boolean
}

interface UseCalendarAccountsReturn {
	accounts: CalendarAccount[]
	loading: boolean
	error: string | null
	refetch: () => void
	linkAccount: {
		mutate: () => void
		isLoading: boolean
		error: string | null
	}
	unlinkAccount: {
		mutate: (accountId: string) => void
		isLoading: boolean
		error: string | null
	}
}

export function useCalendarAccounts(): UseCalendarAccountsReturn {
	const accountsQuery = useCalendarAccountsQuery()
	const linkAccountMutation = useLinkAccount()
	const unlinkAccountMutation = useUnlinkAccount()

	return {
		accounts: accountsQuery.data || [],
		loading: accountsQuery.isLoading,
		error: accountsQuery.error?.message || null,
		refetch: accountsQuery.refetch,
		linkAccount: {
			mutate: () => linkAccountMutation.mutate(),
			isLoading: linkAccountMutation.isPending,
			error: linkAccountMutation.error?.message || null
		},
		unlinkAccount: {
			mutate: (accountId: string) => unlinkAccountMutation.mutate(accountId),
			isLoading: unlinkAccountMutation.isPending,
			error: unlinkAccountMutation.error?.message || null
		}
	}
}
