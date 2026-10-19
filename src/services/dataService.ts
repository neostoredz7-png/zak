import {
  Profile,
  SchoolClass,
  Student,
  Assessment,
  Mark,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  TeachingUnit,
  Lesson,
  PhysicalTest,
  PhysicalTestResult,
  SportsEquipment,
  StudentInjury,
  LegalRegulation,
} from '../types';
import {
  initialProfile,
  initialClasses,
  initialStudents,
  initialAssessments,
  initialMarks,
  initialAttendanceSessions,
  initialAttendanceRecords,
  initialTeachingUnits,
  initialLessons,
  initialPhysicalTests,
  initialTestResults,
  initialEquipment,
  initialInjuries,
  initialLegalRegulations,
} from './mockData';
import { getSupabase } from './supabaseClient';

const LS_PREFIX = 'eps_dz_data_';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }

  // Persist directly to online server database
  try {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data: value }),
    }).catch((e) => {
      console.warn(`Online DB sync for ${key}:`, e.message);
    });
  } catch (e) {
    // ignore
  }
}

class DataRepository {
  private profile: Profile;
  private classes: SchoolClass[];
  private students: Student[];
  private assessments: Assessment[];
  private marks: Mark[];
  private attendanceSessions: AttendanceSession[];
  private attendanceRecords: AttendanceRecord[];
  private teachingUnits: TeachingUnit[];
  private lessons: Lesson[];
  private physicalTests: PhysicalTest[];
  private testResults: PhysicalTestResult[];
  private equipment: SportsEquipment[];
  private injuries: StudentInjury[];
  private regulations: LegalRegulation[];

