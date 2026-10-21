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
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

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
  private unsubscribers: Unsubscribe[] = [];
  public isReady: boolean = false;
  public isSyncing: boolean = false;

  constructor() {
    this.profile = { ...initialProfile };
    this.classes = [...initialClasses];
    this.students = [...initialStudents];
    this.assessments = [...initialAssessments];
    this.marks = [...initialMarks];
    this.attendanceSessions = [...initialAttendanceSessions];
    this.attendanceRecords = [...initialAttendanceRecords];
    this.teachingUnits = [...initialTeachingUnits];
    this.lessons = [...initialLessons];
    this.physicalTests = [...initialPhysicalTests];
    this.testResults = [...initialTestResults];
    this.equipment = [...initialEquipment];
    this.injuries = [...initialInjuries];
    this.regulations = [...initialLegalRegulations];

    // Initialize universal real-time Firestore synchronization directly for all users
    this.initializeRealtimeSync();

    // Optionally update profile details if user logs into Firebase Auth
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email) this.profile.email = user.email;
        if (user.displayName) this.profile.full_name = user.displayName;
        this.notifyListeners();
      }
    });
  }

  private cleanupUnsubscribers() {
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
    this.unsubscribers = [];
  }

  /**
   * Universal real-time synchronization with Firebase Firestore.
   * Shared database accessible to all users without requiring Google authentication.
   */
  public async initializeRealtimeSync() {
    this.cleanupUnsubscribers();
    this.isSyncing = true;

    try {
      // 1. Profile listener
      const profileRef = doc(db, 'profiles', 'active_profile');
      const unsubProfile = onSnapshot(
        profileRef,
        (snap) => {
          if (snap.exists()) {
            this.profile = { ...this.profile, ...(snap.data() as Profile) };
            this.notifyListeners();
          }
        },
        (err) => console.warn('Profile sync listener info:', err)
      );
      this.unsubscribers.push(unsubProfile);

      // 2. Real-time listeners for all shared collections (open to everyone)
      const collectionsConfig: {
        name: string;
        setter: (data: any[]) => void;
      }[] = [
        { name: 'classes', setter: (data) => (this.classes = data as SchoolClass[]) },
        { name: 'students', setter: (data) => (this.students = data as Student[]) },
        { name: 'assessments', setter: (data) => (this.assessments = data as Assessment[]) },
        { name: 'marks', setter: (data) => (this.marks = data as Mark[]) },
        { name: 'attendance_sessions', setter: (data) => (this.attendanceSessions = data as AttendanceSession[]) },
        { name: 'attendance_records', setter: (data) => (this.attendanceRecords = data as AttendanceRecord[]) },
        { name: 'lessons', setter: (data) => (this.lessons = data as Lesson[]) },
        { name: 'teaching_units', setter: (data) => (this.teachingUnits = data as TeachingUnit[]) },
        { name: 'physical_tests', setter: (data) => (this.physicalTests = data as PhysicalTest[]) },
        { name: 'test_results', setter: (data) => (this.testResults = data as PhysicalTestResult[]) },
        { name: 'equipment', setter: (data) => (this.equipment = data as SportsEquipment[]) },
        { name: 'injuries', setter: (data) => (this.injuries = data as StudentInjury[]) },
        { name: 'regulations', setter: (data) => (this.regulations = data as LegalRegulation[]) },
      ];

      for (const coll of collectionsConfig) {
        const collRef = collection(db, coll.name);
        const unsub = onSnapshot(
          collRef,
          (snapshot) => {
            const items = snapshot.docs.map((docSnap) => docSnap.data());
            // If documents exist in Firestore, populate in-memory store
            if (items.length > 0) {
              coll.setter(items);
            }
            this.notifyListeners();
          },
          (err) => console.warn(`Firestore sync listener on ${coll.name}:`, err)
        );
        this.unsubscribers.push(unsub);
      }

      // 3. Initial check: If Firestore has 0 classes, seed the initial state
      const classesSnap = await getDocs(collection(db, 'classes'));
      if (classesSnap.empty && this.classes.length > 0) {
        await this.forceUploadAllToFirestore();
      }

      this.isReady = true;
      this.isSyncing = false;
      this.notifyListeners();
    } catch (e) {
      console.warn('Firestore initial sync notice:', e);
      this.isReady = true;
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public async handleUserAuthenticated(user: User) {
    if (user.email) this.profile.email = user.email;
    if (user.displayName) this.profile.full_name = user.displayName;
    this.notifyListeners();
  }

  /**
   * Force push all current data directly to Firestore collections.
   * Open to all users without requiring Google account.
   */
  public async forceUploadAllToFirestore(): Promise<{ success: boolean; count: number; error?: string }> {
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';

    try {
      this.isSyncing = true;
      let totalCount = 0;

      // 1. Profile
      await setDoc(doc(db, 'profiles', 'active_profile'), { ...this.profile, id: currentUid }, { merge: true });
      totalCount++;

      // 2. Classes
      for (const c of this.classes) {
        const clsData = { ...c, user_id: currentUid };
        await setDoc(doc(db, 'classes', c.id), clsData);
        totalCount++;
      }

      // 3. Students
      for (const s of this.students) {
        const sData = { ...s, user_id: currentUid };
        await setDoc(doc(db, 'students', s.id), sData);
        totalCount++;
      }

      // 4. Assessments
      for (const a of this.assessments) {
        const aData = { ...a, user_id: currentUid };
        await setDoc(doc(db, 'assessments', a.id), aData);
        totalCount++;
      }

      // 5. Marks
      for (const m of this.marks) {
        const mData = { ...m, user_id: currentUid };
        await setDoc(doc(db, 'marks', m.id), mData);
        totalCount++;
      }

      // 6. Attendance Sessions & Records
      for (const att of this.attendanceSessions) {
        const attData = { ...att, user_id: currentUid };
        await setDoc(doc(db, 'attendance_sessions', att.id), attData);
        totalCount++;
      }
      for (const rec of this.attendanceRecords) {
        const recData = { ...rec, user_id: currentUid };
        await setDoc(doc(db, 'attendance_records', rec.id), recData);
        totalCount++;
      }

      // 7. Lessons
      for (const lsn of this.lessons) {
        const lsnData = { ...lsn, user_id: currentUid };
        await setDoc(doc(db, 'lessons', lsn.id), lsnData);
        totalCount++;
      }

      // 8. Teaching Units
      for (const unit of this.teachingUnits) {
        const unitData = { ...unit, user_id: currentUid };
        await setDoc(doc(db, 'teaching_units', unit.id), unitData);
        totalCount++;
      }

      // 9. Physical Tests & Results
      for (const test of this.physicalTests) {
        const testData = { ...test, user_id: currentUid };
        await setDoc(doc(db, 'physical_tests', test.id), testData);
        totalCount++;
      }
      for (const res of this.testResults) {
        const resData = { ...res, user_id: currentUid };
        await setDoc(doc(db, 'test_results', res.id), resData);
        totalCount++;
      }

      // 10. Equipment
      for (const eq of this.equipment) {
        const eqData = { ...eq, user_id: currentUid };
        await setDoc(doc(db, 'equipment', eq.id), eqData);
        totalCount++;
      }

      // 11. Injuries & Regulations
      for (const inj of this.injuries) {
        const injData = { ...inj, user_id: currentUid };
        await setDoc(doc(db, 'injuries', inj.id), injData);
        totalCount++;
      }
      for (const reg of this.regulations) {
        const regData = { ...reg, user_id: currentUid };
        await setDoc(doc(db, 'regulations', reg.id), regData);
        totalCount++;
      }

      this.isSyncing = false;
      this.notifyListeners();
      return { success: true, count: totalCount };
    } catch (e: any) {
      this.isSyncing = false;
      console.error('Error force-uploading all data to Firebase:', e);
      return { success: false, count: 0, error: e.message };
    }
  }

  // --- Subscriptions ---
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

  // --- Profile ---
  getProfile(): Profile {
    return { ...this.profile };
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    this.profile = { ...this.profile, ...updates };

    try {
      await setDoc(doc(db, 'profiles', 'active_profile'), this.profile, { merge: true });
    } catch (e) {
      console.warn('Firebase profile update warning:', e);
    }
    this.notifyListeners();
    return this.profile;
  }

  // --- Classes ---
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

    try {
      await updateDoc(doc(db, 'classes', classId), { is_assigned: isAssignedBool });
    } catch (e) {
      console.error('Error updating class assignment in Firebase:', e);
    }
    this.notifyListeners();
    return this.getAllSchoolClasses();
  }

  async addClass(newClass: Omit<SchoolClass, 'id'>): Promise<SchoolClass> {
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    const created: SchoolClass = {
      ...newClass,
      user_id: currentUid,
      id: 'cls-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.classes = [created, ...this.classes];

    try {
      await setDoc(doc(db, 'classes', created.id), created);
    } catch (e) {
      console.error('Error saving class to Firestore:', e);
    }
    this.notifyListeners();
    return created;
  }

  async updateClass(classId: string, updates: Partial<SchoolClass>): Promise<SchoolClass> {
    this.classes = this.classes.map((c) => (c.id === classId ? { ...c, ...updates } : c));

    try {
      await updateDoc(doc(db, 'classes', classId), updates);
    } catch (e) {
      console.error('Error updating class in Firestore:', e);
    }
    this.notifyListeners();
    const updated = this.classes.find((c) => c.id === classId)!;
    return updated;
  }

  async deleteClass(classId: string): Promise<boolean> {
    this.classes = this.classes.filter((c) => c.id !== classId);

    try {
      await deleteDoc(doc(db, 'classes', classId));
    } catch (e) {
      console.error('Error deleting class from Firestore:', e);
    }
    this.notifyListeners();
    return true;
  }

  // --- Students ---
  getStudentsByClass(classId: string): Student[] {
    return this.students.filter((s) => s.class_id === classId);
  }

  getAllStudents(): Student[] {
    return [...this.students];
  }

  async addStudent(studentData: Omit<Student, 'id'>): Promise<Student> {
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    const created: Student = {
      ...studentData,
      user_id: currentUid,
      id: 'std-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.students = [...this.students, created];
    const count = this.students.filter((s) => s.class_id === studentData.class_id).length;
    await this.updateClass(studentData.class_id, { student_count: count });

    try {
      await setDoc(doc(db, 'students', created.id), created);
    } catch (e) {
      console.error('Error saving student to Firestore:', e);
    }

    this.notifyListeners();
    return created;
  }

  async bulkAddStudents(studentsData: Omit<Student, 'id'>[]): Promise<Student[]> {
    if (studentsData.length === 0) return [];
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    const createdList: Student[] = studentsData.map((s, idx) => ({
      ...s,
      user_id: currentUid,
      id: 'std-' + Date.now().toString(36) + idx + Math.random().toString(36).substring(2, 5),
    }));

    this.students = [...this.students, ...createdList];
    const affectedClassIds = Array.from(new Set(studentsData.map((s) => s.class_id)));
    for (const cId of affectedClassIds) {
      const count = this.students.filter((s) => s.class_id === cId).length;
      await this.updateClass(cId, { student_count: count });
    }

    try {
      for (const s of createdList) {
        await setDoc(doc(db, 'students', s.id), s);
      }
    } catch (e) {
      console.error('Error bulk-adding students to Firestore:', e);
    }

    this.notifyListeners();
    return createdList;
  }

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    this.students = this.students.map((s) => (s.id === studentId ? { ...s, ...updates } : s));

    try {
      await updateDoc(doc(db, 'students', studentId), updates);
    } catch (e) {
      console.error('Error updating student in Firestore:', e);
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

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (e) {
      console.error('Error deleting student from Firestore:', e);
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
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    const created: Assessment = {
      ...assessmentData,
      user_id: currentUid,
      id: 'ass-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.assessments = [...this.assessments, created];

    try {
      await setDoc(doc(db, 'assessments', created.id), created);
    } catch (e) {
      console.error('Error adding assessment to Firestore:', e);
    }

    this.notifyListeners();
    return created;
  }

  async deleteAssessment(assessmentId: string): Promise<boolean> {
    this.assessments = this.assessments.filter((a) => a.id !== assessmentId);
    this.marks = this.marks.filter((m) => m.assessment_id !== assessmentId);

    try {
      await deleteDoc(doc(db, 'assessments', assessmentId));
      const q = query(collection(db, 'marks'), where('assessment_id', '==', assessmentId));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    } catch (e) {
      console.error('Error deleting assessment from Firestore:', e);
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

    const currentUid = auth.currentUser?.uid || this.profile.id;
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
        user_id: currentUid,
        score,
        notes,
      };
      this.marks.push(mark);
    }

    try {
      await setDoc(doc(db, 'marks', mark.id), mark);
    } catch (e) {
      console.error('Error saving mark to Firestore:', e);
    }

    this.notifyListeners();
    return mark;
  }

  // --- Attendance ---
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
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    let session = this.attendanceSessions.find(
      (s) =>
        s.class_id === sessionData.class_id &&
        s.session_date === sessionData.session_date &&
        s.session_number === sessionData.session_number
    );

    if (!session) {
      session = {
        ...sessionData,
        user_id: currentUid,
        id: 'att-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      };
      this.attendanceSessions.push(session);
    } else {
      session = { ...session, ...sessionData, user_id: currentUid };
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
          user_id: currentUid,
          status: rec.status,
          notes: rec.notes,
        };
        this.attendanceRecords.push(newRec);
        sessionRecords.push(newRec);
      }
    });

    try {
      await setDoc(doc(db, 'attendance_sessions', session.id), session);
      for (const rec of sessionRecords) {
        await setDoc(doc(db, 'attendance_records', rec.id), rec);
      }
    } catch (e) {
      console.error('Error saving attendance session to Firestore:', e);
    }

    this.notifyListeners();
    return { session, records: sessionRecords };
  }

  // --- Lessons ---
  getLessons(classId?: string): Lesson[] {
    if (!classId) return [...this.lessons].sort((a, b) => b.lesson_number - a.lesson_number);
    return this.lessons
      .filter((l) => !l.class_id || l.class_id === classId)
      .sort((a, b) => b.lesson_number - a.lesson_number);
  }

  async saveLesson(lessonData: Omit<Lesson, 'id'>, existingId?: string): Promise<Lesson> {
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    if (existingId) {
      const idx = this.lessons.findIndex((l) => l.id === existingId);
      if (idx >= 0) {
        this.lessons[idx] = { ...this.lessons[idx], ...lessonData, user_id: currentUid };
        try {
          await setDoc(doc(db, 'lessons', existingId), this.lessons[idx]);
        } catch (e) {
          console.error('Error updating lesson in Firestore:', e);
        }
        this.notifyListeners();
        return this.lessons[idx];
      }
    }

    const created: Lesson = {
      ...lessonData,
      user_id: currentUid,
      id: 'lsn-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.lessons = [created, ...this.lessons];

    try {
      await setDoc(doc(db, 'lessons', created.id), created);
    } catch (e) {
      console.error('Error saving lesson to Firestore:', e);
    }

    this.notifyListeners();
    return created;
  }

  async deleteLesson(lessonId: string): Promise<boolean> {
    this.lessons = this.lessons.filter((l) => l.id !== lessonId);

    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
    } catch (e) {
      console.error('Error deleting lesson from Firestore:', e);
    }

    this.notifyListeners();
    return true;
  }

  // --- Teaching Units ---
  getTeachingUnits(gradeLevel?: string): TeachingUnit[] {
    if (!gradeLevel) return [...this.teachingUnits];
    return this.teachingUnits.filter((u) => u.grade_level === gradeLevel);
  }

  async saveTeachingUnit(unitData: Omit<TeachingUnit, 'id'>, existingId?: string): Promise<TeachingUnit> {
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    if (existingId) {
      const idx = this.teachingUnits.findIndex((u) => u.id === existingId);
      if (idx >= 0) {
        this.teachingUnits[idx] = { ...this.teachingUnits[idx], ...unitData, user_id: currentUid };
        try {
          await setDoc(doc(db, 'teaching_units', existingId), this.teachingUnits[idx]);
        } catch (e) {
          console.error('Error updating teaching unit in Firestore:', e);
        }
        this.notifyListeners();
        return this.teachingUnits[idx];
      }
    }

    const created: TeachingUnit = {
      ...unitData,
      user_id: currentUid,
      id: 'unit-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.teachingUnits.push(created);

    try {
      await setDoc(doc(db, 'teaching_units', created.id), created);
    } catch (e) {
      console.error('Error saving teaching unit to Firestore:', e);
    }

    this.notifyListeners();
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
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    const existingIdx = this.testResults.findIndex(
      (r) => r.test_id === testId && r.student_id === studentId
    );

    if (existingIdx >= 0) {
      this.testResults[existingIdx] = {
        ...this.testResults[existingIdx],
        user_id: currentUid,
        result_value: resultValue,
        grade,
        notes,
      };

      try {
        await setDoc(doc(db, 'test_results', this.testResults[existingIdx].id), this.testResults[existingIdx]);
      } catch (e) {
        console.error('Error updating test result in Firestore:', e);
      }

      this.notifyListeners();
      return this.testResults[existingIdx];
    } else {
      const created: PhysicalTestResult = {
        id: 'res-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        test_id: testId,
        student_id: studentId,
        user_id: currentUid,
        test_date: new Date().toISOString().split('T')[0],
        result_value: resultValue,
        grade,
        notes,
      };
      this.testResults.push(created);

      try {
        await setDoc(doc(db, 'test_results', created.id), created);
      } catch (e) {
        console.error('Error creating test result in Firestore:', e);
      }

      this.notifyListeners();
      return created;
    }
  }

  // --- Equipment ---
  getEquipment(): SportsEquipment[] {
    return [...this.equipment];
  }

  async saveEquipment(itemData: Omit<SportsEquipment, 'id'>, existingId?: string): Promise<SportsEquipment> {
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    if (existingId) {
      const idx = this.equipment.findIndex((e) => e.id === existingId);
      if (idx >= 0) {
        this.equipment[idx] = { ...this.equipment[idx], ...itemData, user_id: currentUid };
        try {
          await setDoc(doc(db, 'equipment', existingId), this.equipment[idx]);
        } catch (e) {
          console.error('Error updating equipment in Firestore:', e);
        }
        this.notifyListeners();
        return this.equipment[idx];
      }
    }

    const created: SportsEquipment = {
      ...itemData,
      user_id: currentUid,
      id: 'eq-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.equipment.push(created);

    try {
      await setDoc(doc(db, 'equipment', created.id), created);
    } catch (e) {
      console.error('Error saving equipment to Firestore:', e);
    }

    this.notifyListeners();
    return created;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    this.equipment = this.equipment.filter((e) => e.id !== id);

    try {
      await deleteDoc(doc(db, 'equipment', id));
    } catch (e) {
      console.error('Error deleting equipment from Firestore:', e);
    }

    this.notifyListeners();
    return true;
  }

  // --- Injuries ---
  getInjuries(): StudentInjury[] {
    return [...this.injuries].sort((a, b) => new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime());
  }

  async saveInjury(injuryData: Omit<StudentInjury, 'id'>): Promise<StudentInjury> {
    const currentUid = auth.currentUser?.uid || this.profile.id || 'shared-teacher';
    const created: StudentInjury = {
      ...injuryData,
      user_id: currentUid,
      id: 'inj-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    this.injuries = [created, ...this.injuries];

    try {
      await setDoc(doc(db, 'injuries', created.id), created);
    } catch (e) {
      console.error('Error saving injury to Firestore:', e);
    }

    this.notifyListeners();
    return created;
  }

  // --- Regulations ---
  getRegulations(): LegalRegulation[] {
    return [...this.regulations];
  }

  // --- Clear Year Data ---
  async clearSchoolYearData(clearClasses: boolean = true): Promise<void> {
    if (clearClasses) {
      for (const cls of this.classes) {
        try {
          await deleteDoc(doc(db, 'classes', cls.id));
        } catch (e) {
          console.error(e);
        }
      }
      this.classes = [];
    } else {
      this.classes = this.classes.map((c) => ({ ...c, student_count: 0 }));
      for (const cls of this.classes) {
        try {
          await updateDoc(doc(db, 'classes', cls.id), { student_count: 0 });
        } catch (e) {
          console.error(e);
        }
      }
    }

    for (const s of this.students) {
      try {
        await deleteDoc(doc(db, 'students', s.id));
      } catch (e) {
        console.error(e);
      }
    }
    for (const a of this.assessments) {
      try {
        await deleteDoc(doc(db, 'assessments', a.id));
      } catch (e) {
        console.error(e);
      }
    }
    for (const m of this.marks) {
      try {
        await deleteDoc(doc(db, 'marks', m.id));
      } catch (e) {
        console.error(e);
      }
    }
    for (const s of this.attendanceSessions) {
      try {
        await deleteDoc(doc(db, 'attendance_sessions', s.id));
      } catch (e) {
        console.error(e);
      }
    }
    for (const r of this.attendanceRecords) {
      try {
        await deleteDoc(doc(db, 'attendance_records', r.id));
      } catch (e) {
        console.error(e);
      }
    }
    for (const t of this.testResults) {
      try {
        await deleteDoc(doc(db, 'test_results', t.id));
      } catch (e) {
        console.error(e);
      }
    }

    this.students = [];
    this.assessments = [];
    this.marks = [];
    this.attendanceSessions = [];
    this.attendanceRecords = [];
    this.testResults = [];
    this.notifyListeners();
  }

  // --- Reset to default data ---
  resetToDefaultData(): void {
    this.profile = { ...initialProfile };
    this.classes = [...initialClasses];
    this.students = [...initialStudents];
    this.assessments = [...initialAssessments];
    this.marks = [...initialMarks];
    this.attendanceSessions = [...initialAttendanceSessions];
    this.attendanceRecords = [...initialAttendanceRecords];
    this.teachingUnits = [...initialTeachingUnits];
    this.lessons = [...initialLessons];
    this.physicalTests = [...initialPhysicalTests];
    this.testResults = [...initialTestResults];
    this.equipment = [...initialEquipment];
    this.injuries = [...initialInjuries];
    this.regulations = [...initialLegalRegulations];
    this.notifyListeners();
  }
}

export const dataRepository = new DataRepository();
