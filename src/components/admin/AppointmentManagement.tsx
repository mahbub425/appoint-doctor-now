import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

interface AppointmentManagementProps {
  schedule: DoctorSchedule | null;
  appointments: Appointment[];
  onAppointmentsUpdate: () => void;
}

export const AppointmentManagement = ({ 
  schedule, 
  appointments, 
  onAppointmentsUpdate 
}: AppointmentManagementProps) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleMarkAbsent = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const confirmMarkAbsent = async () => {
    if (!selectedAppointment || !schedule) return;

    setIsProcessing(true);
    
    try {
      // Delete the appointment
      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .eq("id", selectedAppointment.id);

      if (deleteError) throw deleteError;

      // Recalculate serial numbers and times for remaining appointments
      const remainingAppointments = appointments
        .filter(apt => apt.id !== selectedAppointment.id)
        .sort((a, b) => a.serial_number - b.serial_number);

      // Update serial numbers and times
      for (let i = 0; i < remainingAppointments.length; i++) {
        const appointment = remainingAppointments[i];
        const newSerial = i + 1;
        const newTime = calculateAppointmentTime(newSerial, appointment.reason, remainingAppointments);

        const { error: updateError } = await supabase
          .from("appointments")
          .update({
            serial_number: newSerial,
            appointment_time: newTime
          })
          .eq("id", appointment.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Appointment Marked Absent",
        description: "The appointment has been removed and schedules updated",
      });

      onAppointmentsUpdate();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark appointment absent",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setIsDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  const calculateAppointmentTime = (serialNumber: number, reason: string, appointmentsList: Appointment[]) => {
    if (!schedule) return "";

    const durations: { [key: string]: number } = {
      "New Patient": 10,
      "Follow Up": 7,
      "Report Show": 12
    };

    let currentTime = new Date(`2000-01-01T${schedule.start_time}`);
    const breakStart = new Date(`2000-01-01T${schedule.break_start}`);
    const breakEnd = new Date(`2000-01-01T${schedule.break_end}`);

    // Calculate time for appointments before this one
    for (let i = 1; i < serialNumber; i++) {
      const appointment = appointmentsList.find(apt => apt.serial_number === i);
      if (appointment) {
        const duration = durations[appointment.reason] || 10;
        currentTime.setMinutes(currentTime.getMinutes() + duration);

        // Skip break time
        if (currentTime >= breakStart && currentTime < breakEnd) {
          currentTime = new Date(breakEnd);
        }
      }
    }

    return currentTime.toTimeString().slice(0, 5);
  };

  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Appointment Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No schedule set. Please configure doctor availability first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Appointment Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Appointments for {formatDate(schedule.availability_date)} ({appointments.length}/{schedule.max_appointments})
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No appointments scheduled</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead>Concern</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointment.serial_number}
                    </TableCell>
                    <TableCell>{appointment.name}</TableCell>
                    <TableCell>{appointment.pin}</TableCell>
                    <TableCell>{appointment.concern}</TableCell>
                    <TableCell>{appointment.phone}</TableCell>
                    <TableCell>{appointment.reason}</TableCell>
                    <TableCell>{appointment.appointment_time}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAbsent(appointment)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Mark Absent
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Mark Absent</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this appointment as absent? This action will remove the appointment and update all subsequent appointment times.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="py-4">
              <p><strong>Patient:</strong> {selectedAppointment.name}</p>
              <p><strong>PIN:</strong> {selectedAppointment.pin}</p>
              <p><strong>Time:</strong> {selectedAppointment.appointment_time}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              No
            </Button>
            <Button
              onClick={confirmMarkAbsent}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Processing..." : "Yes, Mark Absent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};