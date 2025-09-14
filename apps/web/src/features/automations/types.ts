export interface Automation {
	id: string
	name: string
	type: string
	platform: 'LINKEDIN' | 'FACEBOOK'
	description: string
	example: string
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

export interface CreateAutomationRequest {
	name: string
	type: string
	platform: 'LINKEDIN' | 'FACEBOOK'
	description: string
	example: string
}

export interface UpdateAutomationRequest extends CreateAutomationRequest {
	id: string
	isActive?: boolean
}