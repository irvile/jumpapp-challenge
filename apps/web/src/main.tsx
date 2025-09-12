import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/auth.context'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()

// Set up a Router instance
const router = createRouter({
	routeTree,
	context: { queryClient, auth: null },
	defaultPreload: 'intent'
})

// Register things for typesafety
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

function InnerApp() {
	const auth = useAuth()

	const shouldNonAuthenticatedRedirect = [
		'/',
		'/reset-password',
		'/forgot-password',
		'/signup',
		'/links/apps',
		'/public/event'
	]

	if (auth.isLoading) {
		return null
	}

	if (!auth.isAuthenticated() && !shouldNonAuthenticatedRedirect.includes(router.state.location.pathname)) {
		// router.navigate({ to: '/login', search: (prev) => ({ ...prev }) })
	}

	return <RouterProvider router={router} context={{ auth: auth }} />
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<InnerApp />
				<Toaster richColors />
			</AuthProvider>
		</QueryClientProvider>
	)
}

// biome-ignore lint/style/noNonNullAssertion: default
const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement)
	root.render(<App />)
}
