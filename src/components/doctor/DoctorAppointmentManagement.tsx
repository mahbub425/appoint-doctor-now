import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  name: string;
  pin: number;
  concern: string;
  phone: string;
  reason: string;
  appointment_date: string;
  appointment_time: string;
  serial_number: number;
  status: string;
  user: {
    name: string;
    email: string;
  };
}

export const DoctorAppointmentManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { doctorProfile } = useAuth();

  useEffect(() => {
    if (doctorProfile) {
      fetchAppointments();
    }
  }, [doctorProfile]);

  const fetchAppointments = async () => {
    if (!doctorProfile) return;

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          user:users(name, email)
        `)
        .eq("doctor_id", doctorProfile.id)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReject = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update appointment status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Appointment ${newStatus} successfully`
      });

      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    
    switch (appointment.status) {
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'absent':
        return <Badge variant="secondary">Absent</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        if (appointmentDateTime < now) {
          return <Badge variant="secondary">Past</Badge>;
        }
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const filterAppointments = (status: string) => {
    const now = new Date();
    
    switch (status) {
      case 'upcoming':
        return appointments.filter(apt => {
          const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          return appointmentDateTime >= now && apt.status !== 'rejected' && apt.status !== 'completed';
        });
      case 'past':
        return appointments.filter(apt => {
          const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          return appointmentDateTime < now || apt.status === 'completed';
        });
      case 'pending':
        return appointments.filter(apt => apt.status === 'upcoming' || apt.status === 'pending');
      default:
        return appointments;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Appointment Management</h2>
        <div className="text-sm text-muted-foreground">
          Total: {appointments.length} appointments
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <AppointmentTable 
            appointments={filterAppointments('upcoming')}
            onAcceptReject={handleAcceptReject}
            onViewDetails={setSelectedAppointment}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="past">
          <AppointmentTable 
            appointments={filterAppointments('past')}
            onAcceptReject={handleAcceptReject}
            onViewDetails={setSelectedAppointment}
            showActions={false}
          />
        </TabsContent>

        <TabsContent value="pending">
          <AppointmentTable 
            appointments={filterAppointments('pending')}
            onAcceptReject={handleAcceptReject}
            onViewDetails={setSelectedAppointment}
            showActions={true}
          />
        </TabsContent>
      </Tabs>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Name:</p>
                  <p className="text-muted-foreground">{selectedAppointment.name}</p>
                </div>
                <div>
                  <p className="font-medium">PIN:</p>
                  <p className="text-muted-foreground">{selectedAppointment.pin}</p>
                </div>
                <div>
                  <p className="font-medium">Email:</p>
                  <p className="text-muted-foreground">{selectedAppointment.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Phone:</p>
                  <p className="text-muted-foreground">{selectedAppointment.phone}</p>
                </div>
                <div>
                  <p className="font-medium">Concern:</p>
                  <p className="text-muted-foreground">{selectedAppointment.concern}</p>
                </div>
                <div>
                  <p className="font-medium">Reason:</p>
                  <p className="text-muted-foreground">{selectedAppointment.reason}</p>
                </div>
              </div>
              <div>
                <p className="font-medium">Appointment Details:</p>
                <p className="text-muted-foreground">
                  {formatDate(selectedAppointment.appointment_date)} at {selectedAppointment.appointment_time}
                  (Serial: {selectedAppointment.serial_number})
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AppointmentTableProps {
  appointments: Appointment[];
  onAcceptReject: (id: string, status: string) => void;
  onViewDetails: (appointment: Appointment) => void;
  showActions: boolean;
}

const AppointmentTable = ({ appointments, onAcceptReject, onViewDetails, showActions }: AppointmentTableProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusBadge = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    
    switch (appointment.status) {
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'absent':
        return <Badge variant="secondary">Absent</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        if (appointmentDateTime < now) {
          return <Badge variant="secondary">Past</Badge>;
        }
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No appointments found.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Concern</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                <TableCell>{appointment.appointment_time}</TableCell>
                <TableCell>{appointment.serial_number}</TableCell>
                <TableCell>{appointment.name}</TableCell>
                <TableCell>{appointment.concern}</TableCell>
                <TableCell>{appointment.reason}</TableCell>
                <TableCell>{getStatusBadge(appointment)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(appointment)}
                    >
                      View
                    </Button>
                    {showActions && appointment.status === 'upcoming' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onAcceptReject(appointment.id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onAcceptReject(appointment.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};