export type UserRole = 'student' | 'teacher' | 'advisor' | 'admin';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  roll_number: string;
  department_id: string | null;
  semester: number | null;
  admission_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  employee_id: string | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department_id: string | null;
  semester: number | null;
  credits: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  subject_id: string;
  teacher_id: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimetableSlot {
  id: string;
  subject_id: string;
  teacher_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  section: string | null;
  semester: number | null;
  academic_year: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherSubjectAllocation {
  id: string;
  teacher_id: string;
  subject_id: string;
  section: string | null;
  academic_year: string | null;
  created_at: string;
}
