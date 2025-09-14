import { createFileRoute } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@web/components/ui/dialog'
import { useCalendarAccounts } from '@web/features/calendar-accounts/queries/use-calendar-accounts'
import { authClient } from '@web/libs/auth'
import { backend } from '@web/services/backend-api'
import { AlertCircle, Plus, ShieldUserIcon, Trash2, Users } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/app/setup/google-accounts')({
	component: RouteComponent
})

function RouteComponent() {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const { data: accounts = [], refetch } = useCalendarAccounts()

	async function handleAddAccount() {
		try {
			setIsLoading(true)

			await authClient.linkSocial({
				provider: 'google',
				scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
				callbackURL: `${window.location.origin}/app/setup/google-accounts`
			})

			await refetch()
		} catch (error) {
			console.error('Failed to initiate Google linking:', error)
		} finally {
			setIsLoading(false)
		}
	}

	async function handleRemoveAccount(accountId: string) {
		try {
			setIsLoading(true)
			const response = await backend.api.v1.auth.unlinkGoogle({ accountId }).delete()

			if (response.data?.success) {
				await refetch()
			}
		} catch (error) {
			console.error('Failed to unlink Google account:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="bg-primary/10 p-2 rounded-lg">
						<ShieldUserIcon className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Google Accounts</h1>
						<p className="text-muted-foreground">Manage your connected Google Calendar accounts</p>
					</div>
				</div>
			</div>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Connected Accounts
						</CardTitle>
						<CardDescription>Google accounts linked to your profile for calendar access</CardDescription>
					</CardHeader>
					<CardContent>
						{accounts.length === 0 ? (
							<div className="text-center py-8">
								<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">No Google accounts connected</h3>
								<p className="text-muted-foreground mb-6">
									Connect your Google account to access your calendar events and meetings.
								</p>
								<Button onClick={handleAddAccount} disabled={isLoading}>
									<Plus className="h-4 w-4 mr-2" />
									{isLoading ? 'Connecting...' : 'Connect Google Account'}
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{accounts.map((account) => (
									<div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-4">
											<Avatar className="h-10 w-10">
												<AvatarImage src={account.name} alt={account.email} />
												<AvatarFallback>{account.email.charAt(0).toUpperCase()}</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="font-medium">{account.name || account.email}</div>
												<div className="text-sm text-muted-foreground">{account.email}</div>
											</div>
											{account.isExpired && (
												<Badge variant="destructive" className="ml-2">
													Expired
												</Badge>
											)}
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveAccount(account.id)}
											disabled={isLoading}
											className="text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
								<div className="pt-4 border-t">
									<Button onClick={handleAddAccount} disabled={isLoading} variant="outline" className="w-full">
										<Plus className="h-4 w-4 mr-2" />
										{isLoading ? 'Connecting...' : 'Add Another Google Account'}
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Account Information</CardTitle>
						<CardDescription>Important details about your Google account connections</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-blue-900 mb-1">Calendar Access</p>
									<p className="text-blue-700">
										Connected accounts allow us to read your calendar events to show meetings and enable bot
										functionality.
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-amber-900 mb-1">Token Expiration</p>
									<p className="text-amber-700">
										If an account shows as "Expired", you'll need to reconnect it to continue accessing that calendar's
										events.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Account Removal</DialogTitle>
						<DialogDescription>
							This will remove the Google account and delete all associated calendar events from your profile. This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	)
}
