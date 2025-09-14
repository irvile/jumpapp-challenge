import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/meetings')({
	component: RouteComponent
})

function RouteComponent() {
	return <Outlet />
}
