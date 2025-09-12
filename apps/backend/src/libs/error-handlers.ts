import { Prisma } from '@backend/libs/generated/prisma'
import { ResultAsync } from 'neverthrow'

class UserAlreadyExistsError extends Error {}
class DatabaseError extends Error {}

export function fromDatabasePromise<T>(promise: Promise<T>) {
	const result = ResultAsync.fromPromise<T, UserAlreadyExistsError | DatabaseError>(promise, (e) => {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return new UserAlreadyExistsError()
			}
		}

		return new DatabaseError()
	})

	return result
}
