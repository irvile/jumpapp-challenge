import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { BillingContent } from './components/billing-content'
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

			<BillingContent status={status} isLoading={isLoading} />
		</div>
	)
}
