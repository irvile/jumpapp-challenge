import { Link } from '@tanstack/react-router'
import { Button } from '@web/components/ui/button'
import { useBillingStatus } from '@web/features/billing/hooks/use-billing'
import { Crown } from 'lucide-react'

export function SubscriptionBanner() {
	const { data: status, isLoading } = useBillingStatus()

	const hasActiveSubscription = status?.hasActiveSubscription ?? false

	if (isLoading || hasActiveSubscription) {
		return null
	}

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-6 pb-5">
			<div className="pointer-events-auto flex items-center justify-between gap-x-6 bg-white dark:bg-black border border-border-subtle rounded-xl px-6 py-2.5 shadow-lg">
				<div className="flex items-center gap-3">
					<Crown className="h-5 w-5 text-violet-600" />
					<div className="flex items-center gap-2">
						<span className="font-medium text-content-emphasis">Unlock Pro Features</span>
						<span className="text-content-subtle">•</span>
						<span className="text-sm text-content-subtle">
							Subscribe to access AI meeting bots and advanced features
						</span>
					</div>
				</div>
				<Button
					asChild
					variant="outline"
					size="sm"
					className="ml-6 transition-all border-border-subtle bg-white dark:bg-black hover:bg-bg-muted focus-visible:border-border-emphasis outline-none h-8 rounded-md border px-4"
				>
					<Link to="/app/account/billing">
						<span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
							Upgrade to Pro
						</span>
					</Link>
				</Button>
			</div>
		</div>
	)
}
