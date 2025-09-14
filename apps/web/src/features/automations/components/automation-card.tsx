import { Badge } from '@web/components/ui/badge'
import { Button } from '@web/components/ui/button'
import { Card, CardContent } from '@web/components/ui/card'
import { Edit3, Facebook, Linkedin } from 'lucide-react'
import type { Automation } from '../types'

interface AutomationCardProps {
	automation: Automation
	onEdit: (automation: Automation) => void
}

export function AutomationCard({ automation, onEdit }: AutomationCardProps) {
	const platformIcons = {
		LINKEDIN: <Linkedin className="h-4 w-4 text-blue-600" />,
		FACEBOOK: <Facebook className="h-4 w-4 text-blue-500" />
	}

	const platformColors = {
		LINKEDIN: 'bg-blue-50 text-blue-700 border-blue-200',
		FACEBOOK: 'bg-blue-50 text-blue-700 border-blue-200'
	}

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3 flex-1">
						<div className="p-2 rounded-lg bg-primary/10">
							{platformIcons[automation.platform]}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h3 className="font-medium text-sm truncate">{automation.name}</h3>
								{automation.isActive ? (
									<Badge variant="default" className="text-xs">Active</Badge>
								) : (
									<Badge variant="secondary" className="text-xs">Inactive</Badge>
								)}
							</div>
							<div className="flex items-center gap-2 mb-2">
								<span className="text-xs text-muted-foreground">{automation.type}</span>
								<Badge 
									variant="outline" 
									className={`text-xs ${platformColors[automation.platform]}`}
								>
									{automation.platform}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground line-clamp-2">
								{automation.description}
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(automation)}
					>
						<Edit3 className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}