import { Link } from '@tanstack/react-router'
import { NavGroup } from '@web/components/layout/nav-group'
import { NavUser } from '@web/components/layout/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail
} from '@web/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" variant="floating" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link to="/app/meetings">
								<div className="flex-1 flex items-center gap-2 justify-center">
									<div className="h-12 w-12">
										<svg
											className="block h-auto text-[#008750]"
											width="80"
											xmlns="http://www.w3.org/2000/svg"
											version="1.1"
											viewBox="0 0 79.6 25"
											fill="currentColor"
										>
											<path d="M30,1.8v12.8c0,.9-.2,2.2-1.1,3.4-.9,1.3-2.4,2.2-4.5,2.2-2.1,0-3.6-.9-4.5-2.2-.8-1.2-1.1-2.5-1.1-3.4h4c0,.3,0,.7.3,1,0,.1.2.2.4.3.1,0,.4.2.8.2s.7,0,.8-.2c.1,0,.3-.2.4-.3.2-.3.3-.7.3-1h0V1.8h4ZM69.9,25h-3.9V6.7h3.4l.3,1.3h.1c.6-.8,1.9-1.6,3.8-1.6,3.4,0,6.1,2.8,6.1,6.9s-2.8,6.9-6.1,6.9-3.1-.7-3.5-1.3h-.1v6.2ZM72.8,16.5c1.7,0,2.9-1.2,2.9-3.3s-1.3-3.2-2.9-3.2-2.9,1.2-2.9,3.2,1.3,3.3,2.9,3.3ZM49.3,19.8h-3.9V6.7h3.4l.3,1.2h.1c.4-.6,1.6-1.4,3.1-1.4s3.2,1.1,3.6,1.8h.1c.6-.9,2-1.8,4-1.8s4.9,2.2,4.9,5.4v8.1h-3.9v-7.5c0-1.4-.7-2.2-1.9-2.2s-2,.9-2,2.2v7.5h-3.9v-7.5c0-1.4-.8-2.2-1.9-2.2s-2,.9-2,2.2v7.5ZM36.6,20.1c-3,0-5.2-2.1-5.2-5.5v-7.9h3.9v7.3c0,1.4,1,2.5,2.4,2.5s2.4-1,2.4-2.5v-7.3h3.9v13.2h-3.4l-.3-1.2h-.1c-.6.7-2,1.4-3.7,1.4ZM7.7,4.7c4.3,0,7.7,3.5,7.7,7.7s-3.5,7.7-7.7,7.7S0,16.7,0,12.4s3.5-7.7,7.7-7.7ZM18.3,0c2.2,0,4,1.8,4,4s-1.8,4-4,4-4-1.8-4-4,1.8-4,4-4Z"></path>
										</svg>
									</div>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{sidebarData.navGroups.map((props) => (
					<NavGroup key={props.title} {...props} />
				))}
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
