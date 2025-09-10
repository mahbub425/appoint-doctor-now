import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { UserNav } from '@/components/user/UserNav';
import { DoctorList } from '@/components/user/DoctorList';
import { UserAppointmentsList } from '@/components/user/UserAppointmentsList';
import { ProfileManagement } from '@/components/user/ProfileManagement';
import { MedicalHistory } from '@/components/user/MedicalHistory';
import { NotificationIcon } from '@/components/NotificationIcon';
import BookAppointment from '@/pages/BookAppointment';

type TabType = 'doctors' | 'appointments' | 'profile' | 'history' | 'book-appointment';

const UserDashboard = () => {
	const [activeTab, setActiveTab] = useState<TabType>('doctors');
	const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
	const { userProfile, signOut, loading } = useAuth(); // Get loading state from useAuth
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		// Check if activeTab is passed from navigation state
		if (location.state?.activeTab) {
			setActiveTab(location.state.activeTab);
		}
	}, [location.state]);

	// Effect to handle redirection based on loading and userProfile status
	useEffect(() => {
		if (!loading && !userProfile) {
			// If not loading and no user profile, redirect to auth page
			navigate('/auth');
		}
	}, [loading, userProfile, navigate]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	// If we reach here, it means loading is false and userProfile is available (due to the useEffect above)
	// So, userProfile will not be null here.

	const handleDoctorSelect = (doctorId: string) => {
		localStorage.setItem('selectedDoctorId', doctorId);
		setSelectedDoctorId(doctorId);
		setActiveTab('book-appointment');
	};

	const handleBackToDoctors = () => {
		setSelectedDoctorId(null);
		localStorage.removeItem('selectedDoctorId');
		setActiveTab('doctors');
	};

	const renderContent = () => {
		switch (activeTab) {
			case 'doctors':
				return <DoctorList onDoctorSelect={handleDoctorSelect} />;
			case 'appointments':
				return <UserAppointmentsList />;
			case 'profile':
				return <ProfileManagement />;
			case 'history':
				return <MedicalHistory />;
			case 'book-appointment':
				return selectedDoctorId ? (
					<BookAppointment 
						isInline={true} 
						onBack={handleBackToDoctors} 
					/>
				) : (
					<DoctorList onDoctorSelect={handleDoctorSelect} />
				);
			default:
				return <DoctorList onDoctorSelect={handleDoctorSelect} />;
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
				<div className="lg:col-span-1">
					<UserNav activeTab={activeTab} setActiveTab={setActiveTab} />
				</div>
				<div className="lg:col-span-3">{renderContent()}</div>
			</div>
		</div>
	);
};

export default UserDashboard;