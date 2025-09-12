import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')
dayjs.extend(customParseFormat)

export function formatDateISOString(date: string, formatDate: string) {
	const dateParsed = dayjs(date)
	return dateParsed.format(formatDate)
}

export { dayjs }
