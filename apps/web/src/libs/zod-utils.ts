import { z } from 'zod'

export const phoneSchema = z
	.string({ error: 'Required' })
	.min(1, { message: 'Required' })
	.regex(/^\(\d{2}\)\s*\d{4,5}\s*-\s*\d{4}$/, { message: 'Invalid number' })
