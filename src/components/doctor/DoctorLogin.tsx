import { useEffect, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthWrapper } from '../AuthWrapper';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';

type AuthenticatedDoctor =
	Database['public']['Functions']['authenticate_doctor']['Returns'][number];

export const DoctorLogin = () => {
	const [credentials, setCredentials] = useState({
		username: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();
	const { refreshAuth } = useAuth();
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [rememberPassword, setRememberPassword] = useState(false);

	// Load remembered credentials on component mount
	useEffect(() => {
		const rememberedCredentials = localStorage.getItem('rememberedCredentials');
		if (rememberedCredentials) {
			try {
				const credentials = JSON.parse(rememberedCredentials);
				setCredentials((prev) => ({
					...prev,
					pin: credentials.pin || '',
					password: credentials.password || '',
				}));
				setRememberPassword(true);
			} catch (error) {
				console.error('Error parsing remembered credentials:', error);
				localStorage.removeItem('rememberedCredentials');
			}
		}
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			console.log(
				'Attempting doctor login with username:',
				credentials.username,
			);

			const { data, error: rpcError } = await supabase.rpc(
				'authenticate_doctor',
				{
					doctor_username: credentials.username,
					doctor_password: credentials.password,
				},
			);

			const doctors: AuthenticatedDoctor[] | null = data as
				| AuthenticatedDoctor[]
				| null;

			if (rpcError) {
				console.error('RPC authentication error:', rpcError);
				throw rpcError;
			}

			console.log('Authenticated doctor data from RPC:', doctors);

			if (!doctors || doctors.length === 0) {
				setError('Invalid username or password, or your account is inactive.');
				setIsSubmitting(false);
				return;
			}

			const doctor = doctors[0];

			localStorage.setItem(
				'doctorSession',
				JSON.stringify({
					id: doctor.id,
					username: doctor.username,
					name: doctor.name,
					degree: doctor.degree,
					experience: doctor.experience,
					designation: doctor.designation,
					specialties: doctor.specialties,
					is_active: doctor.is_active,
					created_at: doctor.created_at,
					updated_at: doctor.updated_at,
				}),
			);

			toast({
				title: 'Login Successful',
				description: `Welcome, Dr. ${doctor.name}`,
			});

			// Refresh auth context and let AuthContext/DoctorLogin.tsx's useEffect handle navigation
			await refreshAuth();
		} catch (error: any) {
			console.error('Login error:', error);
			setError('Login failed. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AuthWrapper>
			<Card className="w-full max-w-md mx-auto lg:px-1 rounded-[16px]">
				<CardHeader className="text-center">
					<CardTitle className="flex items-center justify-center gap-2 md:text-xl">
						Doctor Portal
					</CardTitle>
					<CardDescription>Enter your credentials to sign in</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="username">User Name</Label>
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
								className="min-h-11 rounded-sm"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={credentials.password}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											password: e.target.value,
										}))
									}
									className="min-h-11 rounded-sm"
									required
								/>

								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="rememberPassword"
								checked={rememberPassword}
								onCheckedChange={(checked) =>
									setRememberPassword(checked as boolean)
								}
							/>
							<Label
								htmlFor="rememberPassword"
								className="text-sm cursor- font-normal"
							>
								Remember password
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
