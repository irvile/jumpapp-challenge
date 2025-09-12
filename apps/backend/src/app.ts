import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { auth } from './libs/auth'

const routes = new Elysia({ prefix: '/api' })

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
