import Elysia from 'elysia'
import { generateContentRoute } from './generate-content.route'

export const aiRoutes = new Elysia({ prefix: '/v1/ai' }).use(generateContentRoute)
