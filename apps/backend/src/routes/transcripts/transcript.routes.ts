import Elysia from 'elysia'
import { parseTranscriptRoute } from './parse.route'
import { generateContentRoute } from './generate-content.route'

export const transcriptRoutes = new Elysia({ prefix: '/v1/transcripts' })
	.use(parseTranscriptRoute)
	.use(generateContentRoute)