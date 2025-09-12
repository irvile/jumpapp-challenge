import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export function formatDateISOString(date: string, formatDate: string) {
	const dateParsed = dayjs(date)
	return dateParsed.format(formatDate)
}

export { dayjs }
