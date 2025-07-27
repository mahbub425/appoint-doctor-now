import { Appointment, DoctorTimings, APPOINTMENT_DURATIONS, DAILY_LIMIT } from '@/types/appointment';

export class AppointmentScheduler {
  static formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  static addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return this.formatTime(`${newHours}:${newMins}`);
  }

  static isTimeInBreak(time: string, timings: DoctorTimings): boolean {
    return time >= timings.breakStart && time < timings.breakEnd;
  }

  static skipBreakIfNeeded(appointmentTime: string, timings: DoctorTimings): string {
    if (this.isTimeInBreak(appointmentTime, timings)) {
      return timings.breakEnd;
    }
    return appointmentTime;
  }

  static calculateAppointmentTime(
    appointments: Appointment[],
    reason: keyof typeof APPOINTMENT_DURATIONS,
    timings: DoctorTimings
  ): string | null {
    const duration = APPOINTMENT_DURATIONS[reason];
    
    // Sort existing appointments by time
    const sortedAppointments = appointments
      .filter(apt => !apt.isAbsent)
      .sort((a, b) => a.time.localeCompare(b.time));

    let currentTime = timings.startTime;

    // If there are existing appointments, start from the last appointment end time
    if (sortedAppointments.length > 0) {
      const lastAppointment = sortedAppointments[sortedAppointments.length - 1];
      const lastDuration = APPOINTMENT_DURATIONS[lastAppointment.reason as keyof typeof APPOINTMENT_DURATIONS];
      currentTime = this.addMinutes(lastAppointment.time, lastDuration);
    }

    // Skip break if the appointment would start during break
    currentTime = this.skipBreakIfNeeded(currentTime, timings);

    // Check if the appointment would end after the doctor's end time
    const appointmentEndTime = this.addMinutes(currentTime, duration);
    if (appointmentEndTime > timings.endTime) {
      return null; // Cannot schedule
    }

    return currentTime;
  }

  static rescheduleAllAppointments(
    appointments: Appointment[],
    timings: DoctorTimings
  ): Appointment[] {
    const activeAppointments = appointments
      .filter(apt => !apt.isAbsent)
      .sort((a, b) => a.serial - b.serial);

    let currentTime = timings.startTime;
    const rescheduled: Appointment[] = [];

    for (let i = 0; i < activeAppointments.length; i++) {
      const appointment = activeAppointments[i];
      const duration = APPOINTMENT_DURATIONS[appointment.reason as keyof typeof APPOINTMENT_DURATIONS];
      
      // Skip break if needed
      currentTime = this.skipBreakIfNeeded(currentTime, timings);
      
      // Check if appointment fits within working hours
      const appointmentEndTime = this.addMinutes(currentTime, duration);
      if (appointmentEndTime > timings.endTime) {
        // Cannot reschedule this appointment - it exceeds working hours
        continue;
      }

      rescheduled.push({
        ...appointment,
        time: currentTime,
        serial: i + 1
      });

      currentTime = this.addMinutes(currentTime, duration);
    }

    return rescheduled;
  }

  static canBookAppointment(
    appointments: Appointment[],
    pin: string,
    date: string,
    reason: keyof typeof APPOINTMENT_DURATIONS,
    timings: DoctorTimings
  ): { canBook: boolean; error?: string } {
    const todayAppointments = appointments.filter(apt => apt.date === date && !apt.isAbsent);

    // Check daily limit
    if (todayAppointments.length >= DAILY_LIMIT) {
      return {
        canBook: false,
        error: "Today's limit is filled up. If emergency, please contact: 01708166012."
      };
    }

    // Check if PIN already used today
    const existingPinAppointment = todayAppointments.find(apt => apt.pin === pin);
    if (existingPinAppointment) {
      return {
        canBook: false,
        error: "You have already booked an appointment today with this PIN."
      };
    }

    // Check if appointment can fit in schedule
    const appointmentTime = this.calculateAppointmentTime(todayAppointments, reason, timings);
    if (!appointmentTime) {
      return {
        canBook: false,
        error: "Cannot schedule: Exceeds doctor availability."
      };
    }

    return { canBook: true };
  }
}