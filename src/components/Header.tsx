import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { NotificationIcon } from '@/components/NotificationIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

export const Header = () => {
	const navigate = useNavigate();
	const { userProfile, doctorProfile, adminProfile, signOut } = useAuth();

	// Check if any user type is logged in
	const isLoggedIn = !!(userProfile || doctorProfile || adminProfile);

	// Get initials from name (first letter of first two words)
	const getInitials = (name: string | undefined) => {
		if (!name) return '';
		const words = name.trim().split(' ');
		const firstTwo = words.slice(0, 2);
		return firstTwo.map((word) => word[0]?.toUpperCase()).join('');
	};

	const handleLogout = async () => {
		try {
			await signOut();
			toast({
				title: 'Success',
				description: 'You have been logged out successfully',
			});
			navigate('/');
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to logout',
				variant: 'destructive',
			});
		}
	};

	return (
		<header className="bg-background border-b border-border">
			<div className="container mx-auto px-4 py-3 md:py-4 sm:py-4">
				<div className="flex justify-between items-start sm:items-center gap-4 sm:gap-6">
					{/* Left Section */}
					<img
						src="/images/logo.png"
						alt="Logo"
						onClick={() => navigate('/')}
						className="cursor-pointer h-10"
					/>

					{/* Right Section */}
					<div className="flex items-center w-max sm:w-auto">
						{isLoggedIn ? (
							<div className="flex items-center gap-4">
								<NotificationIcon userType="user" />
								<Avatar className="size-10 p-0 bg-black text-white rounded-full content-center text-center">
									<AvatarImage
										src=""
										alt="user icon"
										className="rounded-full"
									/>
									<AvatarFallback>
										{getInitials(
											userProfile?.name ||
												doctorProfile?.name ||
												adminProfile?.name,
										)}
									</AvatarFallback>
								</Avatar>
								<Button
									variant="secondary"
									onClick={handleLogout}
									className="min-w-20 h-10 px-3"
									size="sm"
								>
									Logout
								</Button>
							</div>
						) : (
							<Button
								onClick={() => navigate('/auth')}
								className="min-w-20 h-10 px-3 "
								size="sm"
							>
								Login
							</Button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};
