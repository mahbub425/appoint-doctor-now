import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthWrapper } from '../AuthWrapper';

// Removed AdminLoginProps interface as onLoginSuccess is no longer passed
// interface AdminLoginProps {
//   onLoginSuccess: (adminData: { id: string; name: string; role: string }) => void;
// }

export const AdminLogin = () => {
	// Removed onLoginSuccess from props
	const [credentials, setCredentials] = useState({
		username: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [rememberAdmin, setRememberAdmin] = useState(false);
	const { toast } = useToast();
	const { refreshAuth } = useAuth();

	useEffect(() => {
		const rememberedAdminCredentials = localStorage.getItem(
			'adminRememberedCredentials',
		);
		if (rememberedAdminCredentials) {
			try {
				const adminCreds = JSON.parse(rememberedAdminCredentials);
				setCredentials({
					username: adminCreds.username || '',
					password: adminCreds.password || '',
				});
				setRememberAdmin(true);
			} catch (error) {
				console.error('Error parsing remembered admin credentials:', error);
				localStorage.removeItem('adminRememberedCredentials');
			}
		}
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			const trimmedUsername = credentials.username.trim();
			const trimmedPassword = credentials.password.trim();

			const { data, error } = await supabase.rpc('authenticate_admin', {
				admin_username: trimmedUsername,
				admin_password: trimmedPassword,
			});

			if (error) {
				console.error('Authentication error:', error);
				setError(
					'Authentication failed. Please try again. Details: ' + error.message,
				);
				setIsSubmitting(false);
				return;
			}

			if (data && data.length > 0) {
				const adminUser = data[0];
				localStorage.setItem(
					'adminSession',
					JSON.stringify({
						authenticated: true,
						adminId: adminUser.user_id,
						adminName: adminUser.user_name,
						adminRole: adminUser.user_role,
					}),
				);

				if (rememberAdmin) {
					localStorage.setItem(
						'adminRememberedCredentials',
						JSON.stringify({
							username: trimmedUsername,
							password: trimmedPassword,
							timestamp: Date.now(),
						}),
					);
				} else {
					localStorage.removeItem('adminRememberedCredentials');
				}

				toast({
					title: 'Login Successful',
					description: `Welcome back, ${adminUser.user_name}!`,
				});

				// Only call refreshAuth, let AuthContext and Index.tsx handle navigation
				await refreshAuth();
				// onLoginSuccess is removed
			} else {
				setError(
					"Invalid credentials or you don't have admin access. Please check your username, password, and ensure your account has the 'admin' role and is not blocked.",
				);
			}
		} catch (err: any) {
			console.error('Login error:', err);
			setError('Login failed. An unexpected error occurred: ' + err.message);
		}

		setIsSubmitting(false);
	};

	return (
		<AuthWrapper>
			<Card className="w-full max-w-md mx-auto lg:px-1 rounded-[16px]">
				<CardHeader className="text-center">
					<CardTitle className="flex items-center justify-center gap-2">
						Admin Portal
					</CardTitle>
					<CardDescription>Sign in to manage the system</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								type="text"
								value={credentials.username}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										username: e.target.value,
									}))
								}
								placeholder="Enter your username"
								className="min-h-11 rounded-sm"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={credentials.password}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										password: e.target.value,
									}))
								}
								placeholder="Enter your password"
								className="min-h-11 rounded-sm"
								required
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="rememberAdmin"
								checked={rememberAdmin}
								onCheckedChange={(checked) =>
									setRememberAdmin(checked as boolean)
								}
							/>
							<Label htmlFor="rememberAdmin" className="text-sm font-normal">
								Remember me
							</Label>
						</div>

						<Button
							type="submit"
							className="w-full min-h-11 rounded-md"
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Signing In...' : 'Sign In'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</AuthWrapper>
	);
};
