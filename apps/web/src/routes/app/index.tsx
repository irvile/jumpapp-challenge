import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '@web/libs/auth'

export const Route = createFileRoute('/app/')({
	component: RouteComponent
})

function RouteComponent() {
	const session = useSession()

	console.log(session)

	return (
		<div>
			Hello "/app/"!
			{session?.data?.user?.name ?? 'No session'}
		</div>
	)
}
