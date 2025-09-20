import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@web/components/layout/app-sidebar'
import { SubscriptionBanner } from '@web/components/layout/subscription-banner'
import { SidebarProvider } from '@web/components/ui/sidebar'
import { cn } from '@web/libs/utils'

export const Route = createFileRoute('/app')({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		if (context.auth?.isLoading) {
			return
		}

		if (!context.auth?.isAuthenticated()) {
			throw redirect({
				to: '/login'
			})
		}
	}
})

function RouteComponent() {
	return (
		<SidebarProvider defaultOpen={true}>
			<AppSidebar />
			<div
				className={cn(
					'ml-auto w-full max-w-full',
					'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
					'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
					'sm:transition-[width] sm:duration-200 sm:ease-linear',
					'flex h-svh flex-col',
					'group-data-[scroll-locked=1]/body:h-full',
					'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
				)}
			>
				<SubscriptionBanner />
				<Outlet />
			</div>
		</SidebarProvider>
	)
}
