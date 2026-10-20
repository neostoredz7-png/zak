import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SchoolClass, Student, GradeLevel } from '../types';
import { dataRepository } from '../services/dataService';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  Layers,
  Info,
  Edit2,
  Check,
  Split,
  ArrowRightLeft,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  onImportComplete: (studentsCount: number, classesCount: number) => void;
  selectedClassId?: string | null;
}

interface ParsedStudentRow {
  student_number: string;
  national_id: string;
  last_name: string;
  first_name: string;
  gender: 'M' | 'F';
  birth_date: string;
  birth_place: string;
  birth_certificate_no: string;
  registration_number: string;
  schooling_regime: string;
  registration_date: string;
  is_exempt: boolean;
  classKey: string;
}

interface DetectedClassGroup {
  id: string;
  key: string;
  grade_level: GradeLevel;
  track: string;
  classNumber: string;
  generatedName: string;
  generatedCode: string;
  existingClass?: SchoolClass;
  isAssigned: boolean;
  selectedForImport: boolean;
  studentCount: number;
  students: ParsedStudentRow[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [detectedClasses, setDetectedClasses] = useState<DetectedClassGroup[]>([]);
  const [cleanImportOnly, setCleanImportOnly] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePreviewClassKey, setActivePreviewClassKey] = useState<string>('ALL');
  const [editingClassNameKey, setEditingClassNameKey] = useState<string | null>(null);
  const [customNameInput, setCustomNameInput] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ studentsCount: number; classesCount: number } | null>(null);

  if (!isOpen) return null;

  /**
   * Dedicated Section Number Extractor:
   * Accurately extracts the section number (1, 2, 3...) without confusing it with the grade level!
   * Examples:
   * "2 اداب وفلسفة 1" -> "1"
   * "2 اداب وفلسفة 2" -> "2"
   * "2آف1" -> "1"
   * "2آف2" -> "2"
   * "2 ع ت 1" -> "1"
   * "2 ع ت 2" -> "2"
   * "1" -> "1"
   * "02" -> "2"
   * "فوج 1" -> "1"
   * "فوج 02" -> "2"
   */
  const extractSectionNumber = (
    rawSection?: string,
    rawClass?: string,
    rawFullClass?: string,
    context?: string
  ): string => {
    const s = String(rawSection || '').trim();

    // 1. Direct section string
    if (s) {
      // Pure numbers: "1", "2", "01", "02"
      if (/^\d+$/.test(s)) {
        return String(parseInt(s, 10));
      }

      // Explicit section keywords: "فوج 1", "فوج 02", "قسم 2", "ف 1", "ق 2", "groupe 2"
      const kwMatch = s.match(/(?:فوج|قسم|ف|ق|groupe|group|section|g)\s*[:：#.\-_]?\s*(\d+)/i);
      if (kwMatch && kwMatch[1]) {
        return String(parseInt(kwMatch[1], 10));
      }

      // Check if string contains multiple numbers:
      // In Algerian class strings like "2 اداب وفلسفة 1" or "2آف2":
      // The FIRST number is the grade level (2), and the LAST number is the section number (1 or 2)!
      const allNums = s.match(/\d+/g);
      if (allNums && allNums.length > 1) {
        return String(parseInt(allNums[allNums.length - 1], 10));
      } else if (allNums && allNums.length === 1) {
        // Only one number:
        // If it starts with this number followed by high-school terms (e.g. "2 اداب وفلسفة"),
        // this number is the GRADE (2), NOT the section!
        if (/^[123]\s*(?:ث|ثانوي|as|ع ت|آف|اداب|آداب|ج م|علمي|ادبي|رياضي)/i.test(s)) {
          // It's a grade prefix, fall through
        } else {
          return String(parseInt(allNums[0], 10));
        }
      }

      // Arabic word numbers
      if (/أول|اول|واحد|first/i.test(s)) return '1';
      if (/ثان|اثنان|second/i.test(s)) return '2';
      if (/ثالث|ثلاث|third/i.test(s)) return '3';
      if (/رابع|اربع|fourth/i.test(s)) return '4';
      if (/خامس|خمس/i.test(s)) return '5';
      if (/سادس|ست/i.test(s)) return '6';
    }

    // 2. Check full class or class column
    const candidates = [rawFullClass, rawClass].filter(Boolean) as string[];
    for (const c of candidates) {
      const trimmed = c.trim();
      if (!trimmed) continue;

      const kwMatch = trimmed.match(/(?:فوج|قسم|ف|ق|groupe|section)\s*[:：#.\-_]?\s*(\d+)/i);
      if (kwMatch && kwMatch[1]) {
        return String(parseInt(kwMatch[1], 10));
      }

      const allNums = trimmed.match(/\d+/g);
      if (allNums && allNums.length > 1) {
        // Last number is the section number!
        return String(parseInt(allNums[allNums.length - 1], 10));
      }

      const endsWithNum = trimmed.match(/([1-9]\d*)\s*$/);
      if (endsWithNum && endsWithNum[1]) {
        if (!trimmed.startsWith(endsWithNum[1])) {
          return String(parseInt(endsWithNum[1], 10));
        }
      }
    }

    // 3. Fallback to context (e.g. sheet name: "2 اداب 2" or "فوج 02")
    if (context) {
      const kwMatch = context.match(/(?:فوج|قسم|ف|ق)\s*[:：#.\-_]?\s*(\d+)/i);
      if (kwMatch && kwMatch[1]) {
        return String(parseInt(kwMatch[1], 10));
      }

      const allNums = context.match(/\d+/g);
      if (allNums && allNums.length > 1) {
        return String(parseInt(allNums[allNums.length - 1], 10));
      }
    }

    return '1';
  };

  /**
   * Grade Level Extractor:
   * Prioritizes row-level data over context to avoid contamination
   */
  const extractGradeLevel = (
    rawGrade?: string,
    rawFullClass?: string,
    rawClass?: string,
    rawTrack?: string,
    context?: string
  ): GradeLevel => {
    const rowSources = [rawGrade, rawFullClass, rawClass, rawTrack].filter(Boolean) as string[];

    for (const s of rowSources) {
      const lower = s.toLowerCase().trim();
      if (
        lower.includes('3as') ||
        lower.includes('3 as') ||
        lower.includes('ثالثة') ||
        lower.includes('بكالوريا') ||
        lower.includes('bac') ||
        /\b3\s*(?:ث|ثانوي|as|ع ت|آف|اداب|آداب|ر|ت ر|ل أ|ت ع)/i.test(lower) ||
        /^3[\s\-_]/.test(lower) ||
        /^3AS/i.test(lower)
      ) {
        return '3AS';
      }
      if (
        lower.includes('1as') ||
        lower.includes('1 as') ||
        lower.includes('أولى') ||
        lower.includes('اولى') ||
        lower.includes('ج م') ||
        lower.includes('جذع مشترك') ||
        /\b1\s*(?:ث|ثانوي|as|ج م|ع ت|اداب|آداب)/i.test(lower) ||
        (/^1[\s\-_]/.test(lower) && !lower.startsWith('10')) ||
        /^1AS/i.test(lower)
      ) {
        return '1AS';
      }
      if (
        lower.includes('2as') ||
        lower.includes('2 as') ||
        lower.includes('ثانية') ||
        /\b2\s*(?:ث|ثانوي|as|ع ت|آف|اداب|آداب|ر|ت ر|ل أ|ت ع)/i.test(lower) ||
        /^2[\s\-_]/.test(lower) ||
        /^2AS/i.test(lower)
      ) {
        return '2AS';
      }
    }

    // Context fallback
    if (context) {
      const lower = context.toLowerCase().trim();
      if (lower.includes('3as') || lower.includes('ثالثة') || lower.includes('bac')) return '3AS';
      if (lower.includes('1as') || lower.includes('أولى') || lower.includes('جذع')) return '1AS';
      if (lower.includes('2as') || lower.includes('ثانية')) return '2AS';
    }

    return '2AS';
  };

  /**
   * Track / Stream Extractor:
   * Distinguishes Algerian secondary streams
   */
  const extractTrack = (
    rawTrack?: string,
    rawFullClass?: string,
    rawClass?: string,
    grade?: GradeLevel,
    context?: string
  ): { track: string; trackCode: string } => {
    const rowSources = [rawTrack, rawFullClass, rawClass].filter(Boolean) as string[];
    let combined = rowSources.join(' ').toLowerCase();

    if (!combined && context) {
      combined = context.toLowerCase();
    }

    if (
      combined.includes('ع ت') ||
      combined.includes('علوم تجريبية') ||
      combined.includes('علوم وتكنولوجيا') ||
      combined.includes('ج م ع ت') ||
      combined.includes('علمي') ||
      /\bse\b/i.test(combined) ||
      /\bst\b/i.test(combined)
    ) {
      if (grade === '1AS' || combined.includes('ج م') || combined.includes('جذع')) {
        return { track: 'جذع مشترك علوم وتكنولوجيا', trackCode: 'ST' };
      }
      return { track: 'علوم تجريبية', trackCode: 'SE' };
    }

    if (
      combined.includes('آداب') ||
      combined.includes('اداب') ||
      combined.includes('آ ف') ||
      combined.includes('آف') ||
      combined.includes('فلسفة') ||
      combined.includes('ج م آداب') ||
      combined.includes('ج م آ') ||
      combined.includes('أدبي') ||
      /\blp\b/i.test(combined) ||
      /\bl\b/i.test(combined)
    ) {
      if (grade === '1AS' || combined.includes('ج م') || combined.includes('جذع')) {
        return { track: 'جذع مشترك آداب', trackCode: 'L' };
      }
      return { track: 'آداب وفلسفة', trackCode: 'LP' };
    }

    if (
      combined.includes('تقني') ||
      combined.includes('ت ر') ||
      combined.includes('هندسة') ||
      /\btm\b/i.test(combined)
    ) {
      return { track: 'تقني رياضي', trackCode: 'TM' };
    }

    if (
      combined.includes('رياضيات') ||
      combined.includes('math') ||
      combined.includes(' ر ') ||
      combined.endsWith(' ر') ||
      combined.includes('ر1') ||
      combined.includes('ر2') ||
      /\bm\b/i.test(combined)
    ) {
      return { track: 'رياضيات', trackCode: 'M' };
    }

    if (combined.includes('لغات') || combined.includes('ل أ') || /\bfl\b/i.test(combined)) {
      return { track: 'لغات أجنبية', trackCode: 'FL' };
    }

    if (
      combined.includes('تسيير') ||
      combined.includes('اقتصاد') ||
      combined.includes('ت ع') ||
      combined.includes('gestion') ||
      /\bme\b/i.test(combined) ||
      /\bge\b/i.test(combined)
    ) {
      return { track: 'تسيير واقتصاد', trackCode: 'ME' };
    }

    if (rawTrack && rawTrack.trim()) {
      return { track: rawTrack.trim(), trackCode: 'GEN' };
    }

    if (grade === '1AS') {
      return { track: 'جذع مشترك علوم وتكنولوجيا', trackCode: 'ST' };
    }
    return { track: 'علوم تجريبية', trackCode: 'SE' };
  };

  /**
   * Generates Clean Standardized Algerian Display Name and Code
   */
  const generateClassNaming = (
    grade: GradeLevel,
    track: string,
    trackCode: string,
    classNum: string
  ) => {
    const gradeDigit = grade === '1AS' ? '1' : grade === '2AS' ? '2' : '3';
    let displayName = '';

    if (grade === '1AS') {
      if (trackCode === 'L' || track.includes('آداب')) {
        displayName = `1 ج م آداب ${classNum}`;
      } else {
        displayName = `1 ج م ع ت ${classNum}`;
      }
    } else {
      if (trackCode === 'LP' || track.includes('فلسفة') || track.includes('آداب') || track.includes('اداب')) {
        displayName = `${gradeDigit} آداب وفلسفة ${classNum}`;
      } else if (trackCode === 'SE' || track.includes('علوم')) {
        displayName = `${gradeDigit} علوم تجريبية ${classNum}`;
      } else if (trackCode === 'TM' || track.includes('تقني')) {
        displayName = `${gradeDigit} تقني رياضي ${classNum}`;
      } else if (trackCode === 'M' || track.includes('رياضيات')) {
        displayName = `${gradeDigit} رياضيات ${classNum}`;
      } else if (trackCode === 'FL' || track.includes('لغات')) {
        displayName = `${gradeDigit} لغات أجنبية ${classNum}`;
      } else if (trackCode === 'ME' || track.includes('تسيير')) {
        displayName = `${gradeDigit} تسيير واقتصاد ${classNum}`;
      } else {
        displayName = `${gradeDigit} ${track} ${classNum}`;
      }
    }

    const code = `${grade}-${trackCode}-${classNum}`;
    return { displayName: displayName.trim(), code };
  };

  /**
   * Excel File Processing
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setErrors([]);
    setSuccessInfo(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });

        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          setErrors(['الملف فارغ أو لا يحتوي على أوراق عمل']);
          return;
        }

        const classGroupsMap = new Map<string, DetectedClassGroup>();
        let totalProcessedStudents = 0;

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          if (!ws) continue;

          const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (!matrix || matrix.length === 0) continue;

          // 1. Check if sheet name indicates a class
          const isSheetNameClass =
            !/^(sheet|feuil|ورقة|table|جدول|ملخص|page)/i.test(sheetName) &&
            (/\d/.test(sheetName) || /as|ع ت|آداب|أولى|ثانية|ثالثة|فوج|فلسفة/i.test(sheetName));

          // 2. Scan to find Header Row
          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(matrix.length, 15); r++) {
            const rowValues = matrix[r].map((v) => String(v || '').trim().toLowerCase());
            const matchesHeader =
              (rowValues.some((v) => v.includes('اللقب') || v === 'nom') &&
                rowValues.some((v) => v.includes('الاسم') || v === 'prenom')) ||
              rowValues.some((v) => v.includes('التعريف') || v.includes('nin') || v.includes('قيد')) ||
              (rowValues.some((v) => v.includes('اللقب والاسم') || v.includes('الاسم واللقب')) &&
                rowValues.some((v) => v.includes('تاريخ') || v.includes('الرقم') || v.includes('الجنس')));

            if (matchesHeader) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx === -1) {
            headerRowIdx = 0;
          }

          // 3. Scan ONLY pre-header lines for school/title clues
          let preHeaderContext = isSheetNameClass ? sheetName : '';
          for (let r = 0; r < headerRowIdx; r++) {
            const rowValues = matrix[r].map((v) => String(v || '').trim());
            const rowStr = rowValues.join(' ');
            if (rowStr.length > 2 && !rowStr.includes('الجمهورية') && !rowStr.includes('وزارة')) {
              preHeaderContext = `${preHeaderContext} ${rowStr}`.trim();
            }
          }

          const headerRow = matrix[headerRowIdx].map((v) => String(v || '').trim());
          const colMap: { [key: string]: number } = {};

          headerRow.forEach((col, idx) => {
            const c = col.toLowerCase().trim();
            if (!c) return;

            // Section number column (القسم, الفوج, رقم القسم, رقم الفوج, فوج, قسم)
            if (
              c === 'القسم' ||
              c === 'الفوج' ||
              c === 'فوج' ||
              c === 'قسم' ||
              c.includes('رقم القسم') ||
              c.includes('رقم الفوج') ||
              c === 'division' ||
              c === 'section' ||
              c === 'groupe'
            ) {
              if (colMap['section'] === undefined) {
                colMap['section'] = idx;
              }
            }

            // Combined Class column (الفوج التربوي, القسم التربوي, المستوى والشعبة)
            if (
              c.includes('الفوج التربوي') ||
              c.includes('القسم التربوي') ||
              c.includes('المستوى والشعبة') ||
              c.includes('المستوى والمسار') ||
              c.includes('classe')
            ) {
              colMap['full_class'] = idx;
            }

            // Grade / Level
            if (
              c.includes('المستوى') ||
              c.includes('السنة الدراسية') ||
              c === 'السنة' ||
              c.includes('niveau') ||
              c.includes('grade')
            ) {
              colMap['grade'] = idx;
            }

            // Track / Stream
            if (
              c.includes('الشعبة') ||
              c.includes('الجذع') ||
              c.includes('الفرع') ||
              c.includes('التخصص') ||
              c.includes('المسار') ||
              c.includes('filiere')
            ) {
              colMap['track'] = idx;
            }

            // Last Name
            if (c.includes('اللقب') || c === 'nom' || c.includes('last name') || c.includes('العائلي')) {
              colMap['last_name'] = idx;
            }

            // First Name
            if (c.includes('الاسم') || c === 'prenom' || c === 'prénom' || c.includes('first name') || c.includes('الشخصي')) {
              if (!c.includes('اللقب') && !c.includes('أب') && !c.includes('أم')) {
                colMap['first_name'] = idx;
              }
            }

            // Full Name
            if (
              c.includes('اللقب والاسم') ||
              c.includes('الاسم واللقب') ||
              c.includes('nom et prenom') ||
              c.includes('nom prenom')
            ) {
              colMap['full_name'] = idx;
            }

            // Gender
            if (c.includes('الجنس') || c === 'sexe' || c === 'gender' || c.includes('النوع')) {
              colMap['gender'] = idx;
            }

            // Place of birth (detect strictly place, avoid matching combined date+place)
            if (
              !c.includes('تاريخ') &&
              !c.includes('date') &&
              (c.includes('مكان الازدياد') ||
                c.includes('مكان الميلاد') ||
                c.includes('مكان ازدياد') ||
                c.includes('مكان ميلاد') ||
                c.includes('lieu de naissance') ||
                c.includes('lieu naissance') ||
                c === 'مكان' ||
                c === 'lieu')
            ) {
              if (colMap['birth_place'] === undefined) {
                colMap['birth_place'] = idx;
              }
            }

            // Combined Date & Place (تاريخ ومكان الازدياد / الميلاد)
            if (
              (c.includes('تاريخ') && c.includes('مكان')) ||
              c.includes('date et lieu') ||
              c.includes('date/lieu')
            ) {
              colMap['birth_combined'] = idx;
            }

            // Birth certificate (رقم عقد الميلاد)
            if (
              c.includes('عقد الميلاد') ||
              c.includes('رقم عقد') ||
              c.includes('رقم العقد') ||
              c.includes('عقد') ||
              c.includes('acte')
            ) {
              if (colMap['birth_cert'] === undefined) {
                colMap['birth_cert'] = idx;
              }
            }

            // High-confidence Date of birth (strictly birth date, avoid entry dates, registration dates, places, and contract numbers)
            const isEntryOrOtherDate =
              c.includes('دخول') ||
              c.includes('تسجيل') ||
              c.includes('التحاق') ||
              c.includes('تنصيب') ||
              c.includes('إصدار') ||
              c.includes('خروج') ||
              c.includes('مغادرة');

            if (
              !isEntryOrOtherDate &&
              !c.includes('مكان') &&
              !c.includes('lieu') &&
              !c.includes('عقد') &&
              !c.includes('acte') &&
              (c.includes('تاريخ الازدياد') ||
                c.includes('تاريخ الميلاد') ||
                c.includes('تاريخ ميلاد') ||
                c.includes('تاريخ ازدياد') ||
                c.includes('date de naissance') ||
                c.includes('date naissance') ||
                c.includes('date_naissance') ||
                c.includes('d.n') ||
                c === 'dob' ||
                c === 'd.o.b')
            ) {
              colMap['birth_date'] = idx;
            } else if (
              colMap['birth_date'] === undefined &&
              !isEntryOrOtherDate &&
              !c.includes('مكان') &&
              !c.includes('عقد') &&
              (c === 'تاريخ' || c === 'date' || c.includes('birth'))
            ) {
              colMap['birth_date'] = idx;
            }

            // National ID (NIN)
            if (c.includes('التعريف') || c.includes('nin') || c.includes('matricule national')) {
              colMap['national_id'] = idx;
            }

            // Registration number
            if (c.includes('القيد') || (c.includes('التسجيل') && !c.includes('تاريخ')) || c.includes('matricule')) {
              colMap['reg_number'] = idx;
            }

            // Schooling regime
            if (c.includes('نظام') || c.includes('صفة التمدرس') || c.includes('regime')) {
              colMap['regime'] = idx;
            }

            // Order / Student number
            if (c === 'الرقم' || c === 'رقم' || c === 'ر.ت' || c === 'n°' || c === 'n' || c === 'num') {
              colMap['student_num'] = idx;
            }
          });

          // Special recognition for Algerian Ministry Digitization:
          // In official digitization lists, Column E (0-based index 4) is ALWAYS the Date of Birth (تاريخ الميلاد / تاريخ الازدياد).
          // Column F (0-based index 5) is مكان الازدياد, Column G (0-based index 6) is الجنس.
          if (headerRow.length > 4) {
            const colEHeader = String(headerRow[4] || '').toLowerCase();
            if (
              colEHeader.includes('تاريخ') ||
              colEHeader.includes('ازدياد') ||
              colEHeader.includes('ميلاد') ||
              colEHeader.includes('date') ||
              colMap['birth_date'] === undefined
            ) {
              colMap['birth_date'] = 4; // Column E is strictly Date of Birth
            }
          }
          if (colMap['birth_place'] === 4) {
            // Column E is Date of Birth, so birth place must point to Column F (index 5)
            if (headerRow.length > 5) {
              colMap['birth_place'] = 5;
            } else {
              delete colMap['birth_place'];
            }
          } else if (colMap['birth_place'] === undefined && headerRow.length > 5) {
            colMap['birth_place'] = 5; // Column F
          }
          if (colMap['gender'] === undefined && headerRow.length > 6) {
            colMap['gender'] = 6; // Column G
          }

          // Process student rows in this sheet
          for (let r = headerRowIdx + 1; r < matrix.length; r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;

            let lastName = colMap['last_name'] !== undefined ? String(row[colMap['last_name']] || '').trim() : '';
            let firstName = colMap['first_name'] !== undefined ? String(row[colMap['first_name']] || '').trim() : '';

            if ((!lastName || !firstName) && colMap['full_name'] !== undefined) {
              const full = String(row[colMap['full_name']] || '').trim();
              if (full) {
                const parts = full.split(/\s+/);
                if (parts.length > 1) {
                  lastName = parts[0];
                  firstName = parts.slice(1).join(' ');
                } else {
                  lastName = full;
                  firstName = full;
                }
              }
            }

            if (!lastName && !firstName) continue;
            if (
              lastName.includes('المجموع') ||
              firstName.includes('المجموع') ||
              lastName.includes('Total') ||
              lastName.includes('عدد التلاميذ')
            ) {
              continue;
            }

            const rowSectionStr = colMap['section'] !== undefined ? String(row[colMap['section']] || '').trim() : '';
            const rowFullClassStr = colMap['full_class'] !== undefined ? String(row[colMap['full_class']] || '').trim() : '';
            const rowGradeStr = colMap['grade'] !== undefined ? String(row[colMap['grade']] || '').trim() : '';
            const rowTrackStr = colMap['track'] !== undefined ? String(row[colMap['track']] || '').trim() : '';

            // Decompose into distinct class components
            const sectionNumber = extractSectionNumber(
              rowSectionStr,
              rowSectionStr,
              rowFullClassStr,
              `${sheetName} ${preHeaderContext}`
            );

            const gradeLevel = extractGradeLevel(
              rowGradeStr,
              rowFullClassStr,
              rowSectionStr,
              rowTrackStr,
              `${sheetName} ${preHeaderContext}`
            );

            const { track, trackCode } = extractTrack(
              rowTrackStr,
              rowFullClassStr,
              rowSectionStr,
              gradeLevel,
              `${sheetName} ${preHeaderContext}`
            );

            const { displayName, code } = generateClassNaming(
              gradeLevel,
              track,
              trackCode,
              sectionNumber
            );

            const groupKey = code;

            if (!classGroupsMap.has(groupKey)) {
              const matchedClass = classes.find(
                (c) =>
                  c.code.trim().toUpperCase() === code.toUpperCase() ||
                  c.name.trim().toLowerCase() === displayName.toLowerCase()
              );

              classGroupsMap.set(groupKey, {
                id: 'group-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36),
                key: groupKey,
                grade_level: gradeLevel,
                track,
                classNumber: sectionNumber,
                generatedName: displayName,
                generatedCode: code,
                existingClass: matchedClass,
                isAssigned: matchedClass ? matchedClass.is_assigned : true,
                selectedForImport: true,
                studentCount: 0,
                students: [],
              });
            }

            const nationalId = colMap['national_id'] !== undefined ? String(row[colMap['national_id']] || '').trim() : '';
            const regNumber = colMap['reg_number'] !== undefined ? String(row[colMap['reg_number']] || '').trim() : '';
            const rawGender =
              colMap['gender'] !== undefined && row[colMap['gender']] !== undefined
                ? String(row[colMap['gender']]).trim()
                : row[6] !== undefined && String(row[6]).trim() !== ''
                ? String(row[6]).trim()
                : 'ذكر';

            // Robust birth date extraction - strictly recognizing Column E (0-based index 4) as Date of Birth
            const valAtColE = row[4];
            const isColEDate =
              valAtColE instanceof Date ||
              (typeof valAtColE === 'number' && valAtColE > 25000 && valAtColE < 55000) ||
              (typeof valAtColE === 'string' &&
                /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/.test(valAtColE.trim()));

            let rawBirthVal: any = '';
            if (isColEDate) {
              // Direct priority: Column E contains the date of birth
              rawBirthVal = valAtColE;
            } else if (colMap['birth_date'] !== undefined && row[colMap['birth_date']] !== undefined && String(row[colMap['birth_date']]).trim() !== '') {
              rawBirthVal = row[colMap['birth_date']];
            } else if (valAtColE !== undefined && String(valAtColE).trim() !== '') {
              // Standard Digitization column: Column E
              rawBirthVal = valAtColE;
            } else if (colMap['birth_combined'] !== undefined) {
              rawBirthVal = row[colMap['birth_combined']];
            }

            let birthDate = '';
            let extraPlaceFromDateCell = '';

            // A. JavaScript Date object
            if (rawBirthVal instanceof Date && !isNaN(rawBirthVal.getTime())) {
              birthDate = rawBirthVal.toISOString().split('T')[0];
            } else if (typeof rawBirthVal === 'number' && rawBirthVal > 25000 && rawBirthVal < 55000) {
              // B. Numeric Excel Date serial (e.g. 39542)
              const jsDate = new Date(Math.round((rawBirthVal - 25569) * 86400 * 1000));
              if (!isNaN(jsDate.getTime())) {
                birthDate = jsDate.toISOString().split('T')[0];
              }
            } else {
              const strVal = String(rawBirthVal || '').trim();
              const dateMatch = strVal.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/);
              if (dateMatch) {
                birthDate = dateMatch[0];
                const rest = strVal.replace(dateMatch[0], '').replace(/[بـ\-\(\)\[\],]/g, ' ').trim();
                if (rest.length > 1 && isNaN(Number(rest))) {
                  extraPlaceFromDateCell = rest;
                }
              } else if (strVal && !isNaN(Number(strVal)) && Number(strVal) > 25000 && Number(strVal) < 55000) {
                const num = Number(strVal);
                const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
                if (!isNaN(jsDate.getTime())) {
                  birthDate = jsDate.toISOString().split('T')[0];
                }
              }
            }

            // C. Auto-Recovery: if no date was found from the assigned column (e.g. column misaligned), scan other cells for a genuine date!
            if (!birthDate) {
              for (let cIdx = 0; cIdx < row.length; cIdx++) {
                if (
                  cIdx === colMap['student_num'] ||
                  cIdx === colMap['national_id'] ||
                  cIdx === colMap['reg_number'] ||
                  cIdx === colMap['last_name'] ||
                  cIdx === colMap['first_name']
                ) {
                  continue;
                }
                const cell = row[cIdx];
                if (cell instanceof Date && !isNaN(cell.getTime())) {
                  birthDate = cell.toISOString().split('T')[0];
                  break;
                }
                if (typeof cell === 'number' && cell > 28000 && cell < 52000) {
                  const jsDate = new Date(Math.round((cell - 25569) * 86400 * 1000));
                  if (!isNaN(jsDate.getTime())) {
                    birthDate = jsDate.toISOString().split('T')[0];
                    break;
                  }
                }
                if (typeof cell === 'string') {
                  const m = cell.trim().match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/);
                  if (m) {
                    birthDate = m[0];
                    break;
                  }
                }
              }
            }

            let birthPlaceCol = colMap['birth_place'];
            if (birthPlaceCol === 4) {
              birthPlaceCol = 5; // Column F
            }
            let birthPlace = birthPlaceCol !== undefined && birthPlaceCol !== 4
              ? String(row[birthPlaceCol] || '').trim()
              : (row[5] !== undefined && String(row[5]).trim() !== '' && row[5] !== rawBirthVal)
              ? String(row[5]).trim()
              : '';
            if (!birthPlace && extraPlaceFromDateCell) {
              birthPlace = extraPlaceFromDateCell;
            }

            const birthCertNo = colMap['birth_cert'] !== undefined ? String(row[colMap['birth_cert']] || '').trim() : '';
            const schoolingRegime = colMap['regime'] !== undefined ? String(row[colMap['regime']] || '').trim() : 'خارجي';
            const studentNum =
              colMap['student_num'] !== undefined && row[colMap['student_num']]
                ? String(row[colMap['student_num']]).trim()
                : String(classGroupsMap.get(groupKey)!.students.length + 1).padStart(2, '0');

            const isFemale =
              rawGender === 'أنثى' ||
              rawGender === 'بنت' ||
              rawGender === 'F' ||
              rawGender === 'f' ||
              rawGender === '2' ||
              String(rawGender).toLowerCase().startsWith('fem');

            const studentData: ParsedStudentRow = {
              student_number: studentNum,
              national_id: nationalId,
              last_name: lastName,
              first_name: firstName,
              gender: isFemale ? 'F' : 'M',
              birth_date: birthDate,
              birth_place: birthPlace,
              birth_certificate_no: birthCertNo,
              registration_number: regNumber,
              schooling_regime: schoolingRegime || 'خارجي',
              registration_date: new Date().toISOString().split('T')[0],
              is_exempt: false,
              classKey: groupKey,
            };

            const group = classGroupsMap.get(groupKey)!;
            group.students.push(studentData);
            group.studentCount = group.students.length;
            totalProcessedStudents++;
          }
        }

        const detectedList = Array.from(classGroupsMap.values()).sort((a, b) => {
          if (a.grade_level !== b.grade_level) {
            return a.grade_level.localeCompare(b.grade_level);
          }
          return parseInt(a.classNumber, 10) - parseInt(b.classNumber, 10);
        });

        if (detectedList.length === 0) {
          setErrors([
            'لم يتم العثور على أي بيانات تلاميذ أو أقسام صالحة في الملف.',
            'يرجى التأكد من أن الملف يحتوي على أعمدة اللقب والاسم والقسم/الفوج.',
          ]);
          setDetectedClasses([]);
          return;
        }

        setDetectedClasses(detectedList);
        setActivePreviewClassKey('ALL');
      } catch (err: any) {
        setErrors(['خطأ أثناء معالجة ملف الإكسل: ' + err.message]);
      }
    };
    reader.readAsBinaryString(uploaded);
  };

  const toggleClassSelection = (key: string) => {
    setDetectedClasses((prev) =>
      prev.map((c) => (c.key === key || c.id === key ? { ...c, selectedForImport: !c.selectedForImport } : c))
    );
  };

  const toggleClassAssignment = (key: string) => {
    setDetectedClasses((prev) =>
      prev.map((c) => (c.key === key || c.id === key ? { ...c, isAssigned: !c.isAssigned } : c))
    );
  };

  const handleStartEditClassName = (cls: DetectedClassGroup) => {
    setEditingClassNameKey(cls.key);
    setCustomNameInput(cls.generatedName);
  };

  const handleSaveClassName = (key: string) => {
    if (!customNameInput.trim()) return;
    setDetectedClasses((prev) =>
      prev.map((c) => (c.key === key || c.id === key ? { ...c, generatedName: customNameInput.trim() } : c))
    );
    setEditingClassNameKey(null);
  };

  /**
   * Split a detected class into two sections (1 and 2) if teacher desires
   */
  const handleSplitClassIntoTwo = (sourceKey: string) => {
    const sourceGroup = detectedClasses.find((c) => c.key === sourceKey || c.id === sourceKey);
    if (!sourceGroup || sourceGroup.students.length < 2) return;

    const mid = Math.ceil(sourceGroup.students.length / 2);
    const students1 = sourceGroup.students.slice(0, mid);
    const students2 = sourceGroup.students.slice(mid);

    const baseName = sourceGroup.generatedName.replace(/\s*\d+$/, '');
    const trackPart = sourceGroup.key.split('-')[1] || 'LP';

    const usedNums = new Set(
      detectedClasses
        .filter((c) => c.grade_level === sourceGroup.grade_level && c.track === sourceGroup.track && c.key !== sourceKey && c.id !== sourceKey)
        .map((c) => parseInt(c.classNumber, 10))
        .filter((n) => !isNaN(n))
    );

    let sec1 = 1;
    while (usedNums.has(sec1)) sec1++;
    usedNums.add(sec1);

    let sec2 = sec1 + 1;
    while (usedNums.has(sec2)) sec2++;

    const name1 = `${baseName} ${sec1}`;
    const name2 = `${baseName} ${sec2}`;
    const code1 = `${sourceGroup.grade_level}-${trackPart}-${sec1}`;
    const code2 = `${sourceGroup.grade_level}-${trackPart}-${sec2}`;

    const group1: DetectedClassGroup = {
      ...sourceGroup,
      id: 'group-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36),
      key: code1,
      classNumber: String(sec1),
      generatedName: name1,
      generatedCode: code1,
      studentCount: students1.length,
      students: students1.map((s) => ({ ...s, classKey: code1 })),
    };

    const group2: DetectedClassGroup = {
      ...sourceGroup,
      id: 'group-' + Math.random().toString(36).substring(2, 9) + '-' + (Date.now() + 15).toString(36),
      key: code2,
      classNumber: String(sec2),
      generatedName: name2,
      generatedCode: code2,
      studentCount: students2.length,
      students: students2.map((s) => ({ ...s, classKey: code2 })),
    };

    setDetectedClasses((prev) => {
      const filtered = prev.filter((c) => c.key !== sourceKey && c.id !== sourceKey);
      return [...filtered, group1, group2];
    });
  };

  /**
   * Reassign an individual student to another section directly from the preview table!
   */
  const handleReassignStudent = (studentIndexInFiltered: number, newClassKey: string) => {
    setDetectedClasses((prev) => {
      // Find the student from preview list
      const currentList =
        activePreviewClassKey === 'ALL'
          ? prev.flatMap((c) => c.students)
          : prev.find((c) => c.key === activePreviewClassKey)?.students || [];

      const targetStudent = currentList[studentIndexInFiltered];
      if (!targetStudent || targetStudent.classKey === newClassKey) return prev;

      return prev.map((cls) => {
        // If this class previously had the student, remove it
        const filteredStudents = cls.students.filter(
          (s) =>
            !(
              s.last_name === targetStudent.last_name &&
              s.first_name === targetStudent.first_name &&
              s.student_number === targetStudent.student_number
            )
        );

        // If this is the target class, add the student
        if (cls.key === newClassKey) {
          const updatedStudent: ParsedStudentRow = {
            ...targetStudent,
            classKey: newClassKey,
            student_number: String(filteredStudents.length + 1).padStart(2, '0'),
          };
          const newStudents = [...filteredStudents, updatedStudent];
          return {
            ...cls,
            students: newStudents,
            studentCount: newStudents.length,
          };
        }

        return {
          ...cls,
          students: filteredStudents,
          studentCount: filteredStudents.length,
        };
      });
    });
  };

  /**
   * Confirm Import to Database
   */
  const handleConfirmMultiClassImport = async () => {
    const selectedClasses = detectedClasses.filter((c) => c.selectedForImport && c.students.length > 0);
    if (selectedClasses.length === 0) {
      alert('يرجى تحديد قسم واحد على الأقل للاستيراد');
      return;
    }

    setIsProcessing(true);
    let totalImportedStudents = 0;
    let newlyCreatedClassesCount = 0;

    try {
      if (cleanImportOnly) {
        await dataRepository.clearSchoolYearData(true);
      }

      for (const group of selectedClasses) {
        let targetClassId = group.existingClass?.id;

        if (!targetClassId || cleanImportOnly) {
          const newClass = await dataRepository.addClass({
            user_id: dataRepository.getProfile().id,
            code: group.generatedCode,
            name: group.generatedName,
            grade_level: group.grade_level,
            track: group.track,
            group_name: `فوج ${group.classNumber}`,
            academic_year: dataRepository.getProfile().academic_year,
            student_count: group.students.length,
            is_assigned: group.isAssigned,
          });
          targetClassId = newClass.id;
          newlyCreatedClassesCount++;
        } else {
          if (group.existingClass && group.existingClass.is_assigned !== group.isAssigned) {
            await dataRepository.toggleClassAssignment(targetClassId, group.isAssigned);
          }
        }

        const studentsForThisClass: Omit<Student, 'id'>[] = group.students.map((st, idx) => ({
          student_number: st.student_number || String(idx + 1).padStart(2, '0'),
          national_id: st.national_id,
          first_name: st.first_name,
          last_name: st.last_name,
          gender: st.gender,
          birth_date: st.birth_date,
          birth_place: st.birth_place,
          birth_certificate_no: st.birth_certificate_no,
          registration_number: st.registration_number,
          schooling_regime: st.schooling_regime,
          registration_date: st.registration_date,
          is_exempt: false,
          class_id: targetClassId!,
          user_id: dataRepository.getProfile().id,
        }));

        await dataRepository.bulkAddStudents(studentsForThisClass);
        totalImportedStudents += studentsForThisClass.length;
      }

      setIsProcessing(false);
      setSuccessInfo({
        studentsCount: totalImportedStudents,
        classesCount: selectedClasses.length,
      });

      onImportComplete(totalImportedStudents, newlyCreatedClassesCount);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsProcessing(false);
      alert('حدث خطأ أثناء استيراد وتوزيع الأقسام: ' + err.message);
    }
  };

  /**
   * Download Algerian Ministry Sample Template
   * Explicitly showing 2 آداب وفلسفة 1 و 2 آداب وفلسفة 2
   */
  const downloadMinistryTemplate = () => {
    const multiClassMinistryData = [
      // القسم 1: 2 آداب وفلسفة 1
      {
        'رقم التعريف': '100075000000001',
        'اللقب': 'لعريني',
        'الاسم': 'سليمان',
        'الجنس': 'ذكر',
        'تاريخ الازدياد': '05/09/2007',
        'مكان الازدياد': 'وادي ارهيو',
        'المستوى': '2 ثانوي',
        'الشعبة': 'آداب وفلسفة',
        'القسم': '1',
        'نظام التمدرس': 'خارجي',
        'رقم القيد': 989,
      },
      {
        'رقم التعريف': '100075000000002',
        'اللقب': 'زيتوني',
        'الاسم': 'عبد الباسط',
        'الجنس': 'ذكر',
        'تاريخ الازدياد': '02/11/2007',
        'مكان الازدياد': 'جديوية',
        'المستوى': '2 ثانوي',
        'الشعبة': 'آداب وفلسفة',
        'القسم': '1',
        'نظام التمدرس': 'خارجي',
        'رقم القيد': 980,
      },
      // القسم 2: 2 آداب وفلسفة 2
      {
        'رقم التعريف': '100075000000011',
        'اللقب': 'منصور',
        'الاسم': 'ياسين',
        'الجنس': 'ذكر',
        'تاريخ الازدياد': '12/03/2007',
        'مكان الازدياد': 'وادي ارهيو',
        'المستوى': '2 ثانوي',
        'الشعبة': 'آداب وفلسفة',
        'القسم': '2',
        'نظام التمدرس': 'خارجي',
        'رقم القيد': 991,
      },
      {
        'رقم التعريف': '100075000000012',
        'اللقب': 'يحياوي',
        'الاسم': 'خديجة',
        'الجنس': 'أنثى',
        'تاريخ الازدياد': '25/08/2007',
        'مكان الازدياد': 'جديوية',
        'المستوى': '2 ثانوي',
        'الشعبة': 'آداب وفلسفة',
        'القسم': '2',
        'نظام التمدرس': 'خارجي',
        'رقم القيد': 992,
      },
      // القسم 3: 1 ج م ع ت 1
      {
        'رقم التعريف': '100085000000021',
        'اللقب': 'قوبة',
        'الاسم': 'شهرزاد',
        'الجنس': 'أنثى',
        'تاريخ الازدياد': '19/10/2008',
        'مكان الازدياد': 'جديوية',
        'المستوى': '1 ثانوي',
        'الشعبة': 'جذع مشترك علوم وتكنولوجيا',
        'القسم': '1',
        'نظام التمدرس': 'خارجي',
        'رقم القيد': 987,
      },
      // القسم 4: 3 علوم تجريبية 1
      {
        'رقم التعريف': '100075000000041',
        'اللقب': 'خطار',
        'الاسم': 'الحبيب',
        'الجنس': 'ذكر',
        'تاريخ الازدياد': '09/09/2006',
        'مكان الازدياد': 'شلف',
        'المستوى': '3 ثانوي',
        'الشعبة': 'علوم تجريبية',
        'القسم': '1',
        'نظام التمدرس': 'خارجي',
        'رقم القيد': 975,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(multiClassMinistryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'أقسام متعددة من الرقمنة');
    XLSX.writeFile(wb, 'نموذج_أقسام_الرقمنة_2اداب_وفلسفة.xlsx');
  };

  const allDetectedStudents = detectedClasses.flatMap((c) => c.students);
  const previewStudents =
    activePreviewClassKey === 'ALL'
      ? allDetectedStudents
      : detectedClasses.find((c) => c.key === activePreviewClassKey)?.students || [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-right border border-slate-100 animate-in fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                استيراد وتوزيع الأقسام والتلاميذ حسب أقسامهم وأفواجهم
              </h2>
              <p className="text-xs text-emerald-100">
                مراعاة دقيقة للقسم والفوج (مثل 2 آداب وفلسفة 1 و 2) وتوزيع كل تلميذ على قسمه الصحيح
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Banner Notice */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                نظام التعرف الذكي على أقسام وأفواج الرقمنة الجزائرية:
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                يقوم النظام بالتعرف التلقائي على الشعب والمستويات ورقم القسم (مثال: <strong>2 آداب وفلسفة 1</strong> و <strong>2 آداب وفلسفة 2</strong>، أو <strong>2 ع ت 1</strong> و <strong>2 ع ت 2</strong>)، مع إنشاء أقسام منفصلة لكل فوج وتوزيع التلاميذ بدقة داخل كل قسم.
              </p>
            </div>
          </div>

          {/* Clean Import Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <label htmlFor="clean-import-chk" className="text-xs font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
                <input
                  id="clean-import-chk"
                  type="checkbox"
                  checked={cleanImportOnly}
                  onChange={(e) => setCleanImportOnly(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span>استيراد نظيف (مسح البيانات الوهمية القديمة وتثبيت بيانات الملف فقط)</span>
              </label>
              <p className="text-[11px] text-slate-500 pr-6">
                عند التفعيل، سيتم تصفير الأقسام السابقة والاعتماد 100% على أقسام وتلاميذ ملف الإكسل المرفوع.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadMinistryTemplate}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>تحميل نموذج أقسام متعددة (2 آف 1 و 2)</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 hover:bg-emerald-50/20 group">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'اضغط لاختيار ملف إكسل من منصة الرقمنة'}
                </p>
                <p className="text-xs text-slate-500">
                  يدعم ملفات الإكسل (.xlsx, .xls) متعددة الأقسام أو الصفحات
                </p>
              </div>
            </label>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 space-y-1">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>تنبيهات أثناء قراءة الملف:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pr-2">
                {errors.map((err, i) => (
                  <li key={`err-${i}`}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Banner */}
          {successInfo && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">تم الاستيراد والتوزيع بنجاح!</p>
                <p className="text-[11px] text-emerald-700">
                  تمت إضافة {successInfo.studentsCount} تلميذاً وتوزيعهم عبر {successInfo.classesCount} أقسام بنجاح.
                </p>
              </div>
            </div>
          )}

          {/* Detected Classes Grid */}
          {detectedClasses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    الأقسام المكتشفة في الملف ({detectedClasses.length} أقسام مفروزة ومستقلة):
                  </h3>
                </div>
                <div className="text-xs font-bold text-slate-500">
                  إجمالي التلاميذ: <span className="font-mono text-emerald-700">{allDetectedStudents.length}</span>
                </div>
              </div>

              {/* Class Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {detectedClasses.map((clsGroup, idx) => (
                  <div
                    key={clsGroup.id || `${clsGroup.key}-${idx}`}
                    className={`border rounded-xl p-4 transition-all ${
                      clsGroup.selectedForImport
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={clsGroup.selectedForImport}
                          onChange={() => toggleClassSelection(clsGroup.key)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        {editingClassNameKey === clsGroup.key ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={customNameInput}
                              onChange={(e) => setCustomNameInput(e.target.value)}
                              className="text-xs font-bold p-1 border rounded w-full bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveClassName(clsGroup.key)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-1">
                            <span className="font-black text-sm text-slate-900">
                              {clsGroup.generatedName}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartEditClassName(clsGroup)}
                              className="text-slate-400 hover:text-emerald-700 p-0.5"
                              title="تعديل اسم القسم"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {clsGroup.grade_level}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-2">
                      <span>{clsGroup.track}</span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded font-bold">
                        فوج {clsGroup.classNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono">{clsGroup.studentCount}</span>
                        <span>تلميذ</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Split into 2 if class is large */}
                        {clsGroup.studentCount >= 10 && (
                          <button
                            type="button"
                            onClick={() => handleSplitClassIntoTwo(clsGroup.key)}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
                            title="تقسيم التلاميذ إلى فوجين (1 و 2)"
                          >
                            <Split className="w-3 h-3" />
                            <span>تقسيم (1 و 2)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleClassAssignment(clsGroup.key)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                            clsGroup.isAssigned
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {clsGroup.isAssigned ? 'مسند إليك' : 'في المؤسسة فقط'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Student Preview Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>معاينة قوائم التلاميذ وتوزيعهم:</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      يمكنك تغيير قسم أي تلميذ مباشرة من القائمة المنسدلة في الجدول أدناه قبل التأكيد.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setActivePreviewClassKey('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                        activePreviewClassKey === 'ALL'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      الكل ({allDetectedStudents.length})
                    </button>
                    {detectedClasses.map((cls, idx) => (
                      <button
                        key={`tab-${cls.id || cls.key}-${idx}`}
                        type="button"
                        onClick={() => setActivePreviewClassKey(cls.key)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                          activePreviewClassKey === cls.key
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cls.generatedName} ({cls.studentCount})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 sticky top-0 font-bold">
                      <tr>
                        <th className="p-2.5">ر.ت</th>
                        <th className="p-2.5">اللقب</th>
                        <th className="p-2.5">الاسم</th>
                        <th className="p-2.5">القسم المفرز إليه (قابل للتعديل)</th>
                        <th className="p-2.5 text-center">الجنس</th>
                        <th className="p-2.5">تاريخ الميلاد</th>
                        <th className="p-2.5">مكان الميلاد</th>
                        <th className="p-2.5">رقم التعريف الوطني</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewStudents.slice(0, 100).map((st, i) => {
                        return (
                          <tr key={`st-row-${st.national_id || ''}-${st.student_number || ''}-${i}`} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-mono text-slate-500">{st.student_number || i + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{st.last_name}</td>
                            <td className="p-2.5 font-bold text-slate-800">{st.first_name}</td>
                            <td className="p-2.5">
                              {/* Direct Class Selector Dropdown for this student */}
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={st.classKey}
                                  onChange={(e) => handleReassignStudent(i, e.target.value)}
                                  className="text-[11px] font-bold py-1 px-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                  title="تغيير قسم هذا التلميذ"
                                >
                                  {detectedClasses.map((cls, cIdx) => (
                                    <option key={`opt-${cls.id || cls.key}-${cIdx}`} value={cls.key}>
                                      {cls.generatedName}
                                    </option>
                                  ))}
                                </select>
                                <ArrowRightLeft className="w-3 h-3 text-emerald-600 shrink-0" />
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  st.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {st.gender === 'F' ? 'أنثى' : 'ذكر'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-600 font-mono text-[11px]">{st.birth_date || '—'}</td>
                            <td className="p-2.5 text-slate-600 text-[11px]">{st.birth_place || '—'}</td>
                            <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                              {st.national_id || st.registration_number || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-3">
            {detectedClasses.length > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmMultiClassImport}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الاستيراد والتوزيع...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      تأكيد استيراد ({detectedClasses.filter((c) => c.selectedForImport).length} أقسام /{' '}
                      {allDetectedStudents.length} تلميذ)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
