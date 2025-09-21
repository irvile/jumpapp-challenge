import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { Skeleton } from '@web/components/ui/skeleton'
import type { SubscriptionStatusResponse } from '../billing.service'
import { SubscriptionActions } from './subscription-actions'
import { SubscriptionStatus } from './subscription-status'
import { UpgradeToPro } from './upgrade-to-pro'

interface BillingContentProps {
	status: SubscriptionStatusResponse | undefined
	isLoading: boolean
}

export function BillingContent({ status, isLoading }: BillingContentProps) {
	if (isLoading) {
		return (
			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-6 flex">
					<Card className="flex-1 flex flex-col">
						<CardHeader>
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-64" />
						</CardHeader>
						<CardContent className="flex-1">
							<div className="space-y-3">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6 flex">
					<Card className="flex-1 flex flex-col">
						<CardHeader>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-48" />
						</CardHeader>
						<CardContent className="flex-1">
							<Skeleton className="h-10 w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	if (!status) {
		return null
	}

	if (!status.hasActiveSubscription) {
		return <UpgradeToPro />
	}

	return (
		<>
			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-6 flex">
					<SubscriptionStatus status={status} isLoading={isLoading} />
				</div>

				<div className="space-y-6 flex">
					<SubscriptionActions status={status} />
				</div>
			</div>

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
		</>
	)
}
