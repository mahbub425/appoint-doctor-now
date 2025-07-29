import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DoctorSchedule {
  id: string;
  availability_date: string;
  start_time: string;
  break_start: string;
  break_end: string;
  end_time: string;
  max_appointments: number;
}

interface Appointment {
  id: string;
  name: string;
  pin: number;
  concern: string;
  phone: string;
  reason: string;
  appointment_date: string;
  serial_number: number;
  appointment_time: string;
  status: string;
}

interface AppointmentListProps {
  schedule: DoctorSchedule | null;
  appointments: Appointment[];
}

export const AppointmentList = ({ schedule, appointments }: AppointmentListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getCurrentSerialNumber = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (!schedule) return 1;

    // Find the current appointment based on time
    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      if (currentTime <= appointment.appointment_time && appointment.status !== 'absent') {
        return appointment.serial_number;
      }
    }
    
    return appointments.length + 1;
  };

  const getRowClassName = (appointment: Appointment, currentSerial: number) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (appointment.status === 'absent') return '';
    
    if (currentTime > appointment.appointment_time) {
      return 'bg-green-50'; // Completed
    } else if (appointment.serial_number === currentSerial) {
      return 'bg-blue-50'; // Current
    }
    
    return ''; // Upcoming
  };

  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appointments List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No schedule available</p>
        </CardContent>
      </Card>
    );
  }

  const currentSerial = getCurrentSerialNumber();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments List</CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Scheduled appointments for {formatDate(schedule.availability_date)}</p>
          <p>Booking Status: {appointments.length}/{schedule.max_appointments}</p>
          <p>Next Serial: {currentSerial}</p>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No appointments scheduled</p>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Concern</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow 
                    key={appointment.id}
                    className={getRowClassName(appointment, currentSerial)}
                  >
                    <TableCell className="font-medium">
                      {appointment.serial_number}
                    </TableCell>
                    <TableCell>{appointment.name}</TableCell>
                    <TableCell>{appointment.concern}</TableCell>
                    <TableCell>{appointment.reason}</TableCell>
                    <TableCell>{appointment.appointment_time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                For emergencies when daily limit is reached, please contact: 01708166012
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};