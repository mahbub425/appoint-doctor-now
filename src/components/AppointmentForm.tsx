import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Appointment, CONCERNS, REASONS, APPOINTMENT_DURATIONS } from '@/types/appointment';
import { AppointmentScheduler } from '@/utils/appointmentScheduler';
import { StorageManager } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

interface AppointmentFormProps {
  onAppointmentBooked: () => void;
}

export function AppointmentForm({ onAppointmentBooked }: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    concern: '',
    reason: '',
    contact: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      pin: '',
      concern: '',
      reason: '',
      contact: ''
    });
    setError('');
    setBookedAppointment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate form
    if (!formData.name || !formData.pin || !formData.concern || !formData.reason || !formData.contact) {
      setError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Starting appointment booking process...');
      const appointments = await StorageManager.getAppointments();
      const timings = await StorageManager.getDoctorTimings();
      const today = new Date().toISOString().split('T')[0];

      console.log('Fetched appointments:', appointments);
      console.log('Fetched timings:', timings);
      console.log('Today date:', today);

      // Check if appointment can be booked
      const { canBook, error: bookingError } = AppointmentScheduler.canBookAppointment(
        appointments,
        formData.pin,
        today,
        formData.reason as keyof typeof APPOINTMENT_DURATIONS,
        timings
      );

      console.log('Can book appointment:', canBook, 'Error:', bookingError);

      if (!canBook) {
        setError(bookingError || 'Cannot book appointment');
        setIsSubmitting(false);
        return;
      }

      // Calculate appointment details
      const todayAppointments = appointments.filter(apt => apt.date === today && !apt.isAbsent);
      const appointmentTime = AppointmentScheduler.calculateAppointmentTime(
        todayAppointments,
        formData.reason as keyof typeof APPOINTMENT_DURATIONS,
        timings
      );

      console.log('Calculated appointment time:', appointmentTime);

      if (!appointmentTime) {
        setError('Cannot schedule: Exceeds doctor availability.');
        setIsSubmitting(false);
        return;
      }

      // Create appointment
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        name: formData.name,
        pin: formData.pin,
        concern: formData.concern,
        reason: formData.reason,
        contact: formData.contact,
        serial: todayAppointments.length + 1,
        time: appointmentTime,
        date: today
      };

      console.log('Attempting to save appointment:', newAppointment);

      // Save appointment
      const success = await StorageManager.addAppointment(newAppointment);
      console.log('Save appointment result:', success);
      
      if (!success) {
        setError('Failed to save appointment. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      setBookedAppointment(newAppointment);
      onAppointmentBooked();

      // Simulate notification
      console.log(`Notification sent to ${formData.contact}: Your appointment is confirmed for ${appointmentTime}, Serial: ${newAppointment.serial}`);
      
      toast({
        title: "Appointment Booked Successfully!",
        description: `Your appointment is scheduled for ${appointmentTime}. Confirmation sent to ${formData.contact}.`,
      });

    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('An error occurred while booking your appointment. Please try again.');
    }

    setIsSubmitting(false);
  };

  if (bookedAppointment) {
    return (
      <Card className="medical-card success-state">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-accent" />
          </div>
          <CardTitle className="text-2xl text-accent-foreground">Appointment Confirmed!</CardTitle>
          <CardDescription className="text-accent-foreground/80">
            Your appointment has been successfully scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="font-medium">Date:</span>
              <span>{new Date(bookedAppointment.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="font-medium">Time:</span>
              <span>{bookedAppointment.time}</span>
            </div>
          </div>
          <div className="bg-accent/5 p-4 rounded-lg">
            <p><strong>Name:</strong> {bookedAppointment.name}</p>
            <p><strong>Serial Number:</strong> {bookedAppointment.serial}</p>
            <p><strong>Concern:</strong> {bookedAppointment.concern}</p>
            <p><strong>Reason:</strong> {bookedAppointment.reason}</p>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A confirmation notification has been sent to {bookedAppointment.contact}
            </AlertDescription>
          </Alert>
          <Button onClick={resetForm} className="w-full">
            Book Another Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="medical-form">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span>Book Doctor Appointment</span>
        </CardTitle>
        <CardDescription className="text-center">
          Fill in your details to schedule an appointment with the doctor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">Employee PIN *</Label>
            <Input
              id="pin"
              type="text"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              placeholder="Enter your employee PIN"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concern">Concern *</Label>
            <Select value={formData.concern} onValueChange={(value) => setFormData({ ...formData, concern: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your concern" />
              </SelectTrigger>
              <SelectContent>
                {CONCERNS.map((concern) => (
                  <SelectItem key={concern} value={concern}>
                    {concern}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit *</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason for visit" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason} ({APPOINTMENT_DURATIONS[reason]} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact (Email/Phone) *</Label>
            <Input
              id="contact"
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Enter email or phone number"
              required
            />
          </div>

          {error && (
            <Alert className="error-state">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Booking Appointment...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}