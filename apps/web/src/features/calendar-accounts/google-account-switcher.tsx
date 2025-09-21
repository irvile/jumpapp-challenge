import { useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@web/components/ui/dropdown-menu'
import { ChevronDown, Mail, Plus } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'
import { useCalendarAccounts } from './queries/use-calendar-accounts'

interface GoogleAccountSwitcherProps extends ComponentPropsWithoutRef<'div'> {
	selectedAccountId?: string
	onAccountChange?: (accountId: string) => void
}

export function GoogleAccountSwitcher({
	selectedAccountId,
	onAccountChange,
	className,
	...props
}: GoogleAccountSwitcherProps) {
	const { data: accounts = [] } = useCalendarAccounts()
	const navigate = useNavigate()

	const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0]

	function handleLinkNewAccount() {
		navigate({ to: '/app/setup/google-accounts' })
	}

	if (!selectedAccount) {
		return (
			<div className={className} {...props}>
				<Button variant="outline" className="h-8 gap-2 px-3" onClick={handleLinkNewAccount}>
					<Mail className="h-4 w-4" />
					<span>Connect Google Account</span>
				</Button>
			</div>
		)
	}

	console.log('switcher accounts', accounts)

	return (
		<div className={className} {...props}>
			<div className="flex items-center">
				<Button variant="ghost" className="h-8 gap-2 px-2 flex-1">
					<Avatar className="h-5 w-5">
						<AvatarImage src={selectedAccount.name} alt={selectedAccount.email} />
						<AvatarFallback>{selectedAccount.email.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col items-start">
						<span className="font-medium text-sm">{selectedAccount.name || selectedAccount.email}</span>
						<span className="text-xs text-muted-foreground">{selectedAccount.email}</span>
					</div>
					{selectedAccount.isExpired && (
						<Badge variant="destructive" className="text-xs">
							Expired
						</Badge>
					)}
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 gap-2 px-2">
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[280px]">
						<DropdownMenuLabel className="text-xs text-muted-foreground">Google Accounts</DropdownMenuLabel>

						{accounts
							.sort((a, b) => a.email.localeCompare(b.email))
							.map((account) => (
								<DropdownMenuItem key={account.id} className="gap-2 p-3" onClick={() => onAccountChange?.(account.id)}>
									<Avatar className="h-6 w-6">
										<AvatarImage src={account.name} alt={account.email} />
										<AvatarFallback>{account.email.charAt(0).toUpperCase()}</AvatarFallback>
									</Avatar>
									<div className="flex flex-col flex-1">
										<span className="font-medium text-sm">{account.name || account.email}</span>
										<span className="text-xs text-muted-foreground">{account.email}</span>
									</div>
									{account.isExpired && (
										<Badge variant="destructive" className="text-xs">
											Expired
										</Badge>
									)}
									{account.id === selectedAccountId && (
										<Badge variant="secondary" className="text-xs">
											Active
										</Badge>
									)}
								</DropdownMenuItem>
							))}

						<DropdownMenuSeparator />

						<DropdownMenuItem onClick={handleLinkNewAccount} className="gap-2 p-3">
							<div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
								<Plus className="h-3 w-3" />
							</div>
							<span className="text-muted-foreground">Add Google Account</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}
