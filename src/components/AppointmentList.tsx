import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, User } from 'lucide-react';
import { Appointment } from '@/types/appointment';
import { StorageManager } from '@/utils/storage';

interface AppointmentListProps {
  refreshTrigger: number;
}

export function AppointmentList({ refreshTrigger }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadAppointments = async () => {
      const allAppointments = await StorageManager.getAppointments();
      const todayAppointments = allAppointments
        .filter(apt => apt.date === today && !apt.isAbsent)
        .sort((a, b) => a.serial - b.serial);
      setAppointments(todayAppointments);
    };

    loadAppointments();
  }, [refreshTrigger, today]);

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
        <CardDescription>
          Scheduled appointments for {new Date(today).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg medical-transition hover:bg-muted/50"
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
              </div>
            </div>
          ))}
        </div>
        
        {appointments.length >= 17 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive font-medium">
              Daily limit reached. For emergencies, please contact: 01708166012
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}