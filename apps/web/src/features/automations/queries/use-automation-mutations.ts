import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backend } from '@web/services/backend-api'
import { toast } from 'sonner'
import type { CreateAutomationRequest, UpdateAutomationRequest } from '../types'

export function useCreateAutomation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: CreateAutomationRequest) => {
			return backend.api.v1.automations.post(data)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['automations'] })
			toast.success('Automation created successfully')
		},
		onError: () => {
			toast.error('Failed to create automation')
		}
	})
}

export function useUpdateAutomation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: UpdateAutomationRequest) => {
			return backend.api.v1.automations({ id: data.id }).put(data)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['automations'] })
			toast.success('Automation updated successfully')
		},
		onError: () => {
			toast.error('Failed to update automation')
		}
	})
}

export function useDeleteAutomation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => {
			return backend.api.v1.automations({ id }).delete()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['automations'] })
			toast.success('Automation deleted successfully')
		},
		onError: () => {
			toast.error('Failed to delete automation')
		}
	})
}
