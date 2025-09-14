import { Badge } from '@web/components/ui/badge'

interface PlatformBadgeProps {
	platform: string | null
	className?: string
}

const PlatformIcons = {
	GOOGLE_MEET: (
		<svg
			width="16"
			height="16"
			viewBox="0 0 300 300"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="w-3 h-3"
		>
			<path
				d="M283.168 55.9468L238.259 92.9987V46.6993C238.259 35.2638 229.053 26 217.689 26H70.279L0 96.7263V203.678V253.705C0 265.14 9.20544 274.404 20.5696 274.404H70.279H217.689C229.053 274.404 238.259 265.14 238.259 253.705V209.13L283.372 246.357C290.124 251.669 300 246.824 300 238.182V63.9497C300 55.2046 289.903 50.4074 283.168 55.9468ZM169.694 203.678H70.279V96.7263H169.694V150.202V203.678Z"
				fill="#F5BB41"
			/>
			<path d="M0 203.678V253.705C0 265.14 9.20544 274.404 20.5696 274.404H70.279V203.678H0Z" fill="#2167D1" />
			<path d="M70.279 96.7263H0V203.678H70.279V96.7263Z" fill="#3D84F3" />
			<path
				d="M283.168 55.9468L238.259 92.9987V209.13L283.372 246.357C290.124 251.669 300 246.824 300 238.182V63.9497C300 55.2046 289.903 50.4074 283.168 55.9468Z"
				fill="#4CA853"
			/>
			<path
				d="M169.694 150.202V203.678H70.279V274.404H217.689C229.053 274.404 238.259 265.14 238.259 253.705V209.13L169.694 150.202Z"
				fill="#4CA853"
			/>
			<path d="M238.259 209.13V93.0344L169.694 150.202L238.259 209.13Z" fill="#398039" />
			<path d="M0 96.7263H70.279V26L0 96.7263Z" fill="#D74F3F" />
			<path
				d="M217.689 26H70.279V96.7263H169.694V150.202L238.259 93.0344V92.9987V46.6993C238.259 35.2638 229.053 26 217.689 26Z"
				fill="#F5BB41"
			/>
		</svg>
	),
	ZOOM: (
		<svg
			viewBox="0 0 24 24"
			strokeWidth="2"
			fill="currentColor"
			color="#2D8CFF"
			className="w-2.5"
			style={{ minHeight: '0.6rem', minWidth: '0.8rem' }}
		>
			<path d="M1.984 7.506v6.74c.006 1.524 1.361 2.75 3.014 2.745h10.693c.303 0 .549-.225.549-.498v-6.74c-.008-1.523-1.363-2.75-3.014-2.744H2.531c-.302 0-.547.224-.547.497zm14.936 2.63l4.416-2.963c.383-.292.68-.219.68.309v9.036c0 .601-.363.528-.68.309L16.92 13.87v-3.734z" />
		</svg>
	),
	MICROSOFT_TEAMS: (
		<svg fill="currentColor" viewBox="0 0 16 16" height="1em" width="1em" color="#6264A7" className="w-3 h-3">
			<path d="M9.186 4.797a2.42 2.42 0 10-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682v.766zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 01.682.716v4.294a4.197 4.197 0 01-4.093 4.293c-1.618-.04-3-.99-3.667-2.35zm10.737-9.372a1.674 1.674 0 11-3.349 0 1.674 1.674 0 013.349 0zm-2.238 9.488c-.04 0-.08 0-.12-.002a5.19 5.19 0 00.381-2.07V6.306a1.692 1.692 0 00-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.598 2.598 0 01-2.598 2.598h-.013z" />
			<path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.682.682 0 01-.682.682H.682A.682.682 0 010 10.853V4.03c0-.377.305-.682.682-.682zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945h1.363z" />
		</svg>
	)
}

const PlatformLabels = {
	GOOGLE_MEET: 'Meet',
	ZOOM: 'Zoom',
	MICROSOFT_TEAMS: 'Teams'
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
	if (!platform || !PlatformIcons[platform as keyof typeof PlatformIcons]) {
		return null
	}

	const platformKey = platform as keyof typeof PlatformIcons
	const icon = PlatformIcons[platformKey]
	const label = PlatformLabels[platformKey]

	return (
		<div className={`flex flex-col gap-1 ${className}`}>
			<p className="text-[13px] font-medium">Platform</p>
			<Badge
				variant="outline"
				className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold w-fit shadow-none"
			>
				<div className="flex items-center whitespace-nowrap">
					<div className="flex items-center mr-1.5">{icon}</div>
					<span className="text-xs font-medium">{label}</span>
				</div>
			</Badge>
		</div>
	)
}
