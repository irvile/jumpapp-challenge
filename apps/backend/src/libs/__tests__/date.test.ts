import { describe, expect, test } from 'bun:test'
import { endOfDay, isSameDay, startOfDay } from '../date'

describe('Date Utils', () => {
	test('startOfDay should return the start of the day', () => {
		const dateString = '2025-09-13T15:30:45Z'
		const result = startOfDay(dateString)

		expect(result.getFullYear()).toBe(2025)
		expect(result.getMonth()).toBe(8) // September (0-based)
		expect(result.getDate()).toBe(13)
		expect(result.getHours()).toBe(0)
		expect(result.getMinutes()).toBe(0)
		expect(result.getSeconds()).toBe(0)
		expect(result.getMilliseconds()).toBe(0)
	})

	test('startOfDay should work with different date formats', () => {
		const dateString = '2025-09-13'
		const result = startOfDay(dateString)

		expect(result.getFullYear()).toBe(2025)
		expect(result.getMonth()).toBe(8) // September (0-based)
		expect(result.getDate()).toBe(13)
		expect(result.getHours()).toBe(0)
		expect(result.getMinutes()).toBe(0)
		expect(result.getSeconds()).toBe(0)
		expect(result.getMilliseconds()).toBe(0)
	})

	test('endOfDay should return the end of the day', () => {
		const dateString = '2025-09-13T15:30:45Z'
		const result = endOfDay(dateString)

		expect(result.getFullYear()).toBe(2025)
		expect(result.getMonth()).toBe(8) // September (0-based)
		expect(result.getDate()).toBe(13)
		expect(result.getHours()).toBe(23)
		expect(result.getMinutes()).toBe(59)
		expect(result.getSeconds()).toBe(59)
		expect(result.getMilliseconds()).toBe(999)
	})

	test('endOfDay should work with different date formats', () => {
		const dateString = '2025-09-13'
		const result = endOfDay(dateString)

		expect(result.getFullYear()).toBe(2025)
		expect(result.getMonth()).toBe(8) // September (0-based)
		expect(result.getDate()).toBe(13)
		expect(result.getHours()).toBe(23)
		expect(result.getMinutes()).toBe(59)
		expect(result.getSeconds()).toBe(59)
		expect(result.getMilliseconds()).toBe(999)
	})

	test('isSameDay should return true for dates in the same day', () => {
		const date1 = '2025-09-13T10:00:00Z'
		const date2 = '2025-09-13T15:30:45Z'

		expect(isSameDay(date1, date2)).toBe(true)
	})

	test('isSameDay should return true for same date with different time formats', () => {
		const date1 = '2025-09-13'
		const date2 = '2025-09-13T23:59:59Z'

		expect(isSameDay(date1, date2)).toBe(true)
	})

	test('isSameDay should return false for dates in different days', () => {
		const date1 = '2025-09-13T10:00:00Z'
		const date2 = '2025-09-14T10:00:00Z'

		expect(isSameDay(date1, date2)).toBe(false)
	})

	test('isSameDay should return false for dates in different months', () => {
		const date1 = '2025-09-13T10:00:00Z'
		const date2 = '2025-10-13T10:00:00Z'

		expect(isSameDay(date1, date2)).toBe(false)
	})

	test('isSameDay should return false for dates in different years', () => {
		const date1 = '2025-09-13T10:00:00Z'
		const date2 = '2024-09-13T10:00:00Z'

		expect(isSameDay(date1, date2)).toBe(false)
	})

	test('isSameDay should handle edge cases at midnight', () => {
		const date1 = '2025-09-13T00:00:00Z'
		const date2 = '2025-09-12T23:59:59Z'

		expect(isSameDay(date1, date2)).toBe(false)
	})

	test('isSameDay should handle edge cases at end of day', () => {
		const date1 = '2025-09-13T23:59:59Z'
		const date2 = '2025-09-14T00:00:00Z'

		expect(isSameDay(date1, date2)).toBe(false)
	})
})
