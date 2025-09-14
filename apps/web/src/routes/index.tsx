import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: LandingPage,
	beforeLoad: () => {
		throw redirect({
			to: '/login'
		})
	}
})

function LandingPage() {
	return null
}
