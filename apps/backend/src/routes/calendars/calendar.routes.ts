import Elysia from 'elysia'
import { botStatusRoute } from './bot-status.route'
import { getCalendarEventsRoute } from './get-events.route'
import { listCalendarAccountsRoute } from './list-calendars.route'
import { toggleBotRoute } from './toggle-bot.route'
import { transcriptRoute } from './transcript.route'

export const calendarRoutes = new Elysia({ prefix: '/v1/calendars' })
	.use(listCalendarAccountsRoute)
	.use(getCalendarEventsRoute)
	.use(toggleBotRoute)
	.use(transcriptRoute)
	.use(botStatusRoute)
