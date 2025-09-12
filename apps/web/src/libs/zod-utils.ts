import { z } from 'zod'

export const phoneSchema = z
	.string({ error: 'Obrigatório' })
	.min(1, { message: 'Obrigatório' })
	.regex(/^\(\d{2}\)\s*\d{4,5}\s*-\s*\d{4}$/, { message: 'Número inválido' })
