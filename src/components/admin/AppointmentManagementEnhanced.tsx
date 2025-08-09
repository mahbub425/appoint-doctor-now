import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Trash2, Edit, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  doctor: {
    name: string;
  };
}

interface Doctor {
  id: string;
  name: string;
}

export const AppointmentManagementEnhanced = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("last_6_months");
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    concern: "",
    reason: "",
    appointment_date: "",
    appointment_time: ""
  });

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDoctor, selectedDateRange]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching doctors:", error);
        return;
      }

      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate = '';

    switch (selectedDateRange) {
      case 'today':
        startDate = endDate;
        break;
      case 'last_7_days':
        const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = week.toISOString().split('T')[0];
        break;
      case 'last_1_month':
        const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = month.toISOString().split('T')[0];
        break;
      case 'last_3_months':
        const threeMonths = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate = threeMonths.toISOString().split('T')[0];
        break;
      case 'last_6_months':
      default:
        const sixMonths = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        startDate = sixMonths.toISOString().split('T')[0];
        break;
    }

    return { startDate, endDate };
  };

  const fetchAppointments = async () => {
    try {
      const { startDate, endDate } = getDateFilter();
      
      let query = supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors(name)
        `)
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });

      if (selectedDoctor !== "all") {
        query = query.eq("doctor_id", selectedDoctor);
      }

      const { data, error } = await query;

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

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditForm({
      name: appointment.name,
      phone: appointment.phone,
      concern: appointment.concern,
      reason: appointment.reason,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time
    });
  };

  const handleUpdate = async () => {
    if (!editingAppointment) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          name: editForm.name,
          phone: editForm.phone,
          concern: editForm.concern,
          reason: editForm.reason,
          appointment_date: editForm.appointment_date,
          appointment_time: editForm.appointment_time
        })
        .eq("id", editingAppointment.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update appointment",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Appointment updated successfully"
      });

      setEditingAppointment(null);
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete appointment",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Appointment deleted successfully"
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
        return <Badge variant="destructive" className="bg-red-500 text-white">Absent</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 text-white">Completed</Badge>;
      default:
        if (appointmentDateTime < now) {
          return <Badge variant="default" className="bg-green-500 text-white">Completed</Badge>;
        }
        return <Badge variant="secondary" className="bg-gray-500 text-white">Upcoming</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const canMarkAbsent = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    return appointmentDateTime >= now && appointment.status !== 'absent' && appointment.status !== 'completed';
  };

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Appointment Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_1_month">Last 1 Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No appointments found for the selected filters.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Appointments ({appointments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Doctor</TableHead>
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
                    <TableCell>{appointment.phone}</TableCell>
                    <TableCell>{appointment.doctor?.name || 'Unknown'}</TableCell>
                    <TableCell>{appointment.concern}</TableCell>
                    <TableCell>{appointment.reason}</TableCell>
                    <TableCell>{getStatusBadge(appointment)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canMarkAbsent(appointment) && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAbsent(appointment.id)}
                              className="text-orange-600"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Mark as Absent
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleEdit(appointment)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(appointment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Patient Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="concern">Concern</Label>
              <Input
                id="concern"
                value={editForm.concern}
                onChange={(e) => setEditForm(prev => ({ ...prev, concern: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select value={editForm.reason} onValueChange={(value) => setEditForm(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Patient">New Patient</SelectItem>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Report Show">Report Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editForm.appointment_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={editForm.appointment_time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate}>Update</Button>
              <Button variant="outline" onClick={() => setEditingAppointment(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};