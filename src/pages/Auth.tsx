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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthWrapper } from '@/components/AuthWrapper';

const Auth = () => {
	const [isSignUp, setIsSignUp] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		pin: '',
		concern: '',
		phone: '',
		password: '',
		confirmPassword: '',
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [rememberPassword, setRememberPassword] = useState(false);
	const [wrongPasswordError, setWrongPasswordError] = useState(false);

	const { pinSignUp, pinSignIn, user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (user) {
			navigate('/');
		}
	}, [user, navigate]);

	// Load remembered credentials on component mount
	useEffect(() => {
		const rememberedCredentials = localStorage.getItem('rememberedCredentials');
		if (rememberedCredentials) {
			try {
				const credentials = JSON.parse(rememberedCredentials);
				setFormData((prev) => ({
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

	const handleSubmit = async () => {
		setWrongPasswordError(false);

		if (isSignUp) {
			if (
				!formData.name ||
				!formData.pin ||
				!formData.concern ||
				!formData.phone ||
				!formData.password ||
				!formData.confirmPassword
			) {
				toast({
					title: 'Error',
					description: 'All fields are required for registration',
					variant: 'destructive',
				});
				return;
			}

			// Validate phone number format
			const phoneRegex = /^[0-9]{11}$/;
			if (!phoneRegex.test(formData.phone)) {
				toast({
					title: 'Error',
					description: 'Please enter a valid 11-digit phone number',
					variant: 'destructive',
				});
				return;
			}

			// Validate password confirmation
			if (formData.password !== formData.confirmPassword) {
				toast({
					title: 'Error',
					description: 'Passwords do not match',
					variant: 'destructive',
				});
				return;
			}

			// Validate password length
			if (formData.password.length < 6) {
				toast({
					title: 'Error',
					description: 'Password must be at least 6 characters long',
					variant: 'destructive',
				});
				return;
			}
		} else {
			if (!formData.pin || !formData.password) {
				toast({
					title: 'Error',
					description: 'PIN and Password are required',
					variant: 'destructive',
				});
				return;
			}
		}

		setLoading(true);

		try {
			if (isSignUp) {
				const { error } = await pinSignUp({
					name: formData.name,
					pin: formData.pin,
					concern: formData.concern,
					phone: formData.phone,
					password: formData.password,
				});

				if (error) {
					if (error.message.includes('PIN already exists')) {
						toast({
							title: 'Error',
							description: 'PIN already exists. Please choose a different PIN.',
							variant: 'destructive',
						});
					} else {
						toast({
							title: 'Error',
							description: error.message,
							variant: 'destructive',
						});
					}
				} else {
					toast({
						title: 'Success',
						description: 'Account created successfully!',
					});
					setIsSignUp(false);
				}
			} else {
				const { error } = await pinSignIn(
					formData.pin,
					formData.password,
					rememberPassword,
				);

				if (error) {
					if (error.message.includes('Invalid PIN or password')) {
						setWrongPasswordError(true);
					} else {
						toast({
							title: 'Error',
							description: error.message || 'Invalid PIN or password',
							variant: 'destructive',
						});
					}
				} else {
					toast({
						title: 'Success',
						description: 'Signed in successfully!',
					});

					// Check if there's a pending appointment booking
					const intendedDoctorId = localStorage.getItem('selectedDoctorId');
					if (intendedDoctorId) {
						// If yes, redirect to the booking page
						navigate('/book-appointment');
					} else {
						// Otherwise, redirect to the user dashboard
						navigate('/user');
					}
				}
			}
		} catch (error) {
			toast({
				title: 'Error',
				description: 'An unexpected error occurred',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthWrapper>
			<Card className="w-full max-w-md mx-auto lg:px-1 rounded-[16px]">
				<CardHeader className="text-center">
					<CardTitle className="md:text-xl font-bold">
						{isSignUp ? 'Sign Up' : 'Sign In'}
					</CardTitle>
					<CardDescription>
						{isSignUp
							? 'Create a new account to book appointments'
							: 'Sign in to your account'}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{isSignUp && (
						<>
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="Enter your full name"
									className="min-h-11 rounded-sm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="pin">PIN</Label>
								<Input
									id="pin"
									value={formData.pin}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, pin: e.target.value }))
									}
									placeholder="Enter a unique PIN"
									className="min-h-11 rounded-sm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="concern">Concern</Label>
								<Select
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, concern: value }))
									}
								>
									<SelectTrigger className="min-h-11 rounded-sm">
										<SelectValue placeholder="Select your concern" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="OnnoRokom Group">
											OnnoRokom Group
										</SelectItem>
										<SelectItem value="OnnoRokom Projukti Limited">
											OnnoRokom Projukti Limited
										</SelectItem>
										<SelectItem value="Udvash-Unmesh-Uttoron">
											Udvash-Unmesh-Uttoron
										</SelectItem>
										<SelectItem value="OnnoRorkom Electronics Co. Ltd.">
											OnnoRorkom Electronics Co. Ltd.
										</SelectItem>
										<SelectItem value="OnnoRokom Solutions Ltd.">
											OnnoRokom Solutions Ltd.
										</SelectItem>
										<SelectItem value="Pi Labs Bangladesh Ltd.">
											Pi Labs Bangladesh Ltd.
										</SelectItem>
										<SelectItem value="OnnoRokom EdTech Ltd.">
											OnnoRokom EdTech Ltd.
										</SelectItem>
										<SelectItem value="Techshop Bangladesh">
											Techshop Bangladesh
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									value={formData.phone}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											phone: e.target.value,
										}))
									}
									placeholder="Enter 11-digit phone number"
									className="min-h-11 rounded-sm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? 'text' : 'password'}
										value={formData.password}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												password: e.target.value,
											}))
										}
										placeholder="Enter password (min 6 characters)"
										className="min-h-11 rounded-sm"
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

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<div className="relative">
									<Input
										id="confirmPassword"
										type={showConfirmPassword ? 'text' : 'password'}
										value={formData.confirmPassword}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												confirmPassword: e.target.value,
											}))
										}
										placeholder="Confirm your password"
										className="min-h-11 rounded-sm"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									>
										{showConfirmPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
						</>
					)}

					{!isSignUp && (
						<>
							<div className="space-y-2">
								<Label htmlFor="pin">PIN</Label>
								<Input
									id="pin"
									value={formData.pin}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, pin: e.target.value }))
									}
									placeholder="Enter your PIN"
									className="min-h-11 rounded-sm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="loginPassword">Password</Label>
								<div className="relative">
									<Input
										id="loginPassword"
										type={showPassword ? 'text' : 'password'}
										value={formData.password}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												password: e.target.value,
											}))
										}
										placeholder="Enter your password"
										className="min-h-11 rounded-sm"
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
									className="text-sm cursor-pointer font-normal"
								>
									Remember password
								</Label>
							</div>
						</>
					)}

					<Button
						onClick={handleSubmit}
						disabled={loading}
						className="w-full min-h-11 rounded-md"
					>
						{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
					</Button>

					{wrongPasswordError && !isSignUp && (
						<div className="text-center text-sm text-red-600 bg-red-50 p-2 rounded">
							Forgot your password? please contact with Admin.
						</div>
					)}

					<div className="text-center font-semibold text-sm">
						{isSignUp ? 'Already have an account? ' : "Don't have an account? " }
						<Button
							variant="link"
							onClick={() => setIsSignUp(!isSignUp)}
							className="text-sm p-0"
						>
							{isSignUp ? 'Sign in' : 'Sign up'}
						</Button>
					</div>
				</CardContent>
			</Card>
		</AuthWrapper>
	);
};

export default Auth;