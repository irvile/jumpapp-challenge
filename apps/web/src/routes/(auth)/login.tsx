import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '@web/features/auth/login-form'

export const Route = createFileRoute('/(auth)/login')({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		const shouldRedirect = context.auth?.isAuthenticated()

		if (shouldRedirect) {
			throw redirect({
				to: '/app/meetings'
			})
		}
	}
})

function RouteComponent() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-4xl">
				<LoginForm />
			</div>
		</div>
	)
}
