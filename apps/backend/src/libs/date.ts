import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'

dayjs.locale('pt-br')
dayjs.extend(customParseFormat)

dayjs.extend(utc)

export function startOfDay(date: string) {
	return dayjs(date).startOf('day').toDate()
}

export function endOfDay(date: string) {
	return dayjs(date).endOf('day').toDate()
}

export function isSameDay(date1: string, date2: string) {
	return dayjs(date1).isSame(dayjs(date2), 'day')
}

export { dayjs }
