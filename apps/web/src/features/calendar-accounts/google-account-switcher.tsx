import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@web/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@web/components/ui/dropdown-menu'
import { backend } from '@web/services/backend-api'
import { ChevronDown, Mail, Plus, Trash2 } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'
import { useState } from 'react'
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
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const { data: accounts = [], refetch } = useCalendarAccounts()

	const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0]

	async function handleLinkNewAccount() {
		try {
			setIsLoading(true)
			// const response = await backend.api.v1.auth.linkGoogle.post()

			// if (response.data?.url) {
			// 	window.location.href = response.data.url
			// }
		} catch (error) {
			console.error('Failed to initiate Google linking:', error)
		} finally {
			setIsLoading(false)
			setIsDialogOpen(false)
		}
	}

	async function handleUnlinkAccount(accountId: string) {
		try {
			setIsLoading(true)
			const response = await backend.api.v1.auth.unlinkGoogle({ accountId }).delete()

			if (response.data?.success) {
				await refetch()

				if (selectedAccountId === accountId && accounts.length > 1) {
					const remainingAccount = accounts.find((acc) => acc.id !== accountId)
					if (remainingAccount && onAccountChange) {
						onAccountChange(remainingAccount.id)
					}
				}
			}
		} catch (error) {
			console.error('Failed to unlink Google account:', error)
		} finally {
			setIsLoading(false)
		}
	}

	if (!selectedAccount) {
		return (
			<div className={className} {...props}>
				<Button variant="outline" className="h-8 gap-2 px-3" onClick={() => setIsDialogOpen(true)}>
					<Mail className="h-4 w-4" />
					<span>Connect Google Account</span>
				</Button>

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Connect Google Account</DialogTitle>
							<DialogDescription>
								Link your Google account to access your calendar events and meetings.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<Button onClick={handleLinkNewAccount} disabled={isLoading} className="w-full">
								<Plus className="h-4 w-4 mr-2" />
								{isLoading ? 'Connecting...' : 'Connect Google Account'}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
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

						<DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="gap-2 p-3">
							<div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
								<Plus className="h-3 w-3" />
							</div>
							<span className="text-muted-foreground">Add Google Account</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Manage Google Accounts</DialogTitle>
						<DialogDescription>
							Add new Google accounts or remove existing ones from your connected accounts.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<div className="space-y-2">
							<h4 className="text-sm font-medium">Connected Accounts</h4>
							{accounts.map((account) => (
								<div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
									<div className="flex items-center gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src={account.name} alt={account.email} />
											<AvatarFallback>{account.email.charAt(0).toUpperCase()}</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span className="font-medium text-sm">{account.name || account.email}</span>
											<span className="text-xs text-muted-foreground">{account.email}</span>
										</div>
										{account.isExpired && (
											<Badge variant="destructive" className="text-xs">
												Expired
											</Badge>
										)}
									</div>

									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleUnlinkAccount(account.id)}
										disabled={isLoading || accounts.length === 1}
										className="text-destructive hover:text-destructive"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>

						<Button onClick={handleLinkNewAccount} disabled={isLoading} className="w-full">
							<Plus className="h-4 w-4 mr-2" />
							{isLoading ? 'Connecting...' : 'Add New Google Account'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
