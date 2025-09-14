import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar'
import { Badge } from '@web/components/ui/badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@web/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@web/components/ui/sidebar'
import { useAuth } from '@web/contexts/auth.context'
import { signOut } from '@web/libs/auth'
import { getInitials } from '@web/libs/utils'
import { ChevronsUpDown, LogOut, Sparkles } from 'lucide-react'

export function NavUser() {
	const { isMobile } = useSidebar()
	const auth = useAuth()

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={auth.session?.user.image ?? undefined} alt={auth.session?.user.name} />
								<AvatarFallback className="rounded-lg">{getInitials(auth.session?.user.name ?? '')}</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">{auth.session?.user.name}</span>
								<span className="truncate text-xs">{auth.session?.user.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={auth.session?.user.image ?? undefined} alt={auth.session?.user.name} />
									<AvatarFallback className="rounded-lg">{getInitials(auth.session?.user.name ?? '')}</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{auth.session?.user.name}</span>
									<span className="truncate text-xs">{auth.session?.user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<Sparkles />
								Subscribe
								<Badge variant="secondary" className="ml-auto">
									SOON
								</Badge>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						{/* <DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link to="/settings/account">
									<BadgeCheck />
									Account
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/settings">
									<CreditCard />
									Billing
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/settings/notifications">
									<Bell />
									Notifications
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup> */}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={async () => {
								await signOut()
								// await navigate({ to: '/login', replace: true })
							}}
						>
							<LogOut />
							Logout
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
