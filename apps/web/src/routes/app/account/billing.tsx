import { createFileRoute } from '@tanstack/react-router'
import { BillingPage } from '@web/features/billing/billing-page'

export const Route = createFileRoute('/app/account/billing')({
	component: BillingPage
})