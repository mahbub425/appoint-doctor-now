import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Calendar, 
  Download, 
  Clock, 
  UserX, 
  LogOut, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { Appointment, DoctorTimings } from '@/types/appointment';
import { StorageManager } from '@/utils/storage';
import { AppointmentScheduler } from '@/utils/appointmentScheduler';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [timings, setTimings] = useState<DoctorTimings>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isUpdatingTimings, setIsUpdatingTimings] = useState(false);
  const [error, setError] = useState('');
  const [absentDialog, setAbsentDialog] = useState<{ open: boolean; appointmentId: string | null }>({ open: false, appointmentId: null });
  const [availableDate, setAvailableDate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
    loadAvailableDate();
  }, []);

  const loadInitialData = async () => {
    const doctorTimings = await StorageManager.getDoctorTimings();
    setTimings(doctorTimings);
    await loadAppointments();
  };

  const loadAvailableDate = async () => {
    const date = await StorageManager.getDoctorAvailableDate();
    setAvailableDate(date);
  };

  const loadAppointments = async () => {
    const allAppointments = await StorageManager.getAppointments();
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = allAppointments
      .filter(apt => apt.date === today)
      .sort((a, b) => a.serial - b.serial);
    setAppointments(todayAppointments);
  };

  const handleTimingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingTimings(true);
    setError('');

    // Validate timings
    if (!timings || timings.breakStart <= timings.startTime) {
      setError('Break start must be after doctor start time');
      setIsUpdatingTimings(false);
      return;
    }
    if (timings.breakEnd <= timings.breakStart) {
      setError('Break end must be after break start');
      setIsUpdatingTimings(false);
      return;
    }
    if (timings.endTime <= timings.breakEnd) {
      setError('End time must be after break end');
      setIsUpdatingTimings(false);
      return;
    }

    try {
      // Save new timings
      await StorageManager.saveDoctorTimings(timings);

      // Reschedule all existing appointments
      const allAppointments = await StorageManager.getAppointments();
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = allAppointments.filter(apt => apt.date === today);
      const otherAppointments = allAppointments.filter(apt => apt.date !== today);

      if (todayAppointments.length > 0) {
        const rescheduledAppointments = AppointmentScheduler.rescheduleAllAppointments(
          todayAppointments,
          timings
        );

        // Combine with other days' appointments
        const updatedAppointments = [...otherAppointments, ...rescheduledAppointments];
        await StorageManager.updateAppointments(updatedAppointments);
        
        // Simulate notifications to affected patients
        rescheduledAppointments.forEach(apt => {
          console.log(`Notification sent to ${apt.contact}: Your appointment has been rescheduled to ${apt.time}, Serial: ${apt.serial}`);
        });
      }

      await loadAppointments();
      toast({
        title: "Timings Updated Successfully",
        description: "Doctor timings have been updated and appointments rescheduled.",
      });

    } catch (error) {
      console.error('Error updating timings:', error);
      setError('An error occurred while updating timings');
    }

    setIsUpdatingTimings(false);
  };

  const handleMarkAbsent = async (appointmentId: string) => {
    if (!timings) return;
    
    const allAppointments = await StorageManager.getAppointments();
    const updatedAppointments = allAppointments.map(apt => 
      apt.id === appointmentId ? { ...apt, isAbsent: true } : apt
    );

    // Reschedule remaining appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = updatedAppointments.filter(apt => apt.date === today);
    const otherAppointments = updatedAppointments.filter(apt => apt.date !== today);
    
    const rescheduledAppointments = AppointmentScheduler.rescheduleAllAppointments(
      todayAppointments,
      timings
    );

    const finalAppointments = [...otherAppointments, ...rescheduledAppointments];
    await StorageManager.updateAppointments(finalAppointments);

    // Simulate notifications
    const activeAppointments = rescheduledAppointments.filter(apt => !apt.isAbsent);
    activeAppointments.forEach(apt => {
      console.log(`Notification sent to ${apt.contact}: Your appointment has been rescheduled to ${apt.time}, Serial: ${apt.serial}`);
    });

    await loadAppointments();
    toast({
      title: "Patient Marked Absent",
      description: "Patient marked as absent and remaining appointments rescheduled.",
    });
  };

  const handleExportCSV = async () => {
    const allAppointments = await StorageManager.getAppointments();
    StorageManager.exportToCSV(allAppointments);
    toast({
      title: "Export Successful",
      description: "Appointments data exported to CSV file.",
    });
  };

  const handleLogout = () => {
    StorageManager.setAdminSession(false);
    onLogout();
  };

  const activeAppointments = appointments.filter(apt => !apt.isAbsent);
  const absentAppointments = appointments.filter(apt => apt.isAbsent);

  const handleMarkAbsentWithDialog = (appointmentId: string) => {
    setAbsentDialog({ open: true, appointmentId });
  };

  const handleDateUpdate = async () => {
    if (!availableDate) {
      toast({
        title: 'Error',
        description: 'Please select a valid date.',
        variant: 'destructive',
      });
      return;
    }

    const success = await StorageManager.setDoctorAvailableDate(availableDate);
    if (success) {
      toast({
        title: 'Success',
        description: 'Doctor available date updated successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update the doctor available date.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage doctor appointments and timings</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Doctor Timings Configuration */}
        <Card className="medical-form">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Doctor Timings Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure doctor availability and break times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTimingsUpdate} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={timings?.startTime || ''}
                    onChange={(e) => timings && setTimings({ ...timings, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakStart">Break Start</Label>
                  <Input
                    id="breakStart"
                    type="time"
                    value={timings?.breakStart || ''}
                    onChange={(e) => timings && setTimings({ ...timings, breakStart: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakEnd">Break End</Label>
                  <Input
                    id="breakEnd"
                    type="time"
                    value={timings?.breakEnd || ''}
                    onChange={(e) => timings && setTimings({ ...timings, breakEnd: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={timings?.endTime || ''}
                    onChange={(e) => timings && setTimings({ ...timings, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert className="error-state">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isUpdatingTimings}>
                {isUpdatingTimings ? 'Updating...' : 'Save Timings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Set Doctor Available Date */}
        <Card>
          <CardHeader>
            <CardTitle>Set Doctor Available Date</CardTitle>
            <CardDescription>
              Select the date when the doctor will be available for appointments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="availableDate">Available Date</Label>
            <Input
              id="availableDate"
              type="date"
              value={availableDate || ''}
              onChange={(e) => setAvailableDate(e.target.value)}
            />
            <Button onClick={handleDateUpdate} className="mt-4">
              Update Date
            </Button>
          </CardContent>
        </Card>

        {/* Appointment Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Today's Appointments</span>
                  </div>
                  <Badge variant="secondary">
                    {activeAppointments.length}/17
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Manage patient appointments for {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active appointments today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full font-semibold text-sm">
                            {appointment.serial}
                          </div>
                          <div>
                            <p className="font-medium">{appointment.name}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{appointment.time}</span>
                              <span>•</span>
                              <span>{appointment.concern}</span>
                              <span>•</span>
                              <span>{appointment.reason}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{appointment.contact}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAbsentWithDialog(appointment.id)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Mark Absent
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Export */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-primary" />
                  <span>Export Data</span>
                </CardTitle>
                <CardDescription>
                  Download appointment data as CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportCSV} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>

            {/* Absent Patients */}
            {absentAppointments.length > 0 && (
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserX className="h-5 w-5 text-muted-foreground" />
                    <span>Absent Patients</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {absentAppointments.map((appointment) => (
                      <div key={appointment.id} className="text-sm text-muted-foreground">
                        {appointment.name} - {appointment.time}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={absentDialog.open} onOpenChange={(open) => setAbsentDialog({ open, appointmentId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>পেশেন্ট কি অনুপস্থিত?</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  handleMarkAbsent(absentDialog.appointmentId!);
                  setAbsentDialog({ open: false, appointmentId: null });
                }}
              >
                Yes
              </Button>
              <Button variant="secondary" onClick={() => setAbsentDialog({ open: false, appointmentId: null })}>
                No
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}