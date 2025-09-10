import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthWrapper = ({ children, ...props }) => {
	const navigate = useNavigate();
	const [imageError, setImageError] = React.useState(false);

	// Use wrong path intentionally for testing - change to '/images/auth-left-image.png' for correct path
	const authLeftImagePath = '/images/auth-left-image.png';

	return (
		<div {...props}>
			<div className="p-3 sticky lg:fixed top-0 lg:m-10 bg-background lg:bg-transparent z-10">
				<img
					src="/images/logo.png"
					alt="Logo"
					onClick={() => navigate('/')}
					className="cursor-pointer h-8 lg:h-11"
				/>
			</div>

			<div
				className={`lg:min-h-screen flex items-center justify-center bg-background px-3 py-6 lg:p-0 lg:bg-[#252D39] ${
					imageError ? '' : 'lg:grid grid-cols-2'
				}`}
			>
				{!imageError && (
					<img
						src={authLeftImagePath}
						alt="Auth left image"
						className="h-full max-h-dvh w-full object-cover object-left-top hidden lg:block"
						onError={() => setImageError(true)}
					/>
				)}
				{children}
			</div>
		</div>
	);
};
