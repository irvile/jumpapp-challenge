import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { Skeleton } from '@web/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { SubscriptionActions } from './components/subscription-actions'
import { SubscriptionStatus } from './components/subscription-status'
import { useBillingStatus } from './hooks/use-billing'

export function BillingPage() {
	const { data: status, isLoading, error } = useBillingStatus()

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search)
		const success = urlParams.get('success')
		const canceled = urlParams.get('canceled')

		if (success === 'true') {
			toast.success('Subscription activated successfully!')
			window.history.replaceState({}, '', '/app/account/billing')
		} else if (canceled === 'true') {
			toast.info('Checkout was canceled. You can try again anytime.')
			window.history.replaceState({}, '', '/app/account/billing')
		}
	}, [])

	if (error) {
		return (
			<div className="container mx-auto p-6 max-w-4xl">
				<div className="mb-6">
					<h1 className="text-3xl font-bold">Billing & Subscription</h1>
					<p className="text-muted-foreground">Manage your subscription and billing information</p>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-red-500" />
							<CardTitle className="text-lg">Error Loading Billing Information</CardTitle>
						</div>
						<CardDescription>Unable to load your subscription status. Please try again later.</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">If this issue persists, please contact our support team.</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Billing & Subscription</h1>
				<p className="text-muted-foreground">Manage your subscription and billing information</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-6">
					{isLoading ? (
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-4 w-64" />
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
								</div>
							</CardContent>
						</Card>
					) : (
						status && <SubscriptionStatus status={status} isLoading={isLoading} />
					)}
				</div>

				<div className="space-y-6">
					{isLoading ? (
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-4 w-48" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-full" />
							</CardContent>
						</Card>
					) : (
						status && <SubscriptionActions status={status} />
					)}
				</div>
			</div>

			{!isLoading && status && (
				<div className="mt-8">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Need Help?</CardTitle>
							<CardDescription>
								If you have any questions about your subscription or billing, please don't hesitate to reach out.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Contact our support team for assistance with your account or subscription changes.
							</p>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
