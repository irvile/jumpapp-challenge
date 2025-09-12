import type { App } from '@backend'
import { treaty } from '@elysiajs/eden'
import { envs } from '@web/libs/envs'

const BACKEND_API_URL = envs.VITE_PUBLIC_BACKEND_API_URL

// @ts-expect-error
export const backend = treaty<App>(BACKEND_API_URL, {
	fetch: {
		credentials: 'include'
	}
})
