import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Stethoscope, Shield, Calendar, Clock, Users } from 'lucide-react';
import { AppointmentForm } from '@/components/AppointmentForm';
import { AppointmentList } from '@/components/AppointmentList';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAppointmentBooked = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Doctor Appointment System</h1>
                <p className="text-sm text-muted-foreground">Company Employee Health Services</p>
              </div>
            </div>
            <Link to="/admin">
              <Button variant="outline" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Admin Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointment Booking Form */}
          <div>
            <AppointmentForm onAppointmentBooked={handleAppointmentBooked} />
          </div>

          {/* Appointment List */}
          <div>
            <AppointmentList refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-card border border-border rounded-lg medical-card">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
            <p className="text-sm text-muted-foreground">
              Book your doctor appointment with just a few clicks using your employee PIN
            </p>
          </div>
          
          <div className="text-center p-6 bg-card border border-border rounded-lg medical-card">
            <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Flexible Timing</h3>
            <p className="text-sm text-muted-foreground">
              Choose from Follow-up (7 min), New Patient (10 min), or Report Show (12 min)
            </p>
          </div>
          
          <div className="text-center p-6 bg-card border border-border rounded-lg medical-card">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fair Queue</h3>
            <p className="text-sm text-muted-foreground">
              Automatic serial assignment with daily limit of 17 appointments
            </p>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8 p-4 bg-destructive/10 border border-destructive rounded-lg text-center">
          <p className="text-sm font-medium text-destructive">
            For medical emergencies when daily limit is reached, please contact: 
            <a href="tel:01708166012" className="underline ml-1">01708166012</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
