import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { authClient } from '@web/libs/auth'
import { AlertCircle, Facebook, Linkedin, Plus, Settings, Trash2, Users } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/app/setup/social-media-accounts')({
	component: RouteComponent
})

const socialPlatforms = [
	{
		id: 'linkedin',
		name: 'LinkedIn',
		icon: Linkedin,
		color: 'bg-blue-600',
		description: 'Connect your LinkedIn profile'
	},
	{
		id: 'facebook',
		name: 'Facebook',
		icon: Facebook,
		color: 'bg-blue-700',
		description: 'Connect your Facebook account'
	}
]

function RouteComponent() {
	const [isLoading, setIsLoading] = useState(false)
	const [accounts] = useState<Array<{
		id: string
		platform: string
		username: string
		displayName: string
		isExpired: boolean
	}>>([])

	async function handleConnectPlatform(platform: string) {
		try {
			setIsLoading(true)

			await authClient.linkSocial({
				provider: platform as 'linkedin' | 'facebook',
				callbackURL: `${window.location.origin}/app/setup/social-media-accounts`
			})
		} catch (error) {
			console.error(`Failed to connect ${platform}:`, error)
		} finally {
			setIsLoading(false)
		}
	}

	async function handleRemoveAccount(accountId: string) {
		try {
			setIsLoading(true)
			console.log('Remove account:', accountId)
		} catch (error) {
			console.error('Failed to remove account:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="bg-primary/10 p-2 rounded-lg">
						<Settings className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Social Media Accounts</h1>
						<p className="text-muted-foreground">Connect your social media profiles for enhanced features</p>
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
						<CardDescription>Social media accounts linked to your profile</CardDescription>
					</CardHeader>
					<CardContent>
						{accounts.length === 0 ? (
							<div className="text-center py-8">
								<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">No social media accounts connected</h3>
								<p className="text-muted-foreground mb-6">
									Connect your social media accounts to unlock additional features and integrations.
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{accounts.map((account) => (
									<div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-4">
											<div
												className={`h-10 w-10 rounded-lg flex items-center justify-center text-white ${
													socialPlatforms.find((p) => p.id === account.platform)?.color || 'bg-gray-500'
												}`}
											>
												{(() => {
													const platform = socialPlatforms.find((p) => p.id === account.platform)
													const Icon = platform?.icon || Users
													return <Icon className="h-5 w-5" />
												})()}
											</div>
											<div className="flex-1">
												<div className="font-medium">{account.displayName || account.username}</div>
												<div className="text-sm text-muted-foreground">
													@{account.username} • {account.platform}
												</div>
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
							</div>
						)}

						<div className="mt-6 space-y-3">
							<h4 className="text-sm font-medium text-muted-foreground">Connect New Account</h4>
							<div className="grid gap-3 sm:grid-cols-2">
								{socialPlatforms.map((platform) => {
									const Icon = platform.icon
									const isConnected = accounts.some((account) => account.platform === platform.id)
									
									return (
										<Button
											key={platform.id}
											variant="outline"
											className="justify-start h-auto p-4"
											onClick={() => handleConnectPlatform(platform.id)}
											disabled={isLoading || isConnected}
										>
											<div className="flex items-center gap-3">
												<div className={`h-8 w-8 rounded ${platform.color} flex items-center justify-center`}>
													<Icon className="h-4 w-4 text-white" />
												</div>
												<div className="text-left">
													<div className="font-medium">{platform.name}</div>
													<div className="text-xs text-muted-foreground">{platform.description}</div>
												</div>
												{!isConnected && <Plus className="h-4 w-4 ml-auto" />}
											</div>
										</Button>
									)
								})}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Integration Information</CardTitle>
						<CardDescription>How your social media accounts are used</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-blue-900 mb-1">LinkedIn Integration</p>
									<p className="text-blue-700">
										Connect LinkedIn to enhance meeting insights and professional networking features.
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-purple-900 mb-1">Facebook Integration</p>
									<p className="text-purple-700">
										Connect Facebook for additional meeting context and social features.
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-amber-900 mb-1">Privacy & Security</p>
									<p className="text-amber-700">
										We only access basic profile information and never post on your behalf without permission.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}