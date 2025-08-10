import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, MapPin, User, Hash, FileText } from "lucide-react";
import { useEffect } from "react";

interface AppointmentData {
  id: string;
  name: string;
  pin: number;
  appointment_date: string;
  appointment_time: string;
  serial_number: number;
  reason: string;
  doctor_name: string;
  location: string;
}

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/user")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Appointment Details
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg mb-8 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Appointment Confirmed!</h2>
              <p className="text-green-100">Your appointment has been successfully booked</p>
            </div>
          </div>

          {/* Appointment Details Card */}
          <Card className="shadow-xl border-2 border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <CardTitle className="text-2xl text-center text-primary">Appointment Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-lg text-blue-700 dark:text-blue-400">Date</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatDate(appointmentData.appointment_date)}</p>
                </div>

                <div className="bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-6 w-6 text-orange-600" />
                    <span className="font-bold text-lg text-orange-700 dark:text-orange-400">Expected Time</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appointmentData.appointment_time}</p>
                </div>
              </div>

              {/* Serial Number and Doctor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-3 mb-2">
                    <Hash className="h-6 w-6 text-purple-600" />
                    <span className="font-bold text-lg text-purple-700 dark:text-purple-400">Serial Number</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appointmentData.serial_number}</p>
                </div>

                <div className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 p-4 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-6 w-6 text-green-600" />
                    <span className="font-bold text-lg text-green-700 dark:text-green-400">Doctor</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{appointmentData.doctor_name}</p>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/10 p-6 rounded-lg border-l-4 border-red-500">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-7 w-7 text-red-600" />
                  <span className="font-bold text-2xl text-red-700 dark:text-red-400">Location</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{appointmentData.location}</p>
              </div>

              {/* Patient Details */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-700/10 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300 mb-3">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Name:</span>
                    <p className="font-semibold">{appointmentData.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">PIN:</span>
                    <p className="font-semibold">{appointmentData.pin}</p>
                  </div>
                </div>
              </div>

              {/* Reason for Visit */}
              <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-800/10 p-4 rounded-lg border-l-4 border-indigo-500">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  <span className="font-bold text-lg text-indigo-700 dark:text-indigo-400">Reason for Visit</span>
                </div>
                <p className="text-xl font-bold text-foreground">{appointmentData.reason}</p>
              </div>

              {/* Important Note */}
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">Important Note:</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please arrive 15 minutes before your scheduled time. Bring your identification and any relevant medical documents.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/user")}
                  className="flex-1 h-12 text-lg font-semibold"
                >
                  View My Appointments
                </Button>
                <Button 
                  onClick={() => navigate("/user")}
                  className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}