import Elysia from 'elysia'
import { createAutomationRoute } from './create-automation.route'
import { deleteAutomationRoute } from './delete-automation.route'
import { getAutomationsRoute } from './get-automations.route'
import { updateAutomationRoute } from './update-automation.route'

export const automationsRoutes = new Elysia({ prefix: '/v1/automations' })
	.use(getAutomationsRoute)
	.use(createAutomationRoute)
	.use(updateAutomationRoute)
	.use(deleteAutomationRoute)