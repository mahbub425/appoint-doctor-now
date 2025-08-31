import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';

export const Layout = () => {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
};