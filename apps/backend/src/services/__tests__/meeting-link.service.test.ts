import { describe, expect, test } from 'bun:test'
import { detectPlatform, extractMeetingLink } from '../meeting-link.service'

describe('Meeting Link Service Tests', () => {
	test('should extract Zoom meeting link from description', () => {
		const description = `Ada Lovelace is inviting you to a scheduled Zoom meeting.

Topic: My Meeting
Time: Sep 12, 2025 10:00 PM São Paulo
Join Zoom Meeting
https://us04web.zoom.us/j/12600357295?pwd=pD9wfiZcTMOA0OztPwRVYZaSMoCbaY.1

Meeting ID: 126 0035 7295
Passcode: tA0b9Qx`
		const result = extractMeetingLink(description)

		expect(result).not.toBeNull()
		if (result) {
			expect(result.platform).toBe('ZOOM')
			expect(result.url).toBe('https://us04web.zoom.us/j/12600357295?pwd=pD9wfiZcTMOA0OztPwRVYZaSMoCbaY.1')
		}
	})

	test('should extract Google Meet link from hangoutLink field', () => {
		const hangoutLink = 'https://meet.google.com/bni-hekt-aof'
		const result = extractMeetingLink(undefined, undefined, hangoutLink)

		expect(result).not.toBeNull()
		if (result) {
			expect(result.platform).toBe('GOOGLE_MEET')
			expect(result.url).toBe('https://meet.google.com/bni-hekt-aof')
		}
	})

	test('should extract Microsoft Teams link from description', () => {
		const description = `descriptions!
________________________________________________________________________________
Microsoft Teams Meeting
Join on your computer, mobile app or room device
Click to join the meeting<https://teams.live.com/meet/9385551482824?p=Nqcc5j3c06vlEOa23P>
Meeting ID: 938 555 148 282 4
Passcode: on3h3U
Download Teams<https://www.microsoft.com/en-us/microsoft-teams/download-app> | Join on the web<https://www.microsoft.com/microsoft-teams/join-a-meeting>
Learn more<https://aka.ms/JoinTeamsMeeting> | Meeting options<https://teams.live.com/meetingOptions/meetings/9385551482874/view?localeCode=en-US>
________________________________________________________________________________`
		const location = 'Microsoft Teams Meeting'
		const result = extractMeetingLink(description, location)

		expect(result).not.toBeNull()
		if (result) {
			expect(result.platform).toBe('MICROSOFT_TEAMS')
			expect(result.url).toBe('https://teams.live.com/meet/9385551482824?p=Nqcc5j3c06vlEOa23P')
		}
	})

	test('should extract Google Meet from description when no hangoutLink', () => {
		const description = 'Join our meeting'
		const result = extractMeetingLink(description, undefined, 'https://meet.google.com/xps-rcyc-xoc')

		expect(result).not.toBeNull()
		if (result) {
			expect(result.platform).toBe('GOOGLE_MEET')
			expect(result.url).toBe('https://meet.google.com/xps-rcyc-xoc')
		}
	})

	test('should prioritize hangoutLink over description for Google Meet', () => {
		const description = 'Meeting at https://meet.google.com/wrong-link'
		const hangoutLink = 'https://meet.google.com/correct-link'
		const result = extractMeetingLink(description, undefined, hangoutLink)

		expect(result).not.toBeNull()
		if (result) {
			expect(result.platform).toBe('GOOGLE_MEET')
			expect(result.url).toBe('https://meet.google.com/correct-link')
		}
	})

	test('should return null when no meeting link found', () => {
		const description = 'Regular meeting with no video call link'
		const result = extractMeetingLink(description)

		expect(result).toBeNull()
	})

	test('should return null for empty inputs', () => {
		const result = extractMeetingLink('', '', '')

		expect(result).toBeNull()
	})

	test('should detect platform from URL correctly', () => {
		expect(detectPlatform('https://zoom.us/j/123456789')).toBe('ZOOM')
		expect(detectPlatform('https://meet.google.com/abc-defg-hij')).toBe('GOOGLE_MEET')
		expect(detectPlatform('https://teams.microsoft.com/l/meetup-join/123')).toBe('MICROSOFT_TEAMS')
		expect(detectPlatform('https://teams.live.com/meet/9385551182874?p=xqcc5j3c06vlEOa13P')).toBe('MICROSOFT_TEAMS')
		expect(detectPlatform('https://example.com/meeting')).toBeNull()
		expect(detectPlatform('')).toBeNull()
	})

	test('should extract from combined description and location', () => {
		const description = 'Please join us at'
		const location = 'https://zoom.us/j/123456789'
		const result = extractMeetingLink(description, location)

		expect(result).not.toBeNull()

		if (result) {
			expect(result.platform).toBe('ZOOM')
			expect(result.url).toBe('https://zoom.us/j/123456789')
		}
	})

	test('should preserve query parameters in Microsoft Teams links', () => {
		const description = `Meeting link: https://teams.live.com/meet/9310127214559?p=H8GuIR6ZQOunkOppkT`
		const location = 'Microsoft Teams Meeting'
		const result = extractMeetingLink(description, location)

		expect(result).not.toBeNull()
		if (result) {
			expect(result.platform).toBe('MICROSOFT_TEAMS')
			expect(result.url).toBe('https://teams.live.com/meet/9310127214559?p=H8GuIR6ZQOunkOppkT')
		}
	})
})
