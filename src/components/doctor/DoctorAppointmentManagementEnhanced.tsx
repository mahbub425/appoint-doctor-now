import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    pin: string;
  };
}

export const DoctorAppointmentManagementEnhanced = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const { doctorProfile } = useAuth();

  useEffect(() => {
    if (doctorProfile) {
      fetchAppointments();
      // Cleanup old appointments when component loads
      cleanupOldAppointments();
    }
  }, [doctorProfile]);

  const cleanupOldAppointments = async () => {
    try {
      await supabase.rpc('cleanup_old_appointments');
    } catch (error) {
      console.error("Error cleaning up old appointments:", error);
    }
  };

  const fetchAppointments = async () => {
    if (!doctorProfile) return;

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          user:users(name, pin)
        `)
        .eq("doctor_id", doctorProfile.id)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      // Filter out appointments with invalid user data
      const validAppointments = (data || []).filter(appointment => 
        appointment && appointment.user && typeof appointment.user === 'object' && appointment.user.name
      );
      setAppointments(validAppointments as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAbsent = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: 'absent' })
        .eq("id", appointmentId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to mark appointment as absent",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Appointment marked as absent"
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

  const handleMarkComplete = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: 'completed' })
        .eq("id", appointmentId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to mark appointment as completed",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Appointment marked as completed"
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
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        if (appointmentDateTime < now) {
          return <Badge variant="secondary">Completed</Badge>;
        }
        return <Badge variant="default">Upcoming</Badge>;
    }
  };

  const filterAppointments = (status: string) => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    switch (status) {
      case 'upcoming':
        return appointments.filter(apt => {
          const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          return appointmentDateTime >= now && apt.status !== 'absent' && apt.status !== 'completed';
        });
      case 'past':
        return appointments.filter(apt => {
          const appointmentDate = new Date(apt.appointment_date);
          const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          return (appointmentDateTime < now || apt.status === 'completed') && 
                 appointmentDate >= sixMonthsAgo;
        });
      case 'absent':
        return appointments.filter(apt => apt.status === 'absent');
      default:
        return appointments;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getTabCount = (tabName: string) => {
    return filterAppointments(tabName).length;
  };

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Appointment Management</h2>
        <div className="text-sm text-muted-foreground">
          Total: {getTabCount(activeTab)} appointments
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({getTabCount('upcoming')})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({getTabCount('past')})
          </TabsTrigger>
          <TabsTrigger value="absent">
            Absent ({getTabCount('absent')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <AppointmentTable 
            appointments={filterAppointments('upcoming')}
            onMarkAbsent={handleMarkAbsent}
            onMarkComplete={handleMarkComplete}
            onViewDetails={setSelectedAppointment}
            showAbsentAction={true}
            showCompleteAction={true}
          />
        </TabsContent>

        <TabsContent value="past">
          <AppointmentTable 
            appointments={filterAppointments('past')}
            onMarkAbsent={handleMarkAbsent}
            onMarkComplete={handleMarkComplete}
            onViewDetails={setSelectedAppointment}
            showAbsentAction={false}
            showCompleteAction={false}
          />
        </TabsContent>

        <TabsContent value="absent">
          <AppointmentTable 
            appointments={filterAppointments('absent')}
            onMarkAbsent={handleMarkAbsent}
            onMarkComplete={handleMarkComplete}
            onViewDetails={setSelectedAppointment}
            showAbsentAction={false}
            showCompleteAction={false}
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
                  <p className="font-medium">Employee PIN:</p>
                  <p className="text-muted-foreground">{selectedAppointment.user?.pin || 'N/A'}</p>
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
  onMarkAbsent: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onViewDetails: (appointment: Appointment) => void;
  showAbsentAction: boolean;
  showCompleteAction: boolean;
}

const AppointmentTable = ({ 
  appointments, 
  onMarkAbsent, 
  onMarkComplete,
  onViewDetails, 
  showAbsentAction,
  showCompleteAction 
}: AppointmentTableProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusBadge = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    
    switch (appointment.status) {
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        if (appointmentDateTime < now) {
          return <Badge variant="secondary">Completed</Badge>;
        }
        return <Badge variant="default">Upcoming</Badge>;
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
                    {showAbsentAction && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onMarkAbsent(appointment.id)}
                      >
                        Mark Absent
                      </Button>
                    )}
                    {showCompleteAction && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onMarkComplete(appointment.id)}
                      >
                        Mark Complete
                      </Button>
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