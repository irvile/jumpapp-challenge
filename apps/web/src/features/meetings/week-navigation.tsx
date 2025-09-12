import { Button } from '@web/components/ui/button'
import { dayjs } from '@web/libs/dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekNavigationProps {
	currentWeek: dayjs.Dayjs
	onPreviousWeek: () => void
	onNextWeek: () => void
	onCurrentWeek: () => void
}

export function WeekNavigation({ currentWeek, onPreviousWeek, onNextWeek, onCurrentWeek }: WeekNavigationProps) {
	const isCurrentWeek = currentWeek.isSame(dayjs().startOf('week').add(1, 'day'), 'week')

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="flex items-center justify-center gap-2">
				<Button variant="ghost" size="icon" onClick={onPreviousWeek} className="h-8 w-8 hover:bg-muted">
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2 min-w-[280px] justify-center">
					<div className="text-center">
						<div className="text-base font-semibold">
							{currentWeek.format('D')} - {currentWeek.add(6, 'day').format('D [of] MMMM')}
						</div>
						<div className="text-xs text-muted-foreground">
							{currentWeek.format('YYYY')} • {currentWeek.format('MMM').toUpperCase()}
						</div>
					</div>
				</div>

				<Button variant="ghost" size="icon" onClick={onNextWeek} className="h-8 w-8 hover:bg-muted">
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{!isCurrentWeek && (
				<Button variant="outline" size="sm" onClick={onCurrentWeek} className="text-xs">
					Go to current week
				</Button>
			)}
		</div>
	)
}
