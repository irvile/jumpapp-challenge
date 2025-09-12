import { treaty } from '@elysiajs/eden'
import { app } from '../app'
import { envs } from './envs'

export const apiTest = treaty(app)

class TestFactory {
	async cleanDatabase() {
		if (envs.NODE_ENV !== 'production') {
		}
	}
}

export const testFactory = new TestFactory()
