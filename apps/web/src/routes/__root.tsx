import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { AuthContextType } from '@web/contexts/auth.context'

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
	auth: AuthContextType | null
}>()({
	component: RootComponent
})

function RootComponent() {
	return (
		<>
			<Outlet />
			{import.meta.env.MODE === 'development' && <TanStackRouterDevtools position="bottom-right" />}
		</>
	)
}
