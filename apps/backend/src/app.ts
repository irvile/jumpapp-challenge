import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { auth } from './libs/auth'
import { authRoutes } from './routes/auth/auth.routes'
import { calendarRoutes } from './routes/calendars/calendar.routes'
import { transcriptRoutes } from './routes/transcripts/transcript.routes'
import { usersRoutes } from './routes/users/users.routes'
import { webhookRoutes } from './routes/webhooks/webhook.routes'

const routes = new Elysia({ prefix: '/api' })
	.use(calendarRoutes)
	.use(authRoutes)
	.use(transcriptRoutes)
	.use(usersRoutes)
	.use(webhookRoutes)

const app = new Elysia()
	.use(swagger())
	.use(
		cors({
			origin: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization'],
			credentials: true
		})
	)
	.mount(auth.handler)
	.use(routes)
	.get('/version', () => ({
		version: '1.0.0'
	}))

export { app }
