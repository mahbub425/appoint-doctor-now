export interface Appointment {
  id: string;
  name: string;
  pin: string;
  concern: string;
  reason: string;
  contact: string;
  serial: number;
  time: string;
  date: string;
  isAbsent?: boolean;
  isCompleted?: boolean;
}

export interface DoctorTimings {
  startTime: string;
  breakStart: string;
  breakEnd: string;
  endTime: string;
}

export const CONCERNS = [
  'OG',
  'OPL',
  'Udvash',
  'Unmesh',
  'Uttoron',
  'Rokomari'
] as const;

export const REASONS = [
  'Follow-up',
  'New Patient',
  'Report Show'
] as const;

export const APPOINTMENT_DURATIONS = {
  'Follow-up': 7,
  'New Patient': 10,
  'Report Show': 12
} as const;

export const DEFAULT_TIMINGS: DoctorTimings = {
  startTime: '11:00',
  breakStart: '13:15',
  breakEnd: '14:30',
  endTime: '16:30'
};

export const DAILY_LIMIT = 17;
export const ADMIN_CREDENTIALS = {
  username: 'admin1234',
  password: '123456'
};