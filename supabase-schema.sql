-- ==============================================================================
-- EPS DZ - قاعدة بيانات تسيير أستاذ التربية البدنية والرياضية (الطور الثانوي)
-- PostgreSQL Schema for Supabase with Row Level Security (RLS)
-- ==============================================================================

-- تفعيل الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول الملف الشخصي للأستاذ (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'أستاذ التربية البدنية',
    school_name TEXT NOT NULL DEFAULT 'ثانوية أول نوفمبر 1954 - جديوية',
    wilaya TEXT NOT NULL DEFAULT 'غليزان',
    municipality TEXT NOT NULL DEFAULT 'جديوية',
    academic_year TEXT NOT NULL DEFAULT '2026 / 2027',
    specialty TEXT NOT NULL DEFAULT 'التربية البدنية والرياضية',
    phone TEXT,
    school_logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الأقسام (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- مثال: 3AS-SE-1
    name TEXT NOT NULL, -- مثال: 3 ع ت 1 (3 علوم تجريبية 1)
    grade_level TEXT NOT NULL CHECK (grade_level IN ('1AS', '2AS', '3AS')),
    track TEXT NOT NULL, -- جذع مشترك علوم، علوم تجريبية، تقني رياضي، الخ
    group_name TEXT DEFAULT 'فوج عام',
    academic_year TEXT NOT NULL DEFAULT '2026 / 2027',
    student_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول إسناد الأقسام للأستاذ (Teacher Classes Assignment)
-- يفصل بين كل أقسام الثانوية وبين الأقسام التي يدرّسها الأستاذ فعلياً
CREATE TABLE IF NOT EXISTS public.teacher_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    is_assigned BOOLEAN NOT NULL DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, class_id)
);

-- 4. جدول التلاميذ (Students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_number TEXT,
    national_id TEXT, -- رقم التعريف الوطني في منصة الرقمنة
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    birth_date DATE,
    birth_place TEXT, -- مكان الازدياد
    registration_number TEXT, -- رقم القيد بالمؤسسة
    schooling_regime TEXT DEFAULT 'خارجي', -- خارجي / نصف داخلي / داخلي
    birth_certificate_no TEXT, -- رقم عقد الميلاد
    registration_date DATE, -- تاريخ التسجيل
    is_exempt BOOLEAN DEFAULT false, -- معفى طبياً
    medical_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول التقييمات / الاختبارات (Assessments)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    trimester INT NOT NULL CHECK (trimester IN (1, 2, 3)),
    title TEXT NOT NULL,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('continuous', 'formative', 'summative')),
    activity_name TEXT NOT NULL, -- ألعاب القوى، كرة اليد، الخ
    max_score NUMERIC(4,2) DEFAULT 20.00,
    weight NUMERIC(3,2) DEFAULT 1.00,
    assessment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول العلامات (Marks)
CREATE TABLE IF NOT EXISTS public.marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC(4,2) CHECK (score IS NULL OR (score >= 0 AND score <= 20)),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assessment_id, student_id)
);

-- 7. جدول حصص المتابعة والغياب (Attendance Sessions)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_number INT DEFAULT 1,
    activity TEXT NOT NULL DEFAULT 'تربية بدنية',
    sports_field TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (class_id, session_date, session_number)
);

-- 8. جدول سجلات الحضور الفردية (Attendance Records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'exempt')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

-- 9. جدول الوحدات التعليمية (Teaching Units)
CREATE TABLE IF NOT EXISTS public.teaching_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grade_level TEXT NOT NULL,
    title TEXT NOT NULL,
    sport_family TEXT NOT NULL,
    sports TEXT[] DEFAULT '{}',
    academic_year TEXT NOT NULL DEFAULT '2026 / 2027',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول الحصص والجذاذات (Daily Lessons & Preparation)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.teaching_units(id) ON DELETE SET NULL,
    lesson_number INT NOT NULL,
    lesson_date DATE DEFAULT CURRENT_DATE,
    activity TEXT NOT NULL,
    sports_field TEXT,
    target_competence TEXT,
    learning_objective TEXT,
    warmup_desc TEXT,
    warmup_duration INT DEFAULT 15, -- دقائق
    main_desc TEXT,
    main_duration INT DEFAULT 60,
    cooldown_desc TEXT,
    cooldown_duration INT DEFAULT 15,
    equipment TEXT,
    success_criteria TEXT,
    teacher_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. جدول الاختبارات البدنية (Physical Tests)
