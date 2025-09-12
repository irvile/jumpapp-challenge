import { app } from './app'
import { envs } from './libs/envs'

const PORT = envs.BACKEND_PORT

app.listen({ port: PORT, hostname: '0.0.0.0' })

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
