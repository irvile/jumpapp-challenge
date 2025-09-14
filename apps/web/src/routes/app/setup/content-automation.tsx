import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { AutomationCard } from '@web/features/automations/components/automation-card'
import { AutomationDialog } from '@web/features/automations/components/automation-dialog'
import { type AutomationListItem, useAutomations } from '@web/features/automations/queries/use-automations'
import { AlertCircle, BrainIcon, Plus, Zap } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/app/setup/content-automation')({
	component: RouteComponent
})

function RouteComponent() {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [selectedAutomation, setSelectedAutomation] = useState<AutomationListItem | null>(null)
	const { data: automations = [], isLoading } = useAutomations()

	const handleCreateAutomation = () => {
		setSelectedAutomation(null)
		setIsDialogOpen(true)
	}

	const handleEditAutomation = (automation: AutomationListItem) => {
		setSelectedAutomation(automation)
		setIsDialogOpen(true)
	}

	const activeAutomations = automations.filter((a) => a.isActive)
	const inactiveAutomations = automations.filter((a) => !a.isActive)

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="bg-primary/10 p-2 rounded-lg">
						<BrainIcon className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Content Automation</h1>
						<p className="text-muted-foreground">Configure how content is generated from your meetings</p>
					</div>
				</div>
			</div>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5" />
							Your Automations
						</CardTitle>
						<CardDescription>Automations that generate content from your meeting transcripts</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="text-center py-8">
								<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
							</div>
						) : automations.length === 0 ? (
							<div className="text-center py-8">
								<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">No automations configured</h3>
								<p className="text-muted-foreground mb-6">
									Create your first automation to automatically generate social media content from your meetings.
								</p>
								<Button onClick={handleCreateAutomation}>
									<Plus className="h-4 w-4 mr-2" />
									Create Automation
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{activeAutomations.map((automation) => (
									<AutomationCard key={automation.id} automation={automation} onEdit={handleEditAutomation} />
								))}
								{inactiveAutomations.map((automation) => (
									<AutomationCard key={automation.id} automation={automation} onEdit={handleEditAutomation} />
								))}
								<div className="pt-4 border-t">
									<Button onClick={handleCreateAutomation} variant="outline" className="w-full">
										<Plus className="h-4 w-4 mr-2" />
										Add Another Automation
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{isDialogOpen ? (
				<AutomationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} automation={selectedAutomation} />
			) : null}
		</div>
	)
}
