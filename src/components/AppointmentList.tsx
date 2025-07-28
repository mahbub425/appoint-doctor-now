import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, User } from 'lucide-react';
import { Appointment } from '@/types/appointment';
import { StorageManager } from '@/utils/storage';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AppointmentListProps {
  refreshTrigger: number;
}

export function AppointmentList({ refreshTrigger }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; appointmentId: string | null }>({ open: false, appointmentId: null });
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date();

  useEffect(() => {
    const loadAppointments = async () => {
      const allAppointments = await StorageManager.getAppointments();
      const todayAppointments = allAppointments
        .filter(apt => apt.date === today && !apt.isAbsent)
        .map(apt => {
          const appointmentTime = new Date(`${apt.date}T${apt.time}`);
          if (appointmentTime < currentTime) {
            return { ...apt, isCompleted: true };
          }
          return apt;
        })
        .sort((a, b) => a.serial - b.serial);
      setAppointments(todayAppointments);
    };

    loadAppointments();
  }, [refreshTrigger, today]);

  const handleCancel = async (appointmentId: string) => {
    // Call backend API to cancel the appointment
    await StorageManager.cancelAppointment(appointmentId);
    setCancelDialog({ open: false, appointmentId: null });
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
  };

  if (appointments.length === 0) {
    return (
      <Card className="medical-card">
        <CardHeader className="text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle>No Appointments Today</CardTitle>
          <CardDescription>No appointments have been scheduled for today yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary" />
          <span>Today's Appointments</span>
          <Badge variant="secondary" className="ml-auto">
            {appointments.length}/17
          </Badge>
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span>Scheduled appointments for {new Date(today).toLocaleDateString()}</span>
          <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full shadow-md">
            Current Serial: {appointments.find(apt => !apt.isCompleted)?.serial || 'N/A'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const appointmentTime = new Date(`${appointment.date}T${appointment.time}`);
            const isCurrent = appointmentTime <= currentTime && currentTime < new Date(appointmentTime.getTime() + 10 * 60000); // Assuming 10 minutes per appointment

            return (
              <div
                key={appointment.id}
                className={`flex items-center justify-between p-4 border border-border rounded-lg medical-transition hover:bg-muted/50 ${
                  isCurrent ? 'bg-primary/10' : appointment.isCompleted ? 'bg-green-100' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full font-semibold">
                    {appointment.serial}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{appointment.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{appointment.concern}</span>
                      <span>•</span>
                      <span>{appointment.reason}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{appointment.time}</span>
                  {!appointment.isCompleted && !isCurrent && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCancelDialog({ open: true, appointmentId: appointment.id })}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {appointments.length >= 17 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive font-medium">
              Daily limit reached. For emergencies, please contact: 01708166012
            </p>
          </div>
        )}
      </CardContent>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, appointmentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>আপনি কি আপনার বুকিং ক্যানসেল করতে চান?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => handleCancel(cancelDialog.appointmentId!)}
            >
              Yes
            </Button>
            <Button variant="secondary" onClick={() => setCancelDialog({ open: false, appointmentId: null })}>
              No
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}