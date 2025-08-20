import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search } from "lucide-react";
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

export const DoctorAppointmentManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
    let filteredAppointments = appointments;

    // Apply search filter
    if (searchTerm) {
      filteredAppointments = appointments.filter(apt => 
        apt.pin.toString().includes(searchTerm) ||
        apt.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (status) {
      case 'upcoming':
        return filteredAppointments.filter(apt => {
          const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          return appointmentDateTime >= now && apt.status !== 'rejected' && apt.status !== 'completed';
        });
      case 'past':
        return filteredAppointments.filter(apt => {
          const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          return appointmentDateTime < now || apt.status === 'completed';
        });
      case 'pending':
        return filteredAppointments.filter(apt => apt.status === 'upcoming' || apt.status === 'pending');
      default:
        return filteredAppointments;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Appointment Management</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PIN or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
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
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
            setItemsPerPage={setItemsPerPage}
          />
        </TabsContent>

        <TabsContent value="past">
          <AppointmentTable 
            appointments={filterAppointments('past')}
            onAcceptReject={handleAcceptReject}
            onViewDetails={setSelectedAppointment}
            showActions={false}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
            setItemsPerPage={setItemsPerPage}
          />
        </TabsContent>

        <TabsContent value="pending">
          <AppointmentTable 
            appointments={filterAppointments('pending')}
            onAcceptReject={handleAcceptReject}
            onViewDetails={setSelectedAppointment}
            showActions={true}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
            setItemsPerPage={setItemsPerPage}
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
                  <p className="font-medium">User PIN:</p>
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
  onAcceptReject: (id: string, status: string) => void;
  onViewDetails: (appointment: Appointment) => void;
  showActions: boolean;
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
}

const AppointmentTable = ({ appointments, onAcceptReject, onViewDetails, showActions, currentPage, itemsPerPage, setCurrentPage, setItemsPerPage }: AppointmentTableProps) => {
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

  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = appointments.slice(startIndex, endIndex);

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
              <TableHead>PIN</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Concern</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                <TableCell>{appointment.appointment_time}</TableCell>
                <TableCell>{appointment.serial_number}</TableCell>
                <TableCell>{appointment.pin}</TableCell>
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
                    {showActions && (appointment.status === 'upcoming' || appointment.status === 'accepted') && (
                      <Button
                        size="sm"
                        onClick={() => onAcceptReject(appointment.id, 'completed')}
                        variant="default"
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
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="flex gap-2 items-center">
            <Label className="text-sm">Show:</Label>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, appointments.length)} of {appointments.length} appointments
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};