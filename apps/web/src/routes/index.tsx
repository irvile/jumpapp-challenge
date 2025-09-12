import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@web/components/ui/button'

export const Route = createFileRoute('/')({
	component: LandingPage
})

function LandingPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<Button>Click me</Button>
		</div>
	)
}
