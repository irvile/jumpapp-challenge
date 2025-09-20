import { BotIcon, BrainIcon, CalendarIcon, CreditCardIcon, ShieldUserIcon, SmilePlusIcon } from 'lucide-react'
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
				},
				{
					title: 'Content Automation',
					icon: BrainIcon,
					url: '/app/setup/content-automation'
				},
				{
					title: 'Google Accounts',
					icon: ShieldUserIcon,
					url: '/app/setup/google-accounts'
				},
				{
					title: 'Social Media Accounts',
					icon: SmilePlusIcon,
					url: '/app/setup/social-media-accounts'
				}
			]
		},
		{
			title: 'Account',
			items: [
				{
					title: 'Billing',
					icon: CreditCardIcon,
					url: '/app/account/billing'
				}
			]
		}
	]
}
