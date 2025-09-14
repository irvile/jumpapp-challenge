import { Button } from '@web/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'

interface MeetingHeaderProps {
	title: string
}

export function MeetingHeader({ title }: MeetingHeaderProps) {
	return (
		<div className="border-b">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" onClick={() => window.history.back()}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to meetings
					</Button>
					<div className="flex-1">
						<h1 className="text-2xl font-bold flex items-center gap-3">
							<Calendar className="h-6 w-6" />
							{title}
						</h1>
						<p className="text-muted-foreground">Meeting details and AI-powered content generation</p>
					</div>
				</div>
			</div>
		</div>
	)
}