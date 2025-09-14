import { Button } from '@web/components/ui/button'
import { Card, CardContent } from '@web/components/ui/card'
import { Edit3, Facebook, Linkedin } from 'lucide-react'
import type { AutomationListItem } from '../queries/use-automations'

interface AutomationCardProps {
	automation: AutomationListItem
	onEdit: (automation: AutomationListItem) => void
}

function mapAutomationTypeToLabel(type: string) {
	return type === 'GENERATE_POST' ? 'Generate Post' : 'Generate Summary'
}

export function AutomationCard({ automation, onEdit }: AutomationCardProps) {
	const platformIcons = {
		LINKEDIN: <Linkedin className="h-4 w-4 text-blue-600" />,
		FACEBOOK: <Facebook className="h-4 w-4 text-blue-500" />
	}

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3 flex-1">
						<div className="p-2 rounded-lg bg-primary/10">{platformIcons[automation.platform]}</div>
						<div className="flex-1 min-w-0 overflow-hidden">
							<div className="flex items-center gap-2 mb-1">
								<h3 className="font-medium text-sm truncate">{automation.name}</h3>
							</div>
							<div className="flex items-center gap-2 mb-2">
								<span className="text-xs text-muted-foreground">{mapAutomationTypeToLabel(automation.type)}</span>
							</div>
							<div className="group relative">
								<p
									className="text-xs text-muted-foreground overflow-hidden"
									style={{
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										wordBreak: 'break-word'
									}}
									title={automation.description}
								>
									{automation.description}
								</p>
							</div>
						</div>
					</div>
					<Button variant="ghost" size="sm" onClick={() => onEdit(automation)}>
						<Edit3 className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
