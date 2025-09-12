import { PrismaClient } from '@backend/libs/generated/prisma'
import { testFactory } from '@backend/libs/test-utils'

const _prisma = new PrismaClient()

async function main() {
	await testFactory.cleanDatabase()
}

main()
	.then(() => {
		console.log('Database seeded successfully')
	})
	.catch((error) => {
		console.error(error)
	})
