import { Badge } from '@web/components/ui/badge'
import { Label } from '@web/components/ui/label'
import { Switch } from '@web/components/ui/switch'
import { dayjs } from '@web/libs/dayjs'
import { Bot } from 'lucide-react'
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
	
	const botToggleMutation = useBotToggle(meeting.googleAccountId, meeting.id)

	const handleBotToggle = (enabled: boolean) => {
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
					</Label>
					<div className="text-sm text-muted-foreground">
						{isPastEvent
							? 'Cannot add notetaker to past events'
							: 'Add an AI notetaker to record and transcribe this meeting'}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{botToggleMutation.isPending && <div className="text-xs text-muted-foreground">Updating...</div>}
					<Switch
						checked={botEnabled}
						onCheckedChange={handleBotToggle}
						disabled={isPastEvent || botToggleMutation.isPending}
					/>
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

			{isPastEvent && (
				<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<div className="text-sm text-yellow-800">
						This meeting has already occurred. Notetaker settings cannot be changed.
					</div>
				</div>
			)}
		</div>
	)
}