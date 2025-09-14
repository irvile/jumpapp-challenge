import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web/components/ui/card'
import { Input } from '@web/components/ui/input'
import { Label } from '@web/components/ui/label'
import { Slider } from '@web/components/ui/slider'
import { useUpdateUserSettings, useUserSettings } from '@web/features/user-settings/queries/use-user-settings'
import { AlertCircle, Bot, BotIcon, Clock, RefreshCw, Save, User } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/app/setup/bot')({
	component: RouteComponent
})

function RouteComponent() {
	const { data: userSettings, isLoading } = useUserSettings()
	const updateSettings = useUpdateUserSettings()

	const [joinMinutesBefore, setJoinMinutesBefore] = useState(5)
	const [botName, setBotName] = useState('Meeting Assistant')
	const [hasChanges, setHasChanges] = useState(false)

	useEffect(() => {
		if (userSettings) {
			setJoinMinutesBefore(userSettings.joinMinutesBefore)
			setBotName(userSettings.botName)
		}
	}, [userSettings])

	useEffect(() => {
		if (userSettings) {
			const changed = joinMinutesBefore !== userSettings.joinMinutesBefore || botName !== userSettings.botName
			setHasChanges(changed)
		}
	}, [joinMinutesBefore, botName, userSettings])

	const handleSave = async () => {
		try {
			await updateSettings.mutateAsync({
				joinMinutesBefore,
				botName
			})
			setHasChanges(false)
		} catch (error) {
			console.error('Failed to save settings:', error)
		}
	}

	const handleReset = () => {
		if (userSettings) {
			setJoinMinutesBefore(userSettings.joinMinutesBefore)
			setBotName(userSettings.botName)
		}
	}

	const handleResetToDefaults = () => {
		setJoinMinutesBefore(5)
		setBotName('Meeting Assistant')
	}

	if (isLoading) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-6xl">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						<p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="bg-primary/10 p-2 rounded-lg">
						<BotIcon className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Bot Settings</h1>
						<p className="text-muted-foreground">Configure your meeting assistant behavior</p>
					</div>
				</div>
			</div>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bot className="h-5 w-5" />
							Bot Configuration
						</CardTitle>
						<CardDescription>Customize how your meeting bot behaves</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<div className="space-y-3">
								<Label className="flex items-center gap-2">
									<User className="h-4 w-4" />
									Bot Name
								</Label>
								<Input
									value={botName}
									onChange={(e) => setBotName(e.target.value)}
									placeholder="Enter bot name"
									maxLength={50}
									className="max-w-md"
								/>
								<p className="text-xs text-muted-foreground">This name will be displayed when the bot joins meetings</p>
							</div>

							<div className="space-y-3">
								<Label className="flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Join Meeting Before: {joinMinutesBefore} minute{joinMinutesBefore !== 1 ? 's' : ''}
								</Label>
								<div className="space-y-2">
									<Slider
										value={[joinMinutesBefore]}
										onValueChange={([value]) => setJoinMinutesBefore(value)}
										max={15}
										min={1}
										step={1}
										className="max-w-md"
									/>
									<div className="flex justify-between text-xs text-muted-foreground max-w-md">
										<span>1 min</span>
										<span>15 min</span>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									The bot will join the meeting this many minutes before the scheduled start time
								</p>
							</div>
						</div>

						<div className="border-t pt-6">
							<div className="flex items-center gap-3">
								<Button
									onClick={handleSave}
									disabled={!hasChanges || updateSettings.isPending}
									className="min-w-[100px]"
								>
									{updateSettings.isPending ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Saving...
										</>
									) : (
										<>
											<Save className="h-4 w-4 mr-2" />
											Save Changes
										</>
									)}
								</Button>

								{hasChanges && (
									<Button variant="outline" onClick={handleReset} disabled={updateSettings.isPending}>
										<RefreshCw className="h-4 w-4 mr-2" />
										Reset
									</Button>
								)}

								<Button variant="ghost" onClick={handleResetToDefaults} disabled={updateSettings.isPending}>
									Reset to Defaults
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Preview</CardTitle>
						<CardDescription>How your bot will appear in meetings</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="p-4 bg-muted/30 rounded-lg border">
							<div className="flex items-center gap-3 mb-3">
								<div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
									<Bot className="h-4 w-4 text-white" />
								</div>
								<div>
									<div className="font-medium">{botName}</div>
									<div className="text-xs text-muted-foreground">Joined the meeting</div>
								</div>
							</div>
							<div className="text-sm text-muted-foreground">
								Will join {joinMinutesBefore} minute{joinMinutesBefore !== 1 ? 's' : ''} before the meeting starts to
								ensure proper recording setup
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Important Information</CardTitle>
						<CardDescription>How your bot settings affect meeting behavior</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-blue-900 mb-1">Early Join Behavior</p>
									<p className="text-blue-700">
										The bot joins early to ensure proper audio setup and to avoid missing the beginning of important
										discussions.
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-green-900 mb-1">Bot Name Display</p>
									<p className="text-green-700">
										The bot name will be visible to all meeting participants when it joins the call.
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<p className="font-medium text-amber-900 mb-1">Recording Notice</p>
									<p className="text-amber-700">
										The bot will automatically announce its recording capabilities when joining meetings as required by
										platform policies.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
