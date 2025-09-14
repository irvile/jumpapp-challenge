import { zodResolver } from '@hookform/resolvers/zod'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@web/components/ui/alert-dialog'
import { Button } from '@web/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@web/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@web/components/ui/form'
import { Input } from '@web/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@web/components/ui/select'
import { Textarea } from '@web/components/ui/textarea'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateAutomation, useDeleteAutomation, useUpdateAutomation } from '../queries/use-automation-mutations'
import type { AutomationListItem } from '../queries/use-automations'

const automationSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	type: z.string().min(1, 'Type is required'),
	platform: z.enum(['LINKEDIN', 'FACEBOOK']),
	description: z.string().min(1, 'Description is required'),
	example: z.string().min(1, 'Example is required')
})

type AutomationFormData = z.infer<typeof automationSchema>

interface AutomationDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	automation?: AutomationListItem | null
}

export function AutomationDialog({ open, onOpenChange, automation }: AutomationDialogProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const createAutomation = useCreateAutomation()
	const updateAutomation = useUpdateAutomation()
	const deleteAutomation = useDeleteAutomation()

	const isEditing = !!automation

	const form = useForm<AutomationFormData>({
		resolver: zodResolver(automationSchema),
		defaultValues: {
			name: automation?.name || '',
			type: automation?.type || 'GENERATE_POST',
			platform: automation?.platform || 'LINKEDIN',
			description: automation?.description || '',
			example: automation?.example || ''
		}
	})

	const onSubmit = async (data: AutomationFormData) => {
		try {
			if (isEditing && automation) {
				await updateAutomation.mutateAsync({
					id: automation.id,
					...data
				})
			} else {
				await createAutomation.mutateAsync(data)
			}
			onOpenChange(false)
			form.reset({
				name: '',
				type: 'Generate Post',
				platform: 'LINKEDIN',
				description: '',
				example: ''
			})
		} catch (error) {
			console.error('Failed to save automation:', error)
		}
	}

	const handleDelete = async () => {
		if (!automation) return

		try {
			await deleteAutomation.mutateAsync(automation.id)
			setShowDeleteDialog(false)
			onOpenChange(false)
		} catch (error) {
			console.error('Failed to delete automation:', error)
		}
	}

	const handleCancel = () => {
		onOpenChange(false)
		form.reset({
			name: '',
			type: 'GENERATE_POST',
			platform: 'LINKEDIN',
			description: '',
			example: ''
		})
	}

	const isLoading = createAutomation.isPending || updateAutomation.isPending || deleteAutomation.isPending

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit Automation' : 'Create Automation'}</DialogTitle>
					<DialogDescription>
						{isEditing
							? 'Update your automation configuration'
							: 'Configure how content will be generated from your meetings'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="My LinkedIn Automation" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Type</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select automation type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="GENERATE_POST">Generate Post</SelectItem>
											<SelectItem value="GENERATE_SUMMARY">Generate Summary</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="platform"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Platform</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select platform" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="LINKEDIN">LinkedIn</SelectItem>
											<SelectItem value="FACEBOOK">Facebook</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Describe how this automation should work..."
											className="resize-none"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="example"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Example</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Provide an example of the expected output..."
											className="resize-none"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-between pt-4">
							<div>
								{isEditing && (
									<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
										<AlertDialogTrigger asChild>
											<Button type="button" variant="destructive" disabled={isLoading}>
												Delete
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete Automation</AlertDialogTitle>
												<AlertDialogDescription>
													Are you sure you want to delete "{automation?.name}"? This action cannot be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={handleDelete}
													disabled={isLoading}
													className="bg-destructive text-white hover:bg-destructive/80 "
												>
													{deleteAutomation.isPending ? 'Deleting...' : 'Delete'}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
							<div className="flex gap-2">
								<Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
									Cancel
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? 'Saving...' : 'Save'}
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
