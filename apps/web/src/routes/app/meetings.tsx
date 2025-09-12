import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/meetings')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/app/meetins"!</div>
}
