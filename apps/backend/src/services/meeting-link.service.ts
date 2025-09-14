import type { Platform } from '@backend/libs/generated/prisma'

interface MeetingLinkData {
	url: string
	platform: Platform
}

const ZOOM_PATTERNS = [
	/https?:\/\/[\w\d.-]*zoom\.us\/[^\s]+/i,
	/[\w\d.-]*zoom\.us\/j\/\d+[^\s]*/i,
	/[\w\d.-]*zoom\.us\/meeting\/\d+[^\s]*/i
]

const MEET_PATTERNS = [/meet\.google\.com\/[a-zA-Z0-9-]+/i, /g\.co\/meet\/[a-zA-Z0-9-]+/i]

const TEAMS_PATTERNS = [
	/https:\/\/teams\.microsoft\.com\/[^\s<>]+/i,
	/https:\/\/teams\.live\.com\/meet\/[^\s<>]+/i,
	/teams\.live\.com\/meet\/[^\s<>]+/i,
	/join\.teams\.microsoft\.com\/[^\s<>]+/i
]

export function extractMeetingLink(
	description?: string,
	location?: string,
	hangoutLink?: string
): MeetingLinkData | null {
	const textToSearch = [description, location].filter(Boolean).join(' ')

	if (hangoutLink) {
		return {
			url: hangoutLink,
			platform: 'GOOGLE_MEET'
		}
	}

	if (location === 'Microsoft Teams Meeting') {
		const teamsMatch = TEAMS_PATTERNS.find((pattern) => pattern.test(textToSearch))
		if (teamsMatch) {
			const match = textToSearch.match(teamsMatch)
			if (match) {
				return {
					url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
					platform: 'MICROSOFT_TEAMS'
				}
			}
		}
	}

	if (!textToSearch) return null

	const zoomMatch = ZOOM_PATTERNS.find((pattern) => pattern.test(textToSearch))
	if (zoomMatch) {
		const match = textToSearch.match(zoomMatch)
		if (match) {
			return {
				url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
				platform: 'ZOOM'
			}
		}
	}

	const meetMatch = MEET_PATTERNS.find((pattern) => pattern.test(textToSearch))
	if (meetMatch) {
		const match = textToSearch.match(meetMatch)
		if (match) {
			return {
				url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
				platform: 'GOOGLE_MEET'
			}
		}
	}

	const teamsMatch = TEAMS_PATTERNS.find((pattern) => pattern.test(textToSearch))
	if (teamsMatch) {
		const match = textToSearch.match(teamsMatch)
		if (match) {
			return {
				url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
				platform: 'MICROSOFT_TEAMS'
			}
		}
	}

	return null
}

export function detectPlatform(url: string): Platform | null {
	if (!url) return null

	if (url.includes('zoom.us')) return 'ZOOM'
	if (url.includes('meet.google.com') || url.includes('g.co/meet')) return 'GOOGLE_MEET'
	if (url.includes('teams.microsoft.com') || url.includes('teams.live.com') || url.includes('join.teams.microsoft.com'))
		return 'MICROSOFT_TEAMS'

	return null
}
