import { z } from 'zod'

export const envsSchema = z.object({
	NODE_ENV: z.enum(['development', 'production']).default('development'),
	WEB_PORT: z.coerce.number().default(3001),
	VITE_PUBLIC_BACKEND_API_URL: z.string().default('http://localhost:3005')
})

export const envs = envsSchema.parse(import.meta.env)
