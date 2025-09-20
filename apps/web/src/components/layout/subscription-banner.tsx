import { Link } from '@tanstack/react-router'
import { Button } from '@web/components/ui/button'
import { useBillingStatus } from '@web/features/billing/hooks/use-billing'
import { ArrowRight, Crown, X } from 'lucide-react'
import { useState } from 'react'

export function SubscriptionBanner() {
	const [isDismissed, setIsDismissed] = useState(false)
	const { data: status, isLoading } = useBillingStatus()

	const hasActiveSubscription = status?.hasActiveSubscription ?? false

	if (isLoading || hasActiveSubscription || isDismissed) {
		return null
	}

	return (
		<div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 relative">
			<div className="flex items-center justify-between max-w-7xl mx-auto">
				<div className="flex items-center gap-3">
					<Crown className="h-5 w-5 text-yellow-300" />
					<div className="flex items-center gap-2">
						<span className="font-medium">Unlock Premium Features</span>
						<span className="text-blue-100">•</span>
						<span className="text-sm text-blue-100">Subscribe to access AI meeting bots and advanced features</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Button asChild variant="secondary" size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
						<Link to="/app/account/billing">
							Upgrade Now
							<ArrowRight className="h-4 w-4 ml-1" />
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsDismissed(true)}
						className="text-white hover:bg-white/10 p-1"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
