import { cn } from '@web/libs/utils'
import * as React from 'react'

type InputProps = React.ComponentProps<'input'> & {
	startAddOns?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, startAddOns, ...props }, ref) => {
	return (
		<div className="relative">
			{startAddOns && (
				<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{startAddOns}</span>
			)}
			<input
				type={type}
				data-testid={`${props.name}-input`}
				className={cn(
					'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base  transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
					className,
					startAddOns && 'pl-8'
				)}
				ref={ref}
				{...props}
			/>
		</div>
	)
})
Input.displayName = 'Input'

export { Input }