  constructor() {
    this.profile = loadFromStorage('profile', initialProfile);
    const rawClasses = loadFromStorage('classes', initialClasses);
    // Ensure every class has a guaranteed unique ID and no duplicates exist
    const seenClassIds = new Set<string>();
    const sanitizedClasses: SchoolClass[] = [];
    for (const c of rawClasses) {
      let uniqueId = c.id;
      if (!uniqueId || seenClassIds.has(uniqueId)) {
        uniqueId = 'cls-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      }
      seenClassIds.add(uniqueId);
      sanitizedClasses.push({
        ...c,
        id: uniqueId,
        is_assigned: Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true'),
      });
    }
    this.classes = sanitizedClasses;
    saveToStorage('classes', this.classes);

    const rawStudents = loadFromStorage('students', initialStudents);
    const seenStudentIds = new Set<string>();
    const sanitizedStudents: Student[] = [];
    for (const s of rawStudents) {
      let uniqueId = s.id;
      if (!uniqueId || seenStudentIds.has(uniqueId)) {
        uniqueId = 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      }
      seenStudentIds.add(uniqueId);
      sanitizedStudents.push({ ...s, id: uniqueId });
    }
    this.students = sanitizedStudents;
    saveToStorage('students', this.students);
    this.assessments = loadFromStorage('assessments', initialAssessments);
    this.marks = loadFromStorage('marks', initialMarks);
    this.attendanceSessions = loadFromStorage('attendance_sessions', initialAttendanceSessions);
    this.attendanceRecords = loadFromStorage('attendance_records', initialAttendanceRecords);
    this.teachingUnits = loadFromStorage('teaching_units', initialTeachingUnits);
    this.lessons = loadFromStorage('lessons', initialLessons);
    this.physicalTests = loadFromStorage('physical_tests', initialPhysicalTests);
    this.testResults = loadFromStorage('test_results', initialTestResults);
    this.equipment = loadFromStorage('equipment', initialEquipment);
    this.injuries = loadFromStorage('injuries', initialInjuries);
    this.regulations = loadFromStorage('regulations', initialLegalRegulations);
    this.syncOnlineDatabase();
  }

  async syncOnlineDatabase(): Promise<boolean> {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        if (json.initialized && json.data) {
          const db = json.data;
          if (db.profile) this.profile = db.profile;
          if (Array.isArray(db.classes)) this.classes = db.classes;
          if (Array.isArray(db.students)) this.students = db.students;
          if (Array.isArray(db.assessments)) this.assessments = db.assessments;
          if (Array.isArray(db.marks)) this.marks = db.marks;
          if (Array.isArray(db.attendance_sessions)) this.attendanceSessions = db.attendance_sessions;
          if (Array.isArray(db.attendance_records)) this.attendanceRecords = db.attendance_records;
          if (Array.isArray(db.teaching_units)) this.teachingUnits = db.teaching_units;
          if (Array.isArray(db.lessons)) this.lessons = db.lessons;
          if (Array.isArray(db.physical_tests)) this.physicalTests = db.physical_tests;
          if (Array.isArray(db.test_results)) this.testResults = db.test_results;
          if (Array.isArray(db.equipment)) this.equipment = db.equipment;
          if (Array.isArray(db.injuries)) this.injuries = db.injuries;
          if (Array.isArray(db.regulations)) this.regulations = db.regulations;
          return true;
        } else {
          await this.saveFullDatabaseOnline();
          return true;
        }
      }
    } catch (err) {
      // offline fallback
    }
    return false;
  }

  async saveFullDatabaseOnline(): Promise<void> {
    const fullDb = {
      profile: this.profile,
      classes: this.classes,
      students: this.students,
      assessments: this.assessments,
      marks: this.marks,
      attendance_sessions: this.attendanceSessions,
      attendance_records: this.attendanceRecords,
      teaching_units: this.teachingUnits,
      lessons: this.lessons,
      physical_tests: this.physicalTests,
      test_results: this.testResults,
      equipment: this.equipment,
      injuries: this.injuries,
      regulations: this.regulations,
    };
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullDb }),
      });
    } catch (e) {
      // offline warning
    }
  }

  // --- Profile ---
  getProfile(): Profile {
    return { ...this.profile };
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    this.profile = { ...this.profile, ...updates };
    saveToStorage('profile', this.profile);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('profiles').upsert(this.profile);
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }
    return this.profile;
  }

  // --- Classes & Assignment Logic ---
  // Mandatory: returns ONLY the classes assigned to this teacher
  getTeacherAssignedClasses(): SchoolClass[] {
    return this.classes.filter((c) => Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true'));
  }

  // Returns ALL classes existing in the high school
  getAllSchoolClasses(): SchoolClass[] {
    return [...this.classes];
  }

  getClassById(classId: string): SchoolClass | undefined {
    return this.classes.find((c) => c.id === classId);
  }

  async toggleClassAssignment(classId: string, isAssigned: boolean): Promise<SchoolClass[]> {
    const isAssignedBool = Boolean(isAssigned === true || (isAssigned as any) === 'true');
    this.classes = this.classes.map((c) => (c.id === classId ? { ...c, is_assigned: isAssignedBool } : c));
    saveToStorage('classes', this.classes);
    return this.getAllSchoolClasses();
  }

  async addClass(newClass: Omit<SchoolClass, 'id'>): Promise<SchoolClass> {
    const created: SchoolClass = {
      ...newClass,
      id: 'cls-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.classes = [created, ...this.classes];
    saveToStorage('classes', this.classes);
    return created;
  }

  async updateClass(classId: string, updates: Partial<SchoolClass>): Promise<SchoolClass> {
    this.classes = this.classes.map((c) => (c.id === classId ? { ...c, ...updates } : c));
    saveToStorage('classes', this.classes);
    const updated = this.classes.find((c) => c.id === classId)!;
    return updated;
  }

  async deleteClass(classId: string): Promise<boolean> {
    this.classes = this.classes.filter((c) => c.id !== classId);
    const removedStudentIds = new Set(this.students.filter((s) => s.class_id === classId).map((s) => s.id));
    this.students = this.students.filter((s) => s.class_id !== classId);
    this.assessments = this.assessments.filter((a) => a.class_id !== classId);
    this.marks = this.marks.filter((m) => !removedStudentIds.has(m.student_id));
    const removedSessionIds = new Set(this.attendanceSessions.filter((s) => s.class_id === classId).map((s) => s.id));
    this.attendanceSessions = this.attendanceSessions.filter((s) => s.class_id !== classId);
    this.attendanceRecords = this.attendanceRecords.filter((r) => !removedSessionIds.has(r.session_id));

    saveToStorage('classes', this.classes);
    saveToStorage('students', this.students);
    saveToStorage('assessments', this.assessments);
    saveToStorage('marks', this.marks);
    saveToStorage('attendance_sessions', this.attendanceSessions);
    saveToStorage('attendance_records', this.attendanceRecords);
    return true;
  }

  async clearSchoolYearData(clearClasses: boolean = true): Promise<void> {
    if (clearClasses) {
      this.classes = [];
    } else {
      this.classes = this.classes.map((c) => ({ ...c, student_count: 0 }));
    }
    this.students = [];
    this.assessments = [];
    this.marks = [];
    this.attendanceSessions = [];
    this.attendanceRecords = [];
    this.testResults = [];

    saveToStorage('classes', this.classes);
    saveToStorage('students', this.students);
    saveToStorage('assessments', this.assessments);
    saveToStorage('marks', this.marks);
    saveToStorage('attendance_sessions', this.attendanceSessions);
    saveToStorage('attendance_records', this.attendanceRecords);
    saveToStorage('test_results', this.testResults);
  }

  // --- Students ---
  getStudentsByClass(classId: string): Student[] {
    return this.students.filter((s) => s.class_id === classId);
  }

  getAllStudents(): Student[] {
    return [...this.students];
  }

  async addStudent(studentData: Omit<Student, 'id'>): Promise<Student> {
    const created: Student = {
      ...studentData,
      id: 'std-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.students = [...this.students, created];
    // update class student count
    const count = this.students.filter((s) => s.class_id === studentData.class_id).length;
    await this.updateClass(studentData.class_id, { student_count: count });
    saveToStorage('students', this.students);
    return created;
  }

  async bulkAddStudents(studentsData: Omit<Student, 'id'>[]): Promise<Student[]> {
    if (studentsData.length === 0) return [];
    const createdList: Student[] = studentsData.map((s, idx) => ({
      ...s,
      id: 'std-' + Date.now().toString(36) + idx + Math.random().toString(36).substring(2, 5),
    }));
    this.students = [...this.students, ...createdList];
    // update class counts
    const affectedClassIds = Array.from(new Set(studentsData.map((s) => s.class_id)));
    for (const cId of affectedClassIds) {
      const count = this.students.filter((s) => s.class_id === cId).length;
      await this.updateClass(cId, { student_count: count });
    }
    saveToStorage('students', this.students);
    return createdList;
  }

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    this.students = this.students.map((s) => (s.id === studentId ? { ...s, ...updates } : s));
    saveToStorage('students', this.students);
    return this.students.find((s) => s.id === studentId)!;
  }

  async deleteStudent(studentId: string): Promise<boolean> {
    const target = this.students.find((s) => s.id === studentId);
    if (!target) return false;
    this.students = this.students.filter((s) => s.id !== studentId);
    this.marks = this.marks.filter((m) => m.student_id !== studentId);
    this.attendanceRecords = this.attendanceRecords.filter((r) => r.student_id !== studentId);
    const count = this.students.filter((s) => s.class_id === target.class_id).length;
    await this.updateClass(target.class_id, { student_count: count });
    saveToStorage('students', this.students);
    saveToStorage('marks', this.marks);
    saveToStorage('attendance_records', this.attendanceRecords);
    return true;
  }

  // --- Assessments & Marks ---
  getAssessments(classId: string, trimester?: 1 | 2 | 3): Assessment[] {
    return this.assessments.filter(
      (a) => a.class_id === classId && (!trimester || a.trimester === trimester)
    );
  }

  async addAssessment(assessmentData: Omit<Assessment, 'id'>): Promise<Assessment> {
    const created: Assessment = {
      ...assessmentData,
      id: 'ass-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.assessments = [...this.assessments, created];
    saveToStorage('assessments', this.assessments);
    return created;
  }

  async deleteAssessment(assessmentId: string): Promise<boolean> {
    this.assessments = this.assessments.filter((a) => a.id !== assessmentId);
    this.marks = this.marks.filter((m) => m.assessment_id !== assessmentId);
    saveToStorage('assessments', this.assessments);
    saveToStorage('marks', this.marks);
    return true;
  }

  getMarksByAssessment(assessmentId: string): Mark[] {
    return this.marks.filter((m) => m.assessment_id === assessmentId);
  }

  getAllMarksForClassAndTrimester(classId: string, trimester: 1 | 2 | 3): {
    assessments: Assessment[];
    students: Student[];
    matrix: Record<string, Record<string, number | null>>; // studentId -> assessmentId -> score
    averages: Record<string, number | null>; // studentId -> calculated weighted average
    classAverage: number;
  } {
    const assessments = this.getAssessments(classId, trimester);
    const students = this.getStudentsByClass(classId);
    const assessmentIds = new Set(assessments.map((a) => a.id));

    const matrix: Record<string, Record<string, number | null>> = {};
    students.forEach((s) => {
      matrix[s.id] = {};
    });

    this.marks.forEach((m) => {
      if (assessmentIds.has(m.assessment_id) && matrix[m.student_id]) {
        matrix[m.student_id][m.assessment_id] = m.score;
      }
    });

    const averages: Record<string, number | null> = {};
    let totalScoreSum = 0;
    let totalGradedStudents = 0;

    students.forEach((s) => {
      let sum = 0;
      let totalWeight = 0;
      assessments.forEach((a) => {
        const val = matrix[s.id]?.[a.id];
        if (typeof val === 'number') {
          sum += val * a.weight;
          totalWeight += a.weight;
        }
      });

      if (totalWeight > 0) {
        const avg = Number((sum / totalWeight).toFixed(2));
        averages[s.id] = avg;
        totalScoreSum += avg;
        totalGradedStudents++;
      } else {
        averages[s.id] = null;
      }
    });

    const classAverage = totalGradedStudents > 0 ? Number((totalScoreSum / totalGradedStudents).toFixed(2)) : 0;

    return { assessments, students, matrix, averages, classAverage };
  }

  async saveMark(assessmentId: string, studentId: string, score: number | null, notes?: string): Promise<Mark> {
    if (score !== null && (score < 0 || score > 20)) {
      throw new Error('العلامة يجب أن تكون بين 0 و20');
    }

    const existingIdx = this.marks.findIndex(
      (m) => m.assessment_id === assessmentId && m.student_id === studentId
    );

    if (existingIdx >= 0) {
      this.marks[existingIdx] = {
        ...this.marks[existingIdx],
        score,
        notes: notes !== undefined ? notes : this.marks[existingIdx].notes,
      };
    } else {
      this.marks.push({
        id: 'm-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        assessment_id: assessmentId,
        student_id: studentId,
        user_id: this.profile.id,
        score,
        notes,
      });
    }

    saveToStorage('marks', this.marks);
    return this.marks.find((m) => m.assessment_id === assessmentId && m.student_id === studentId)!;
  }

  // --- Attendance Sessions & Records ---
  getAttendanceSessions(classId: string): AttendanceSession[] {
    return this.attendanceSessions
      .filter((s) => s.class_id === classId)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
  }

  getAttendanceRecords(sessionId: string): AttendanceRecord[] {
    return this.attendanceRecords.filter((r) => r.session_id === sessionId);
  }

  async saveAttendanceSession(
    sessionData: Omit<AttendanceSession, 'id'>,
    records: { student_id: string; status: AttendanceStatus; notes?: string }[]
  ): Promise<{ session: AttendanceSession; records: AttendanceRecord[] }> {
    // Check if session on this date & number already exists
    let session = this.attendanceSessions.find(
      (s) =>
        s.class_id === sessionData.class_id &&
        s.session_date === sessionData.session_date &&
        s.session_number === sessionData.session_number
    );

    if (!session) {
      session = {
        ...sessionData,
        id: 'att-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      };
      this.attendanceSessions.push(session);
    } else {
      session = { ...session, ...sessionData };
      this.attendanceSessions = this.attendanceSessions.map((s) => (s.id === session!.id ? session! : s));
    }

    // Save records
    const sessionRecords: AttendanceRecord[] = [];
    records.forEach((rec) => {
      const existingIdx = this.attendanceRecords.findIndex(
        (r) => r.session_id === session!.id && r.student_id === rec.student_id
      );
      if (existingIdx >= 0) {
        this.attendanceRecords[existingIdx] = {
          ...this.attendanceRecords[existingIdx],
          status: rec.status,
          notes: rec.notes,
        };
        sessionRecords.push(this.attendanceRecords[existingIdx]);
      } else {
        const newRec: AttendanceRecord = {
          id: 'rec-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
          session_id: session!.id,
          student_id: rec.student_id,
          user_id: this.profile.id,
          status: rec.status,
          notes: rec.notes,
        };
        this.attendanceRecords.push(newRec);
        sessionRecords.push(newRec);
      }
    });

    saveToStorage('attendance_sessions', this.attendanceSessions);
    saveToStorage('attendance_records', this.attendanceRecords);

    return { session, records: sessionRecords };
  }

  // --- Lessons & Preparation ---
  getLessons(classId?: string): Lesson[] {
    if (!classId) return [...this.lessons].sort((a, b) => b.lesson_number - a.lesson_number);
    return this.lessons
      .filter((l) => !l.class_id || l.class_id === classId)
      .sort((a, b) => b.lesson_number - a.lesson_number);
  }

  async saveLesson(lessonData: Omit<Lesson, 'id'>, existingId?: string): Promise<Lesson> {
    if (existingId) {
      const idx = this.lessons.findIndex((l) => l.id === existingId);
      if (idx >= 0) {
        this.lessons[idx] = { ...this.lessons[idx], ...lessonData };
        saveToStorage('lessons', this.lessons);
        return this.lessons[idx];
      }
    }
    const created: Lesson = {
      ...lessonData,
      id: 'lsn-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.lessons = [created, ...this.lessons];
    saveToStorage('lessons', this.lessons);
    return created;
  }

  async deleteLesson(lessonId: string): Promise<boolean> {
    this.lessons = this.lessons.filter((l) => l.id !== lessonId);
    saveToStorage('lessons', this.lessons);
    return true;
  }

  // --- Teaching Units ---
  getTeachingUnits(gradeLevel?: string): TeachingUnit[] {
    if (!gradeLevel) return [...this.teachingUnits];
    return this.teachingUnits.filter((u) => u.grade_level === gradeLevel);
  }

  async saveTeachingUnit(unitData: Omit<TeachingUnit, 'id'>, existingId?: string): Promise<TeachingUnit> {
    if (existingId) {
      const idx = this.teachingUnits.findIndex((u) => u.id === existingId);
      if (idx >= 0) {
        this.teachingUnits[idx] = { ...this.teachingUnits[idx], ...unitData };
        saveToStorage('teaching_units', this.teachingUnits);
        return this.teachingUnits[idx];
      }
    }
    const created: TeachingUnit = {
      ...unitData,
      id: 'unit-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.teachingUnits.push(created);
    saveToStorage('teaching_units', this.teachingUnits);
    return created;
  }

  // --- Physical Tests ---
  getPhysicalTests(classId?: string): PhysicalTest[] {
    if (!classId) return [...this.physicalTests];
    return this.physicalTests.filter((t) => !t.class_id || t.class_id === classId);
  }

  getTestResults(testId: string): PhysicalTestResult[] {
    return this.testResults.filter((r) => r.test_id === testId);
  }

  async saveTestResult(
    testId: string,
    studentId: string,
    resultValue: number,
    grade?: number,
    notes?: string
  ): Promise<PhysicalTestResult> {
    const existingIdx = this.testResults.findIndex(
      (r) => r.test_id === testId && r.student_id === studentId
    );
    if (existingIdx >= 0) {
      this.testResults[existingIdx] = {
        ...this.testResults[existingIdx],
        result_value: resultValue,
        grade,
        notes,
      };
      saveToStorage('test_results', this.testResults);
      return this.testResults[existingIdx];
    } else {
      const created: PhysicalTestResult = {
        id: 'res-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        test_id: testId,
        student_id: studentId,
        user_id: this.profile.id,
        test_date: new Date().toISOString().split('T')[0],
        result_value: resultValue,
        grade,
        notes,
      };
      this.testResults.push(created);
      saveToStorage('test_results', this.testResults);
      return created;
    }
  }

  // --- Sports Equipment ---
  getEquipment(): SportsEquipment[] {
    return [...this.equipment];
  }

  async saveEquipment(itemData: Omit<SportsEquipment, 'id'>, existingId?: string): Promise<SportsEquipment> {
    if (existingId) {
      const idx = this.equipment.findIndex((e) => e.id === existingId);
      if (idx >= 0) {
        this.equipment[idx] = { ...this.equipment[idx], ...itemData };
        saveToStorage('equipment', this.equipment);
        return this.equipment[idx];
      }
    }
    const created: SportsEquipment = {
      ...itemData,
      id: 'eq-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.equipment.push(created);
    saveToStorage('equipment', this.equipment);
    return created;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    this.equipment = this.equipment.filter((e) => e.id !== id);
    saveToStorage('equipment', this.equipment);
    return true;
  }

  // --- Injuries & Accidents ---
  getInjuries(): StudentInjury[] {
    return [...this.injuries].sort((a, b) => new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime());
  }

  async saveInjury(injuryData: Omit<StudentInjury, 'id'>): Promise<StudentInjury> {
    const created: StudentInjury = {
      ...injuryData,
      id: 'inj-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.injuries = [created, ...this.injuries];
    saveToStorage('injuries', this.injuries);
    return created;
  }

  // --- Regulations & Legal Texts ---
  getRegulations(): LegalRegulation[] {
    return [...this.regulations];
  }

  // --- Reset to default initial Algerian PE data ---
  resetToDefaultData(): void {
    localStorage.clear();
    this.profile = initialProfile;
    this.classes = initialClasses;
    this.students = initialStudents;
    this.assessments = initialAssessments;
    this.marks = initialMarks;
    this.attendanceSessions = initialAttendanceSessions;
    this.attendanceRecords = initialAttendanceRecords;
    this.teachingUnits = initialTeachingUnits;
    this.lessons = initialLessons;
    this.physicalTests = initialPhysicalTests;
    this.testResults = initialTestResults;
    this.equipment = initialEquipment;
    this.injuries = initialInjuries;
    this.regulations = initialLegalRegulations;

    saveToStorage('profile', this.profile);
    saveToStorage('classes', this.classes);
    saveToStorage('students', this.students);
    saveToStorage('assessments', this.assessments);
    saveToStorage('marks', this.marks);
    saveToStorage('attendance_sessions', this.attendanceSessions);
    saveToStorage('attendance_records', this.attendanceRecords);
    saveToStorage('teaching_units', this.teachingUnits);
    saveToStorage('lessons', this.lessons);
    saveToStorage('physical_tests', this.physicalTests);
    saveToStorage('test_results', this.testResults);
    saveToStorage('equipment', this.equipment);
    saveToStorage('injuries', this.injuries);
    saveToStorage('regulations', this.regulations);
  }
}

export const dataRepository = new DataRepository();
