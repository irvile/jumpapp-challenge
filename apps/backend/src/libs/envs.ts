import { z } from 'zod'

const envsSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	BACKEND_PORT: z.coerce.number().default(3001),

	DATABASE_URL: z.string(),

	BETTER_AUTH_URL: z.string(),
	BACKEND_API_URL: z.string().optional(),

	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),

	RECALL_API_KEY: z.string(),
	GEMINI_API_KEY: z.string(),

	LINKEDIN_CLIENT_ID: z.string(),
	LINKEDIN_CLIENT_SECRET: z.string(),

	FACEBOOK_CLIENT_ID: z.string(),
	FACEBOOK_CLIENT_SECRET: z.string(),

	STRIPE_SECRET_KEY: z.string(),
	STRIPE_PUBLISHABLE_KEY: z.string(),
	STRIPE_WEBHOOK_SECRET: z.string(),
	FRONTEND_URL: z.string().default('http://localhost:3000')
})

// biome-ignore lint/style/noProcessEnv: >
const envs = envsSchema.parse(process.env)

export { envs }
