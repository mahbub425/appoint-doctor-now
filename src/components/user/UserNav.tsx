import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { User, Calendar, FileText, Settings, LogOut } from 'lucide-react';

import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserNavProps {
	activeTab: string;
	setActiveTab: (
		tab: 'doctors' | 'appointments' | 'profile' | 'history',
	) => void;
}

export const UserNav = ({ activeTab, setActiveTab }: UserNavProps) => {
	const navItems = [
		{ id: 'doctors', label: 'Doctor List', icon: User },
		{ id: 'appointments', label: 'My Appointments', icon: Calendar },
		{ id: 'profile', label: 'Profile Management', icon: Settings },
		{ id: 'history', label: 'Medical History', icon: FileText },
	];

	const { signOut } = useAuth(); // Get loading state from useAuth
	const navigate = useNavigate();
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
		<Card className="border-0 md:border bg-transparent md:bg-card shadow-none md:shadow-sm">
			<CardContent className="p-0 md:p-4">
				<nav className="md:space-y-2">
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
							<Button
								key={item.id}
								variant={activeTab === item.id ? 'secondary' : 'ghost'}
								className="min-h-12 md:min-h-10 w-full justify-start text-base sm:text-sm"
								onClick={() => setActiveTab(item.id as any)}
							>
								<Icon className="mr-2 h-4 w-4" />
								{item.label}
							</Button>
						);
					})}

					<Button
						variant="ghost"
						onClick={handleLogout}
						className="md:hidden min-h-12 md:min-h-10 w-full justify-start text-base sm:text-sm"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Logout
					</Button>
				</nav>
			</CardContent>
		</Card>
	);
};
