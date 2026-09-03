export type UserRole = "admin" | "lecturer" | "student" | "registrar";

export interface Profile {
  id: string;
  institution_id: string;
  full_name: string;
  role: UserRole;
  student_id?: string;
  staff_id?: string;
  avatar_url?: string;
}

export interface Course {
  id: string;
  institution_id: string;
  code: string;
  title: string;
  lecturer_id: string;
  semester: string;
  credit_hours: number;
}

export interface ClassSession {
  id: string;
  course_id: string;
  session_date: string;
  topic?: string;
  checkin_code?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  weight: number;
  max_score: number;
  due_at?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string;
  score?: number;
  feedback?: string;
  graded_at?: string;
}

export interface FinalGrade {
  id: string;
  course_id: string;
  student_id: string;
  ca_score: number;
  exam_score: number;
  final_score: number;
  letter_grade?: string;
  published: boolean;
}
