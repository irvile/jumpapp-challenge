import { Button } from '@web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { genereateFrontendId } from '@web/libs/utils'
import { Bot, Check, CreditCard, ExternalLink, Lock, Users, Video, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCheckout } from '../hooks/use-billing'

export function UpgradeToPro() {
	const createCheckout = useCreateCheckout()

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

	const features = [
		{
			icon: <Bot className="h-5 w-5 text-blue-600" />,
			title: 'Unlimited AI Bots',
			description: 'Create as many meeting bots as you need'
		},
		{
			icon: <Video className="h-5 w-5 text-blue-600" />,
			title: 'All Platforms Supported',
			description: 'Microsoft Teams, Google Meet, and Zoom'
		},
		{
			icon: <Users className="h-5 w-5 text-blue-600" />,
			title: 'Specialized AI Agents',
			description: 'Product Manager, Marketing, Finance experts'
		}
	]

	return (
		<div className="max-w-4xl mx-auto">
			<Card className="border-2 border-border-subtle shadow-xl">
				<CardHeader className="text-center pb-6">
					<CardTitle className="text-3xl font-bold text-primary">Upgrade to Pro</CardTitle>
					<CardDescription className="text-lg text-muted-foreground">
						Unlock the full power of AI-driven meeting automation
					</CardDescription>
					<div className="flex items-baseline justify-center gap-2 mt-4">
						<span className="text-4xl font-bold text-content-emphasis">$9</span>
						<span className="text-lg text-muted-foreground">/month</span>
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					<div className="grid gap-4 md:grid-cols-3">
						{features.map((feature) => (
							<div key={genereateFrontendId()} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
								<div className="flex-shrink-0 mt-1">{feature.icon}</div>
								<div>
									<h4 className="font-semibold text-sm text-content-emphasis">{feature.title}</h4>
									<p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
								</div>
							</div>
						))}
					</div>

					<div className="bg-muted/50 rounded-lg p-6">
						<h3 className="font-semibold text-lg mb-4 text-center">Everything you need to automate your meetings</h3>
						<div className="grid gap-3 md:grid-cols-2">
							{[
								'Unlimited AI meeting bots',
								'Microsoft Teams integration',
								'Google Meet support',
								'Zoom compatibility',
								'Product Manager AI agent',
								'Marketing Brainstorm agent',
								'Finance specialist agent',
								'Custom bot configurations',
								'Meeting transcriptions',
								'Action item extraction',
								'Smart meeting summaries',
								'Priority support'
							].map((feature) => (
								<div key={genereateFrontendId()} className="flex items-center gap-2">
									<Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
									<span className="text-sm text-content-emphasis">{feature}</span>
								</div>
							))}
						</div>
					</div>

					<div className="space-y-3 pt-4">
						<Button
							onClick={() => handleSubscribe('monthly')}
							disabled={createCheckout.isPending}
							size="lg"
							variant="default"
							className="w-full"
						>
							<CreditCard className="mr-2 h-5 w-5" />
							{createCheckout.isPending ? 'Creating checkout...' : 'Upgrade to Pro - $9/month'}
							<ExternalLink className="ml-2 h-5 w-5" />
						</Button>

						<div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Lock className="h-3 w-3" />
								<span>Secure payment</span>
							</div>
							<span>•</span>
							<div className="flex items-center gap-1">
								<Zap className="h-3 w-3" />
								<span>Instant activation</span>
							</div>
							<span>•</span>
							<div className="flex items-center gap-1">
								<X className="h-3 w-3" />
								<span>Cancel anytime</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
