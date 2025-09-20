import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/account')({
	component: AccountLayoutComponent
})

function AccountLayoutComponent() {
	return <Outlet />
}