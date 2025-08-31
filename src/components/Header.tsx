import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
	const navigate = useNavigate();

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
						<Button
							onClick={() => navigate('/auth')}
							className="px-4 pt-2 pb-3 sm:px-6 w-full sm:w-auto text-sm sm:text-base"
							size="sm"
						>
							Login
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
};
