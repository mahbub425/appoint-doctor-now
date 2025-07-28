import { Appointment, DoctorTimings, DEFAULT_TIMINGS } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  ADMIN_SESSION: 'admin_session'
};

export class StorageManager {
  static async getAppointments(): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('serial', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        pin: row.pin,
        concern: row.concern,
        reason: row.reason,
        contact: row.contact,
        serial: row.serial,
        time: row.time,
        date: row.date,
        isAbsent: row.is_absent
      }));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  static async addAppointment(appointment: Appointment): Promise<boolean> {
    try {
      console.log('StorageManager.addAppointment called with:', appointment);
      const { error } = await supabase
        .from('appointments')
        .insert({
          id: appointment.id,
          name: appointment.name,
          pin: appointment.pin,
          concern: appointment.concern,
          reason: appointment.reason,
          contact: appointment.contact,
          serial: appointment.serial,
          time: appointment.time,
          date: appointment.date,
          is_absent: appointment.isAbsent || false
        });
      if (error) {
        // Log the full error object and its stringified version
        console.error('Supabase insert error object:', error);
        try {
          console.error('Supabase insert error (stringified):', JSON.stringify(error));
        } catch (e) {
          // ignore if error can't be stringified
        }
        if (error.message || error.details || error.hint) {
          console.error('Supabase insert error details:', error.message, error.details, error.hint);
        }
        throw error;
      }
      return true;
    } catch (error) {
      // Show more details in the console for debugging
      if (error instanceof Error) {
        console.error('Error adding appointment:', error.message, error.stack);
      } else {
        console.error('Error adding appointment:', error);
      }
      return false;
    }
  }

  static async updateAppointments(appointments: Appointment[]): Promise<boolean> {
    try {
      // Delete all existing appointments for today
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('appointments')
        .delete()
        .eq('date', today);

      // Insert updated appointments
      const appointmentsData = appointments.map(apt => ({
        id: apt.id,
        name: apt.name,
        pin: apt.pin,
        concern: apt.concern,
        reason: apt.reason,
        contact: apt.contact,
        serial: apt.serial,
        time: apt.time,
        date: apt.date,
        is_absent: apt.isAbsent || false
      }));

      if (appointmentsData.length > 0) {
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentsData);
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating appointments:', error);
      return false;
    }
  }

  static async getDoctorTimings(): Promise<DoctorTimings> {
    try {
      const { data, error } = await supabase
        .from('doctor_timings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return {
        startTime: data.start_time,
        breakStart: data.break_start,
        breakEnd: data.break_end,
        endTime: data.end_time
      };
    } catch (error) {
      console.error('Error fetching doctor timings:', error);
      return DEFAULT_TIMINGS;
    }
  }

  static async saveDoctorTimings(timings: DoctorTimings): Promise<boolean> {
    try {
      // First check if any timing record exists
      const { data: existingData } = await supabase
        .from('doctor_timings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('doctor_timings')
          .update({
            start_time: timings.startTime,
            break_start: timings.breakStart,
            break_end: timings.breakEnd,
            end_time: timings.endTime
          })
          .eq('id', existingData.id);
        
        if (error) throw error;
      } else {
        // Create new record if none exists
        const { error } = await supabase
          .from('doctor_timings')
          .insert({
            start_time: timings.startTime,
            break_start: timings.breakStart,
            break_end: timings.breakEnd,
            end_time: timings.endTime
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving doctor timings:', error);
      return false;
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