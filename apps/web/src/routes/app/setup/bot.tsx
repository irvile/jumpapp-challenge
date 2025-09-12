import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/setup/bot')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/app/setup/bot"!</div>
}
