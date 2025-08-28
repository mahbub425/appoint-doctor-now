import { useNavigate } from 'react-router-dom';
import AuthLeftImage from '../../public/images/auth-left.png';

export const AuthWrapper = ({ children, ...props }) => {
	const navigate = useNavigate();

	return (
		<div {...props}>
			<div className="p-3 sticky lg:fixed top-0 lg:m-14 bg-background lg:bg-transparent z-10">
				<img
					src="/images/logo.png"
					alt="Logo"
					onClick={() => navigate('/')}
					className="cursor-pointer h-8 lg:h-11"
				/>
			</div>

			<div className="lg:min-h-screen flex items-center justify-center bg-background px-3 py-6 lg:p-0 lg:bg-[#252D39] lg:grid grid-cols-2">
				<img
					src={AuthLeftImage}
					alt="Auth left image"
					className="h-full max-h-dvh w-full object-cover object-left-top hidden lg:block"
				/>
				{children}
			</div>
		</div>
	);
};
