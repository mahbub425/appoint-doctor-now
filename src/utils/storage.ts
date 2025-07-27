import { Appointment, DoctorTimings, DEFAULT_TIMINGS } from '@/types/appointment';

const STORAGE_KEYS = {
  APPOINTMENTS: 'doctor_appointments',
  TIMINGS: 'doctor_timings',
  ADMIN_SESSION: 'admin_session'
};

export class StorageManager {
  static getAppointments(): Appointment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading appointments:', error);
      return [];
    }
  }

  static saveAppointments(appointments: Appointment[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  }

  static addAppointment(appointment: Appointment): void {
    const appointments = this.getAppointments();
    appointments.push(appointment);
    this.saveAppointments(appointments);
  }

  static updateAppointments(appointments: Appointment[]): void {
    this.saveAppointments(appointments);
  }

  static getDoctorTimings(): DoctorTimings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIMINGS);
      return stored ? JSON.parse(stored) : DEFAULT_TIMINGS;
    } catch (error) {
      console.error('Error loading timings:', error);
      return DEFAULT_TIMINGS;
    }
  }

  static saveDoctorTimings(timings: DoctorTimings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMINGS, JSON.stringify(timings));
    } catch (error) {
      console.error('Error saving timings:', error);
    }
  }

  static isAdminLoggedIn(): boolean {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      return session === 'true';
    } catch (error) {
      return false;
    }
  }

  static setAdminSession(loggedIn: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, loggedIn.toString());
    } catch (error) {
      console.error('Error setting admin session:', error);
    }
  }

  static exportToCSV(appointments: Appointment[]): void {
    const headers = ['Name', 'Pin', 'Concern', 'Reason', 'Contact', 'Serial', 'Time', 'Date'];
    const csvContent = [
      headers.join(','),
      ...appointments.map(apt => [
        `"${apt.name}"`,
        `"${apt.pin}"`,
        `"${apt.concern}"`,
        `"${apt.reason}"`,
        `"${apt.contact}"`,
        apt.serial,
        `"${apt.time}"`,
        `"${apt.date}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'appointments.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}