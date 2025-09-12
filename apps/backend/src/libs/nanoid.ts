import { customAlphabet } from 'nanoid'

const customNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 14)

const idPrefixes = {
	user: 'user'
} as const

export type IdentifierPrefix = keyof typeof idPrefixes

export function genId(prefix: IdentifierPrefix) {
	return `${idPrefixes[prefix]}_${customNanoid()}`
}
