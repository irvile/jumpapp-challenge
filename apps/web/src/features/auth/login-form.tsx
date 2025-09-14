import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { Button } from '@web/components/ui/button'
import { Card, CardContent } from '@web/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@web/components/ui/form'
import { Input } from '@web/components/ui/input'
import { authClient } from '@web/libs/auth'
import { envs } from '@web/libs/envs'
import { cn } from '@web/libs/utils'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const GoogleIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M18.64 10.2046C18.64 9.56637 18.5827 8.95274 18.4764 8.36365H10V11.845H14.8436C14.635 12.97 14.0009 13.9232 13.0477 14.5614V16.8196H15.9564C17.6582 15.2527 18.64 12.9455 18.64 10.2046Z"
			fill="#4285F4"
		/>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M10 19C12.43 19 14.4673 18.1941 15.9564 16.8195L13.0477 14.5614C12.2418 15.1014 11.2109 15.4204 10 15.4204C7.65591 15.4204 5.67182 13.8373 4.96409 11.71H1.95728V14.0418C3.43818 16.9832 6.48182 19 10 19Z"
			fill="#34A853"
		/>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M4.96409 11.71C4.78409 11.17 4.68182 10.5932 4.68182 10C4.68182 9.40683 4.78409 8.83001 4.96409 8.29001V5.95819H1.95727C1.34773 7.17319 1 8.54774 1 10C1 11.4523 1.34773 12.8268 1.95727 14.0418L4.96409 11.71Z"
			fill="#FBBC05"
		/>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M10 4.57955C11.3214 4.57955 12.5077 5.03364 13.4405 5.92545L16.0218 3.34409C14.4632 1.89182 12.4259 1 10 1C6.48182 1 3.43818 3.01682 1.95728 5.95818L4.96409 8.29C5.67182 6.16273 7.65591 4.57955 10 4.57955Z"
			fill="#EA4335"
		/>
	</svg>
)

const formSchema = z.object({
	email: z.string({ error: 'Required' }).min(1, { message: 'Required' }).email({
		message: 'Invalid email'
	}),
	password: z.string({ error: 'Required' }).min(1, 'Required')
})

type LoginFormValues = z.infer<typeof formSchema>

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
	const form = useForm<LoginFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: ''
		}
	})

	const handleGoogleSignIn = async () => {
		const signInResponse = await authClient.signIn.social({
			provider: 'google',
			scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
			callbackURL: `${envs.VITE_PUBLIC_APP_URL}/app/meetings`
		})

		if (signInResponse.error) {
			toast.error('Error to sign in with Google')
			return
		}

		console.log(signInResponse)
	}

	const onSubmit = async (data: LoginFormValues) => {
		const signInResponse = await authClient.signIn.email({
			email: data.email,
			password: data.password,
			rememberMe: true,
			callbackURL: `${envs.VITE_PUBLIC_APP_URL}/app/meetings`
		})

		if (signInResponse.error) {
			form.setError('email', { message: 'Email or password is invalid' })
			toast.error('Email or password is invalid')
			return
		}
	}

	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
							<div className="flex flex-col gap-6">
								<div className="flex flex-col items-center text-center">
									<h1 className="text-2xl font-bold">Log in to MeetPost AI</h1>
									<p className="text-muted-foreground text-balance">Access your account</p>
								</div>

								<Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
									<GoogleIcon />
									Sign in with Google
								</Button>

								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
									</div>
								</div>

								<div className="grid gap-2">
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input placeholder="ada@email.com" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid gap-2">
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input type="password" placeholder="Enter your password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<Button type="submit" className="w-full">
									Continue with Email
								</Button>

								<div className="text-center text-sm">
									Don't have an account?{' '}
									<Link to="/register" className="underline underline-offset-4 cursor-pointer hover:text-primary">
										Register
									</Link>
								</div>
							</div>
						</form>
					</Form>
					<div className="bg-muted relative hidden md:block">
						<img
							src="/static/img/login-hero.jpeg"
							alt="Imagem"
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
				</CardContent>
			</Card>
			<div className="text-muted-foreground text-center text-xs text-balance">
				By continuing, you agree to our{' '}
				<span className="underline underline-offset-4 hover:text-primary cursor-pointer">Terms of Service</span> and{' '}
				<span className="underline underline-offset-4 hover:text-primary cursor-pointer">Privacy Policy</span>.
			</div>
		</div>
	)
}
