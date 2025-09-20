import Stripe from 'stripe'
import { envs } from './envs'

export const stripe = new Stripe(envs.STRIPE_SECRET_KEY, {
	apiVersion: '2025-08-27.basil'
})