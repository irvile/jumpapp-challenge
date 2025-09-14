import Elysia from 'elysia'
import { generateContentRoute } from './generate-content.route'
import { generateEmailRecapRoute } from './generate-email-recap.route'

export const aiRoutes = new Elysia({ prefix: '/v1/ai' }).use(generateContentRoute).use(generateEmailRecapRoute)
