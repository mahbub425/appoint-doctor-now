import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Calendar,
	Clock,
	MapPin,
	Check,
	ArrowDown10,
	HeartPulse,
	UserPlus,
} from "lucide-react";
import { useEffect } from "react";

interface AppointmentData {
	id: string;
	name: string;
	pin: number;
	appointment_date: string;
	appointment_time: string;
	serial_number: number;
	reason: string;
	doctor_name?: string;
	doctor?: { name: string };
	location: string;
}

interface AppointmentDetailsCardProps {
	appointmentData: AppointmentData;
	onViewMyAppointments?: () => void;
	onFindAnotherDoctor?: () => void;
	title?: string;
	description?: string;
}

export const AppointmentDetailsCard = ({
	appointmentData,
	onViewMyAppointments,
	onFindAnotherDoctor,
	title = "Appointment Confirmed",
	description = "Your appointment has been successfully booked",
}: AppointmentDetailsCardProps) => {
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-GB");
	};

	const doctorName =
		appointmentData.doctor_name || appointmentData.doctor?.name || "Unknown";

	return (
		<Card className="max-w-3xl mx-auto">
			<CardHeader>
				{/* Success Header */}
				<div className="text-center space-y-4">
					<div className="size-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
						<Check className="size-6" />
					</div>
					<div>
						<CardTitle className="text-2xl font-semibold text-gray-800 mb-2">
							{title}
						</CardTitle>
						<CardDescription className="text-gray-500">
							{description}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-6 space-y-6">
				{/* Details Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
					{/* Serial Number */}
					<div className="flex items-start gap-3">
						<div className="size-10 content-center text-center border rounded-md">
							<ArrowDown10 className="size-4 text-primary mx-auto" />
						</div>
						<div>
							<p className="text-gray-500 mb-0.5">Serial No.</p>
							<p className="font-semibold">
								#{appointmentData.serial_number.toString().padStart(2, "0")}
							</p>
						</div>
					</div>

					{/* Reason */}
					<div className="flex items-start gap-3">
						<div className="size-10 content-center text-center border rounded-md">
							<HeartPulse className="size-4 text-primary mx-auto" />
						</div>
						<div>
							<p className="text-gray-500 mb-0.5">Reason</p>
							<p className="font-semibold">{appointmentData.reason}</p>
						</div>
					</div>

					{/* Time */}
					<div className="flex items-start gap-3">
						<div className="size-10 content-center text-center rounded-md border">
							<Clock className="size-4 text-primary mx-auto" />
						</div>
						<div>
							<p className="text-gray-500 mb-0.5">Time</p>
							<p className="font-semibold">
								{appointmentData.appointment_time}
							</p>
						</div>
					</div>

					{/* Doctor */}
					<div className="flex items-start gap-3">
						<div className="size-10 content-center text-center border rounded-md">
							<UserPlus className="size-4 text-primary mx-auto" />
						</div>
						<div>
							<p className="text-gray-500 mb-0.5">Doctor</p>
							<p className="font-semibold">{doctorName}</p>
						</div>
					</div>

					{/* Date */}
					<div className="flex items-start gap-3">
						<div className="size-10 content-center text-center border rounded-md">
							<Calendar className="size-4 text-primary mx-auto" />
						</div>
						<div>
							<p className="text-gray-500 mb-0.5">Date</p>
							<p className="font-semibold">
								{formatDate(appointmentData.appointment_date)}
							</p>
						</div>
					</div>

					{/* Location */}
					<div className="flex items-start gap-3">
						<div className="size-10 content-center text-center rounded-md border">
							<MapPin className="size-4 text-primary mx-auto" />
						</div>
						<div>
							<p className="text-gray-500 mb-0.5">Location</p>
							<p className="font-semibold">{appointmentData.location}</p>
						</div>
					</div>
				</div>

				{/* Important Note */}
				<div className="bg-secondary text-primary border border-primary/15 rounded-lg p-4 flex gap-3">
					<div className="flex-shrink-0">
						<svg
							className="w-5 h-5 mt-0.5"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<div className="flex-1">
						<p className="font-semibold text-sm mb-1">Important Note</p>
						<p className="text-sm">
							Please arrive 15 minutes before your scheduled time. Bring your
							identification and any relevant medical documents.
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-3 pt-2">
					<Button
						variant="outline"
						onClick={onViewMyAppointments}
						className="flex-1 min-h-12 border-primary text-primary"
					>
						View My Appointments
					</Button>
					<Button
						onClick={onFindAnotherDoctor}
						className="flex-1 min-h-12 text-base font-medium"
					>
						Find Another Doctor
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default function AppointmentDetails() {
	const location = useLocation();
	const navigate = useNavigate();
	const appointmentData = location.state?.appointmentData as AppointmentData;

	useEffect(() => {
		if (!appointmentData) {
			navigate("/user");
		}
	}, [appointmentData, navigate]);

	if (!appointmentData) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<AppointmentDetailsCard
						appointmentData={appointmentData}
						onViewMyAppointments={() =>
							navigate("/user", { state: { activeTab: "appointments" } })
						}
						onFindAnotherDoctor={() => navigate("/user")}
					/>
				</div>
			</div>
		</div>
	);
}
