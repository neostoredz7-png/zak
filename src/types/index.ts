export type GradeLevel = '1AS' | '2AS' | '3AS';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  school_name: string;
  wilaya: string;
  municipality: string;
  academic_year: string;
  specialty: string;
  phone?: string;
  school_logo_url?: string;
}

export interface SchoolClass {
  id: string;
  user_id: string;
  code: string; // e.g. 3AS-SC-1
  name: string; // e.g. 3 ع ت 1 (3 علوم تجريبية 1)
  grade_level: GradeLevel;
  track: string; // شعبة
  group_name: string; // فوج
  academic_year: string;
  student_count: number;
  is_assigned: boolean; // Assigned to this teacher or unassigned in high school
  created_at?: string;
}

export interface Student {
  id: string;
  class_id: string;
  user_id: string;
  student_number: string;
  national_id?: string; // رقم التعريف الوطني (منصة الرقمنة)
  first_name: string;
  last_name: string;
  gender: 'M' | 'F';
  birth_date?: string; // تاريخ الازدياد
  birth_place?: string; // مكان الازدياد
  registration_number?: string; // رقم القيد بالمؤسسة
  schooling_regime?: string; // نظام التمدرس (خارجي / نصف داخلي / داخلي)
  birth_certificate_no?: string; // رقم عقد الميلاد
  registration_date?: string; // تاريخ التسجيل
  is_exempt: boolean;
  medical_reason?: string;
  notes?: string;
}

export type AssessmentType = 'continuous' | 'formative' | 'summative';

export interface Assessment {
  id: string;
  class_id: string;
  user_id: string;
  trimester: 1 | 2 | 3;
  title: string;
  assessment_type: AssessmentType;
  activity_name: string;
  max_score: number;
  weight: number;
  assessment_date: string;
}

export interface Mark {
  id: string;
  assessment_id: string;
  student_id: string;
  user_id: string;
  score: number | null;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'exempt';

export interface AttendanceSession {
  id: string;
  class_id: string;
  user_id: string;
  session_date: string;
  session_number: number;
  activity: string;
  sports_field?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  user_id: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface TeachingUnit {
  id: string;
  user_id: string;
  grade_level: GradeLevel;
  title: string;
  sport_family: string;
  sports: string[];
  academic_year: string;
}

export interface Lesson {
  id: string;
  user_id: string;
  class_id?: string;
  unit_id?: string;
  lesson_number: number;
  lesson_date: string;
  activity: string;
  sports_field: string;
  target_competence: string;
  learning_objective: string;
  warmup_desc: string;
  warmup_duration: number;
  main_desc: string;
  main_duration: number;
  cooldown_desc: string;
  cooldown_duration: number;
  equipment: string;
  success_criteria: string;
  teacher_notes: string;
}

export interface PhysicalTest {
  id: string;
  user_id: string;
  class_id?: string;
  test_name: string;
  measurement_unit: string; // ثواني، سم، تكرار
  description: string;
  target_criteria?: string;
}

export interface PhysicalTestResult {
  id: string;
  test_id: string;
  student_id: string;
  user_id: string;
  test_date: string;
  result_value: number;
  grade?: number;
  notes?: string;
}

export interface SportsEquipment {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  total_quantity: number;
  operational_quantity: number;
  damaged_quantity: number;
  notes?: string;
}

export interface StudentInjury {
  id: string;
  user_id: string;
  class_id?: string;
  student_id?: string;
  student_name: string;
  incident_date: string;
  incident_time: string;
  activity: string;
  injury_nature: string;
  first_aid_administered: string;
  evacuated_to_hospital: boolean;
  notes?: string;
}

export interface LegalRegulation {
  id: string;
  title: string;
  category: 'safety' | 'curriculum' | 'evaluation' | 'exemption';
  reference_number: string;
  date: string;
  summary: string;
  full_content: string;
}
