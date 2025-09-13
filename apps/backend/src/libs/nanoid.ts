import { customAlphabet } from 'nanoid'

const customNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 14)

const idPrefixes = {
	user: 'u',
	meeting: 'mting',
	calendarAccount: 'cacc',
	calendarEvent: 'cevt',
	bot: 'bot',
	transcript: 'trsc',
	aiGeneratedContent: 'aicnt',
	socialMediaPost: 'smps',
	automation: 'autm',
	verification: 'vrfy',
	random: 'rndm',
	recallBot: 'bot',
	userSettings: 'usrs'
} as const

export type IdentifierPrefix = keyof typeof idPrefixes

export function genId(prefix: IdentifierPrefix) {
	return `${idPrefixes[prefix]}_${customNanoid()}`
}
