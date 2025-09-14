import { Button } from '@web/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'

interface MeetingHeaderProps {
	title: string
}

export function MeetingHeader({ title }: MeetingHeaderProps) {
	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-2">
					<Button variant="ghost" size="sm" onClick={() => window.history.back()}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to meetings
					</Button>
				</div>
				<div className="flex items-center gap-3">
					<div className="bg-primary/10 p-2 rounded-lg">
						<Calendar className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
						<p className="text-muted-foreground">Meeting details and AI-powered content generation</p>
					</div>
				</div>
			</div>
		</div>
	)
}