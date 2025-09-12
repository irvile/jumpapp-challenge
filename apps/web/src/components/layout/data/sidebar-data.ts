import { BotIcon, CalendarIcon } from 'lucide-react'
import type { SidebarData } from '../types'

export const sidebarData: SidebarData = {
	teams: [],
	navGroups: [
		{
			title: 'Platform',
			items: [
				{
					title: 'Meetings',
					url: '/app/meetings',
					icon: CalendarIcon
				}
			]
		},
		{
			title: 'Setup & Integrations',
			items: [
				{
					title: 'Meeting Bot Setup',
					icon: BotIcon,
					url: '/app/setup/bot'
				}
			]
		}
	]
}
