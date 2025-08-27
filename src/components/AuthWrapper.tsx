import AuthLeftImage from '../../public/images/auth-left.png';
import Logo from '../../public/images/logo.png';

export const AuthWrapper = ({ children, ...props }) => {
	return (
		<div {...props}>
			<div className="lg:hidden p-3 sticky top-0 bg-background z-10">
				<img src={Logo} alt="Logo" className="" />
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
