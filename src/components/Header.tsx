import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const Header = () => {
	const navigate = useNavigate();
	const { userProfile, doctorProfile, adminProfile, signOut } = useAuth();

	// Check if any user type is logged in
	const isLoggedIn = !!(userProfile || doctorProfile || adminProfile);

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
		<header className="bg-background border-b border-border shadow-sm">
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
					<div className="flex w-max sm:w-auto">
						{isLoggedIn ? (
							<Button
								onClick={handleLogout}
								className="min-w-20 h-10 px-3 bg-primary/10 text-primary hover:text-white"
								size="sm"
							>
								Logout
							</Button>
						) : (
							<Button onClick={() => navigate('/auth')} className="min-w-20 h-10 px-3 " size="sm">
								Login
							</Button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};