CREATE TABLE IF NOT EXISTS public.physical_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    measurement_unit TEXT NOT NULL, -- ثواني، أمتار، عدد التكرارات
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. جدول نتائج الاختبارات البدنية (Physical Test Results)
CREATE TABLE IF NOT EXISTS public.physical_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.physical_tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    test_date DATE DEFAULT CURRENT_DATE,
    result_value NUMERIC(6,2) NOT NULL,
    grade NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. جدول العتاد والوسائل الرياضية (Sports Equipment)
CREATE TABLE IF NOT EXISTS public.sports_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    total_quantity INT NOT NULL DEFAULT 0,
    operational_quantity INT NOT NULL DEFAULT 0,
    damaged_quantity INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. جدول الحوادث والإصابات الرياضية (Accidents & Injuries)
CREATE TABLE IF NOT EXISTS public.student_injuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    incident_time TIME,
    activity TEXT NOT NULL,
    injury_nature TEXT NOT NULL,
    first_aid_administered TEXT,
    evacuated_to_hospital BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- الفهارس لتحسين سرعة الاستعلامات (Indexes)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_classes_user ON public.classes(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_user_class ON public.teacher_classes(user_id, class_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_marks_assessment_student ON public.marks(assessment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON public.attendance_sessions(class_id, session_date);

-- ==============================================================================
-- تفعيل Row Level Security (RLS) لجميع الجداول
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_injuries ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- سياسات الأمان (RLS Policies) لضمان خصوصية كل أستاذ
-- ==============================================================================

-- Profiles
CREATE POLICY "Users can view and manage their own profile"
ON public.profiles FOR ALL USING (auth.uid() = id);

-- Classes
CREATE POLICY "Users can view and manage their own school classes"
ON public.classes FOR ALL USING (auth.uid() = user_id);

-- Teacher Classes Assignment
CREATE POLICY "Users can manage their class assignments"
ON public.teacher_classes FOR ALL USING (auth.uid() = user_id);

-- Students
CREATE POLICY "Users can view and manage students in their classes"
ON public.students FOR ALL USING (auth.uid() = user_id);

-- Assessments
CREATE POLICY "Users can view and manage assessments"
ON public.assessments FOR ALL USING (auth.uid() = user_id);

-- Marks
CREATE POLICY "Users can view and manage marks"
ON public.marks FOR ALL USING (auth.uid() = user_id);

-- Attendance Sessions
CREATE POLICY "Users can view and manage attendance sessions"
ON public.attendance_sessions FOR ALL USING (auth.uid() = user_id);

-- Attendance Records
CREATE POLICY "Users can view and manage attendance records"
ON public.attendance_records FOR ALL USING (auth.uid() = user_id);

-- Teaching Units
CREATE POLICY "Users can view and manage teaching units"
ON public.teaching_units FOR ALL USING (auth.uid() = user_id);

-- Lessons
CREATE POLICY "Users can view and manage lessons"
ON public.lessons FOR ALL USING (auth.uid() = user_id);

-- Physical Tests
CREATE POLICY "Users can view and manage physical tests"
ON public.physical_tests FOR ALL USING (auth.uid() = user_id);

-- Physical Test Results
CREATE POLICY "Users can view and manage test results"
ON public.physical_test_results FOR ALL USING (auth.uid() = user_id);

-- Equipment
CREATE POLICY "Users can view and manage sports equipment"
ON public.sports_equipment FOR ALL USING (auth.uid() = user_id);

-- Injuries
CREATE POLICY "Users can view and manage injury records"
ON public.student_injuries FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- Trigger تلقائي لإنشاء ملف Profile عند تسجيل مستخدم جديد في Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'أستاذ التربية البدنية والرياضية'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
