import { Button } from '@web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { CreditCard, ExternalLink, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { SubscriptionStatusResponse } from '../billing.service'
import { useCreateCheckout, useCustomerPortal } from '../hooks/use-billing'

interface SubscriptionActionsProps {
	status: SubscriptionStatusResponse
}

export function SubscriptionActions({ status }: SubscriptionActionsProps) {
	const createCheckout = useCreateCheckout()
	const customerPortal = useCustomerPortal()

	const handleSubscribe = async (planType: 'monthly' | 'yearly' = 'monthly') => {
		try {
			const result = await createCheckout.mutateAsync({
				planType,
				successUrl: `${window.location.origin}/app/account/billing?success=true`,
				cancelUrl: `${window.location.origin}/app/account/billing?canceled=true`
			})

			if (result.url) {
				window.location.href = result.url
			}
		} catch {
			toast.error('Failed to create checkout session. Please try again.')
		}
	}

	const handleManageBilling = async () => {
		try {
			const result = await customerPortal.mutateAsync({
				returnUrl: `${window.location.origin}/app/account/billing`
			})

			if (result.url) {
				window.location.href = result.url
			}
		} catch {
			toast.error('Failed to open billing portal. Please try again.')
		}
	}

	if (!status.hasActiveSubscription) {
		return (
			<Card className="flex-1 flex flex-col">
				<CardHeader>
					<CardTitle className="text-lg">Get Started</CardTitle>
					<CardDescription>Subscribe to unlock all features and continue using our platform.</CardDescription>
				</CardHeader>
				<CardContent className="flex-1">
					<Button
						onClick={() => handleSubscribe('monthly')}
						disabled={createCheckout.isPending}
						size="lg"
						className="w-full"
					>
						<CreditCard className="mr-2 h-4 w-4" />
						{createCheckout.isPending ? 'Creating checkout...' : 'Subscribe Now'}
						<ExternalLink className="ml-2 h-4 w-4" />
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="flex-1 flex flex-col">
			<CardHeader>
				<CardTitle className="text-lg">Manage Subscription</CardTitle>
				<CardDescription>Update payment methods, download invoices, or change your plan.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 flex-1">
				<Button
					onClick={handleManageBilling}
					disabled={customerPortal.isPending}
					variant="outline"
					size="lg"
					className="w-full"
				>
					<Settings className="mr-2 h-4 w-4" />
					{customerPortal.isPending ? 'Opening portal...' : 'Manage Billing'}
					<ExternalLink className="ml-2 h-4 w-4" />
				</Button>

				{status.status === 'canceled' && (
					<Button
						onClick={() => handleSubscribe('monthly')}
						disabled={createCheckout.isPending}
						size="lg"
						className="w-full"
					>
						<CreditCard className="mr-2 h-4 w-4" />
						{createCheckout.isPending ? 'Creating checkout...' : 'Reactivate Subscription'}
						<ExternalLink className="ml-2 h-4 w-4" />
					</Button>
				)}
			</CardContent>
		</Card>
	)
}
