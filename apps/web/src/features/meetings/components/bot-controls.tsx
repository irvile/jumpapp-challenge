import { Link } from '@tanstack/react-router'
import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Label } from '@web/components/ui/label'
import { Switch } from '@web/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@web/components/ui/tooltip'
import { useBillingStatus } from '@web/features/billing/hooks/use-billing'
import { dayjs } from '@web/libs/dayjs'
import { Bot, Crown } from 'lucide-react'
import { useState } from 'react'
import { useBotToggle } from '../hooks/use-bot-toggle'

interface BotControlsProps {
	meeting: {
		id: string
		googleAccountId: string
		startTime: string
		hasBot: boolean
	}
}

export function BotControls({ meeting }: BotControlsProps) {
	const [botEnabled, setBotEnabled] = useState(meeting.hasBot)
	const isPastEvent = dayjs(meeting.startTime).isBefore(dayjs())
	const { data: billingStatus } = useBillingStatus()

	const hasActiveSubscription = billingStatus?.hasActiveSubscription ?? false
	const canUseFeatures = hasActiveSubscription

	const botToggleMutation = useBotToggle(meeting.googleAccountId, meeting.id)

	const handleBotToggle = (enabled: boolean) => {
		if (!canUseFeatures) {
			return
		}
		setBotEnabled(enabled)
		botToggleMutation.mutate(enabled, {
			onError: () => {
				setBotEnabled(!enabled)
			}
		})
	}

	return (
		<div className="border-t pt-4">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<Label htmlFor="bot-toggle" className="flex items-center gap-2">
						<Bot className="h-4 w-4" />
						Request Notetaker
						{!hasActiveSubscription && <Crown className="h-3 w-3 text-yellow-500" />}
					</Label>
					<div className="text-sm text-muted-foreground">
						{!hasActiveSubscription
							? 'Pro feature - upgrade to add AI notetaker'
							: isPastEvent
								? 'Cannot add notetaker to past events'
								: 'Add an AI notetaker to record and transcribe this meeting'}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{botToggleMutation.isPending && <div className="text-xs text-muted-foreground">Updating...</div>}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div>
									<Switch
										checked={botEnabled}
										onCheckedChange={handleBotToggle}
										disabled={isPastEvent || botToggleMutation.isPending || !canUseFeatures}
									/>
								</div>
							</TooltipTrigger>
							{!canUseFeatures && (
								<TooltipContent>
									<p>Pro subscription required</p>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			{botEnabled && (
				<div className="mt-3 p-3 bg-muted/50 rounded-lg">
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="flex items-center gap-1">
							<Bot className="h-3 w-3" />
							Notetaker Enabled
						</Badge>
					</div>
					<div className="text-xs text-muted-foreground mt-1">
						A notetaker bot will join this meeting to record and provide transcripts.
					</div>
				</div>
			)}

			{!hasActiveSubscription && (
				<div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-950/20 dark:border-gray-800">
					<div className="flex items-center justify-between flex-col gap-2">
						<div className="text-sm text-gray-800 dark:text-blue-200">
							Upgrade to Pro to unlock AI notetaker and advanced meeting features.
						</div>
						<Button asChild size="sm" variant="default" className="w-full">
							<Link to="/app/account/billing">Upgrade now</Link>
						</Button>
					</div>
				</div>
			)}

			{isPastEvent && (
				<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/20 dark:border-yellow-800">
					<div className="text-sm text-yellow-800 dark:text-yellow-200">
						This meeting has already occurred. Notetaker settings cannot be changed.
					</div>
				</div>
			)}
		</div>
	)
}
