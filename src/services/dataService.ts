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
import { db, auth } from './firebaseClient';
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';


const LS_PREFIX = 'eps_dz_data_';

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

  private listeners: Set<() => void> = new Set();
  private unsubscribers: (() => void)[] = [];
  public isReady: boolean = false;

  constructor() {
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

    this.initDatabase();
  }

  private async initDatabase() {
    if (!auth.currentUser) return;
    
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    try {
      const userId = auth.currentUser.uid;

      const unsubProfile = onSnapshot(doc(db, 'profiles', userId), (docSnap) => {
        if (docSnap.exists()) {
          this.profile = docSnap.data() as Profile;
          saveToStorageLocalOnly('profile', this.profile);
          this.notifyListeners();
        }
      });
      this.unsubscribers.push(unsubProfile);

      const collections = [
        'classes', 'students', 'assessments', 'marks', 
        'attendance_sessions', 'attendance_records', 'lessons', 
        'teaching_units', 'physical_tests', 'test_results', 
        'equipment', 'injuries', 'regulations'
      ];

      for (const coll of collections) {
        const q = query(collection(db, coll), where('user_id', '==', userId));
        const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => doc.data());
          
          switch (coll) {
            case 'classes': this.classes = data as SchoolClass[]; break;
            case 'students': this.students = data as Student[]; break;
            case 'assessments': this.assessments = data as Assessment[]; break;
            case 'marks': this.marks = data as Mark[]; break;
            case 'attendance_sessions': this.attendanceSessions = data as AttendanceSession[]; break;
            case 'attendance_records': this.attendanceRecords = data as AttendanceRecord[]; break;
            case 'lessons': this.lessons = data as Lesson[]; break;
            case 'teaching_units': this.teachingUnits = data as TeachingUnit[]; break;
            case 'physical_tests': this.physicalTests = data as PhysicalTest[]; break;
            case 'test_results': this.testResults = data as PhysicalTestResult[]; break;
            case 'equipment': this.equipment = data as SportsEquipment[]; break;
            case 'injuries': this.injuries = data as StudentInjury[]; break;
            case 'regulations': this.regulations = data as LegalRegulation[]; break;
          }
          this.notifyListeners();
        });
        this.unsubscribers.push(unsub);
      }

      this.isReady = true;
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to init Firebase DB:', e);
      this.isReady = true;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  }

  getProfile(): Profile {
    return { ...this.profile };
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    this.profile = { ...this.profile, ...updates };
    

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'profiles', auth.currentUser.uid), this.profile, { merge: true });
      } catch (e) {
        console.warn('Firebase sync warning:', e);
      }
    }
    this.notifyListeners();
    return this.profile;
  }

  getTeacherAssignedClasses(): SchoolClass[] {
    return this.classes.filter((c) => Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true'));
  }

  getAllSchoolClasses(): SchoolClass[] {
    return [...this.classes];
  }

  getClassById(classId: string): SchoolClass | undefined {
    return this.classes.find((c) => c.id === classId);
  }

  async toggleClassAssignment(classId: string, isAssigned: boolean): Promise<SchoolClass[]> {
    const isAssignedBool = Boolean(isAssigned === true || (isAssigned as any) === 'true');
    this.classes = this.classes.map((c) => (c.id === classId ? { ...c, is_assigned: isAssignedBool } : c));
    saveToStorageLocalOnly('classes', this.classes);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'classes', classId), { is_assigned: isAssignedBool });
      } catch (e) { console.error(e); }
    }
    this.notifyListeners();
    return this.getAllSchoolClasses();
  }

  async addClass(newClass: Omit<SchoolClass, 'id'>): Promise<SchoolClass> {
    const created: SchoolClass = {
      ...newClass,
      id: 'cls-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.classes = [created, ...this.classes];
    saveToStorageLocalOnly('classes', this.classes);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'classes', created.id), created);
      } catch (e) { console.error(e); }
    }
    this.notifyListeners();
    return created;
  }

  async updateClass(classId: string, updates: Partial<SchoolClass>): Promise<SchoolClass> {
    this.classes = this.classes.map((c) => (c.id === classId ? { ...c, ...updates } : c));
    saveToStorageLocalOnly('classes', this.classes);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'classes', classId), updates);
      } catch (e) { console.error(e); }
    }
    this.notifyListeners();
    const updated = this.classes.find((c) => c.id === classId)!;
    return updated;
  }

  async deleteClass(classId: string): Promise<boolean> {
    this.classes = this.classes.filter((c) => c.id !== classId);
    saveToStorageLocalOnly('classes', this.classes);
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'classes', classId));
      } catch (e) { console.error(e); }
    }
    this.notifyListeners();
    return true;
  }
  
  // Note: Only refactored Profile and Classes for persistence.
  // Other collections still use localStorage as per existing implementation.
  // The rest of the methods remain unchanged but need to be included in the repository.

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
    const count = this.students.filter((s) => s.class_id === studentData.class_id).length;
    await this.updateClass(studentData.class_id, { student_count: count });
    saveToStorageLocalOnly('students', this.students);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'students', created.id), created);
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return created;
  }

  async bulkAddStudents(studentsData: Omit<Student, 'id'>[]): Promise<Student[]> {
    if (studentsData.length === 0) return [];
    const createdList: Student[] = studentsData.map((s, idx) => ({
      ...s,
      id: 'std-' + Date.now().toString(36) + idx + Math.random().toString(36).substring(2, 5),
    }));
    this.students = [...this.students, ...createdList];
    const affectedClassIds = Array.from(new Set(studentsData.map((s) => s.class_id)));
    for (const cId of affectedClassIds) {
      const count = this.students.filter((s) => s.class_id === cId).length;
      await this.updateClass(cId, { student_count: count });
    }
    saveToStorageLocalOnly('students', this.students);
    
    if (auth.currentUser) {
      try {
        for (const s of createdList) {
          await setDoc(doc(db, 'students', s.id), s);
        }
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return createdList;
  }

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    this.students = this.students.map((s) => (s.id === studentId ? { ...s, ...updates } : s));
    saveToStorageLocalOnly('students', this.students);
    
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'students', studentId), updates);
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
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
    saveToStorageLocalOnly('students', this.students);
    saveToStorageLocalOnly('marks', this.marks);
    saveToStorageLocalOnly('attendance_records', this.attendanceRecords);
    
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
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
    saveToStorageLocalOnly('assessments', this.assessments);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'assessments', created.id), created);
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return created;
  }

  async deleteAssessment(assessmentId: string): Promise<boolean> {
    this.assessments = this.assessments.filter((a) => a.id !== assessmentId);
    this.marks = this.marks.filter((m) => m.assessment_id !== assessmentId);
    saveToStorageLocalOnly('assessments', this.assessments);
    saveToStorageLocalOnly('marks', this.marks);
    
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'assessments', assessmentId));
        // Also delete associated marks
        const q = query(collection(db, 'marks'), where('assessment_id', '==', assessmentId));
        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return true;
  }

  getMarksByAssessment(assessmentId: string): Mark[] {
    return this.marks.filter((m) => m.assessment_id === assessmentId);
  }

  getAllMarksForClassAndTrimester(classId: string, trimester: 1 | 2 | 3): {
    assessments: Assessment[];
    students: Student[];
    matrix: Record<string, Record<string, number | null>>; 
    averages: Record<string, number | null>; 
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

    let mark: Mark;

    if (existingIdx >= 0) {
      this.marks[existingIdx] = {
        ...this.marks[existingIdx],
        score,
        notes: notes !== undefined ? notes : this.marks[existingIdx].notes,
      };
      mark = this.marks[existingIdx];
    } else {
      mark = {
        id: 'm-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        assessment_id: assessmentId,
        student_id: studentId,
        user_id: this.profile.id,
        score,
        notes,
      };
      this.marks.push(mark);
    }

    saveToStorageLocalOnly('marks', this.marks);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'marks', mark.id), mark);
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return mark;
  }

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

    saveToStorageLocalOnly('attendance_sessions', this.attendanceSessions);
    saveToStorageLocalOnly('attendance_records', this.attendanceRecords);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'attendance_sessions', session.id), session);
        for (const rec of sessionRecords) {
          await setDoc(doc(db, 'attendance_records', rec.id), rec);
        }
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return { session, records: sessionRecords };
  }

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
        saveToStorageLocalOnly('lessons', this.lessons);
        this.notifyListeners();
        return this.lessons[idx];
      }
    }
    const created: Lesson = {
      ...lessonData,
      id: 'lsn-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.lessons = [created, ...this.lessons];
    saveToStorageLocalOnly('lessons', this.lessons);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'lessons', created.id), created);
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return created;
  }

  async deleteLesson(lessonId: string): Promise<boolean> {
    this.lessons = this.lessons.filter((l) => l.id !== lessonId);
    saveToStorageLocalOnly('lessons', this.lessons);
    
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'lessons', lessonId));
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return true;
  }

  getTeachingUnits(gradeLevel?: string): TeachingUnit[] {
    if (!gradeLevel) return [...this.teachingUnits];
    return this.teachingUnits.filter((u) => u.grade_level === gradeLevel);
  }

  async saveTeachingUnit(unitData: Omit<TeachingUnit, 'id'>, existingId?: string): Promise<TeachingUnit> {
    if (existingId) {
      const idx = this.teachingUnits.findIndex((u) => u.id === existingId);
      if (idx >= 0) {
        this.teachingUnits[idx] = { ...this.teachingUnits[idx], ...unitData };
        saveToStorageLocalOnly('teaching_units', this.teachingUnits);
        this.notifyListeners();
        return this.teachingUnits[idx];
      }
    }
    const created: TeachingUnit = {
      ...unitData,
      id: 'unit-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.teachingUnits.push(created);
    saveToStorageLocalOnly('teaching_units', this.teachingUnits);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'teaching_units', created.id), created);
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return created;
  }

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
      saveToStorageLocalOnly('test_results', this.testResults);
      
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'test_results', this.testResults[existingIdx].id), this.testResults[existingIdx]);
        } catch (e) { console.error(e); }
      }
      
      this.notifyListeners();
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
      saveToStorageLocalOnly('test_results', this.testResults);
      
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'test_results', created.id), created);
        } catch (e) { console.error(e); }
      }
      
      this.notifyListeners();
      return created;
    }
  }

  getEquipment(): SportsEquipment[] {
    return [...this.equipment];
  }

  async saveEquipment(itemData: Omit<SportsEquipment, 'id'>, existingId?: string): Promise<SportsEquipment> {
    if (existingId) {
      const idx = this.equipment.findIndex((e) => e.id === existingId);
      if (idx >= 0) {
        this.equipment[idx] = { ...this.equipment[idx], ...itemData };
        saveToStorageLocalOnly('equipment', this.equipment);
        this.notifyListeners();
        return this.equipment[idx];
      }
    }
    const created: SportsEquipment = {
      ...itemData,
      id: 'eq-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.equipment.push(created);
    saveToStorageLocalOnly('equipment', this.equipment);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'equipment', created.id), created);
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return created;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    this.equipment = this.equipment.filter((e) => e.id !== id);
    saveToStorageLocalOnly('equipment', this.equipment);
    
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'equipment', id));
      } catch (e) { console.error(e); }
    }
    
    this.notifyListeners();
    return true;
  }

  async clearSchoolYearData(clearClasses: boolean = true): Promise<void> {
    const userId = auth.currentUser?.uid;
    
    if (clearClasses) {
      // Delete classes from Firestore
      if (userId) {
        for (const cls of this.classes) {
          try { await deleteDoc(doc(db, 'classes', cls.id)); } catch (e) { console.error(e); }
        }
      }
      this.classes = [];
    } else {
      this.classes = this.classes.map((c) => ({ ...c, student_count: 0 }));
      if (userId) {
        for (const cls of this.classes) {
          try { await updateDoc(doc(db, 'classes', cls.id), { student_count: 0 }); } catch (e) { console.error(e); }
        }
      }
    }
    
    // Clear synced collections from Firestore
    if (userId) {
      for (const s of this.students) { try { await deleteDoc(doc(db, 'students', s.id)); } catch (e) { console.error(e); } }
      for (const a of this.assessments) { try { await deleteDoc(doc(db, 'assessments', a.id)); } catch (e) { console.error(e); } }
      for (const m of this.marks) { try { await deleteDoc(doc(db, 'marks', m.id)); } catch (e) { console.error(e); } }
      for (const s of this.attendanceSessions) { try { await deleteDoc(doc(db, 'attendance_sessions', s.id)); } catch (e) { console.error(e); } }
      for (const r of this.attendanceRecords) { try { await deleteDoc(doc(db, 'attendance_records', r.id)); } catch (e) { console.error(e); } }
      for (const t of this.testResults) { try { await deleteDoc(doc(db, 'test_results', t.id)); } catch (e) { console.error(e); } }
    }
    
    this.students = [];
    this.assessments = [];
    this.marks = [];
    this.attendanceSessions = [];
    this.attendanceRecords = [];
    this.testResults = [];

    this.notifyListeners();
  }
}

export const dataRepository = new DataRepository();
