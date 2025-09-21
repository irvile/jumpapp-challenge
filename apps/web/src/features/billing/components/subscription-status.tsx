import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { Badge } from '@web/components/ui/badge'
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { SubscriptionStatusResponse } from '../billing.service'

interface SubscriptionStatusProps {
	status: SubscriptionStatusResponse
	isLoading?: boolean
}

export function SubscriptionStatus({ status, isLoading }: SubscriptionStatusProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-lg">Subscription Status</CardTitle>
							<CardDescription>Loading subscription information...</CardDescription>
						</div>
						<div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="h-4 bg-gray-200 rounded animate-pulse" />
						<div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
					</div>
				</CardContent>
			</Card>
		)
	}

	const getStatusConfig = () => {
		if (!status.hasActiveSubscription) {
			return {
				badge: <Badge variant="secondary">No Subscription</Badge>,
				icon: <XCircle className="h-5 w-5 text-gray-500" />,
				title: 'No Active Subscription',
				description: 'You currently do not have an active subscription.'
			}
		}

		switch (status.status) {
			case 'active':
				return {
					badge: <Badge variant="default" className="bg-green-500">Active</Badge>,
					icon: <CheckCircle className="h-5 w-5 text-green-500" />,
					title: 'Subscription Active',
					description: 'Your subscription is active and in good standing.'
				}
			case 'canceled':
				return {
					badge: <Badge variant="destructive">Canceled</Badge>,
					icon: <XCircle className="h-5 w-5 text-red-500" />,
					title: 'Subscription Canceled',
					description: status.cancelAtPeriodEnd 
						? 'Your subscription will end at the current period.'
						: 'Your subscription has been canceled.'
				}
			case 'past_due':
				return {
					badge: <Badge variant="destructive">Past Due</Badge>,
					icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
					title: 'Payment Past Due',
					description: 'Please update your payment method to continue your subscription.'
				}
			case 'trialing':
				return {
					badge: <Badge variant="default" className="bg-blue-500">Trial</Badge>,
					icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
					title: 'Trial Period',
					description: 'You are currently in your trial period.'
				}
			case 'unpaid':
				return {
					badge: <Badge variant="destructive">Unpaid</Badge>,
					icon: <AlertCircle className="h-5 w-5 text-red-500" />,
					title: 'Subscription Unpaid',
					description: 'Please pay the latest invoice to reactivate your subscription.'
				}
			case 'incomplete':
				return {
					badge: <Badge variant="secondary">Incomplete</Badge>,
					icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
					title: 'Payment Required',
					description: 'Please complete your payment to activate your subscription.'
				}
			case 'incomplete_expired':
				return {
					badge: <Badge variant="destructive">Expired</Badge>,
					icon: <XCircle className="h-5 w-5 text-red-500" />,
					title: 'Payment Expired',
					description: 'The payment window has expired. Please create a new subscription.'
				}
			case 'paused':
				return {
					badge: <Badge variant="secondary">Paused</Badge>,
					icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
					title: 'Subscription Paused',
					description: 'Your trial ended without a payment method. Please add a payment method.'
				}
			default:
				return {
					badge: <Badge variant="secondary">Unknown</Badge>,
					icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
					title: 'Unknown Status',
					description: 'Unable to determine subscription status.'
				}
		}
	}

	const { badge, icon, title, description } = getStatusConfig()

	return (
		<Card className="flex-1 flex flex-col">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{icon}
						<div>
							<CardTitle className="text-lg">{title}</CardTitle>
							<CardDescription>{description}</CardDescription>
						</div>
					</div>
					{badge}
				</div>
			</CardHeader>
			<CardContent className="flex-1">
				{status.currentPeriodEnd && status.hasActiveSubscription ? (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Calendar className="h-4 w-4" />
						<span>
							{status.cancelAtPeriodEnd ? 'Ends on' : 'Next billing'}: {' '}
							{new Date(status.currentPeriodEnd).toLocaleDateString()}
						</span>
					</div>
				) : (
					<div className="h-6" />
				)}
			</CardContent>
		</Card>
	)
}