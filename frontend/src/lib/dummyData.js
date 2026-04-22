// Dummy data for frontend development and testing

const DUMMY_SUBJECTS = [
  {
    id: 1,
    name: 'Data Structures',
    code: 'CS101',
    class_room_name: 'Lab-A',
  },
  {
    id: 2,
    name: 'Web Development',
    code: 'CS102',
    class_room_name: 'Lab-B',
  },
  {
    id: 3,
    name: 'Database Design',
    code: 'CS103',
    class_room_name: 'Lab-C',
  },
  {
    id: 4,
    name: 'Algorithms',
    code: 'CS104',
    class_room_name: 'Lab-D',
  },
]

const DUMMY_STUDENTS = [
  {
    id: 1,
    full_name: 'Joycee Jamble',
    email: 'joycee@example.com',
  },
  {
    id: 2,
    full_name: 'Alice Johnson',
    email: 'alice@example.com',
  },
  {
    id: 3,
    full_name: 'Bob Smith',
    email: 'bob@example.com',
  },
  {
    id: 4,
    full_name: 'Charlie Brown',
    email: 'charlie@example.com',
  },
  {
    id: 5,
    full_name: 'Diana Prince',
    email: 'diana@example.com',
  },
  {
    id: 6,
    full_name: 'Eve Davis',
    email: 'eve@example.com',
  },
  {
    id: 7,
    full_name: 'Frank Miller',
    email: 'frank@example.com',
  },
  {
    id: 8,
    full_name: 'Grace Lee',
    email: 'grace@example.com',
  },
]

const DUMMY_LECTURES = [
  {
    id: 1,
    subject_id: 1,
    subject_name: 'Data Structures',
    class_room_name: 'Lab-A',
    lecture_date: '2026-04-22',
    lecture_number: 1,
    topic: 'Arrays and Linked Lists',
  },
  {
    id: 2,
    subject_id: 1,
    subject_name: 'Data Structures',
    class_room_name: 'Lab-A',
    lecture_date: '2026-04-21',
    lecture_number: 2,
    topic: 'Stack and Queue',
  },
  {
    id: 3,
    subject_id: 2,
    subject_name: 'Web Development',
    class_room_name: 'Lab-B',
    lecture_date: '2026-04-22',
    lecture_number: 1,
    topic: 'HTML & CSS Basics',
  },
  {
    id: 4,
    subject_id: 2,
    subject_name: 'Web Development',
    class_room_name: 'Lab-B',
    lecture_date: '2026-04-20',
    lecture_number: 2,
    topic: 'JavaScript Fundamentals',
  },
  {
    id: 5,
    subject_id: 3,
    subject_name: 'Database Design',
    class_room_name: 'Lab-C',
    lecture_date: '2026-04-19',
    lecture_number: 1,
    topic: 'Relational Models',
  },
]

const DUMMY_TEACHER_STATS = {
  total_lectures_conducted: 45,
  total_students_registered: 32,
  attendance_rate: 82,
  defaulter_students: 3,
}

const DUMMY_STUDENT_STATS = {
  total_lectures_registered: 42,
  lectures_attended: 35,
  attendance_rate: 83,
  is_defaulter: false,
}

const DUMMY_ADMIN_STATS = {
  total_students: 156,
  total_teachers: 12,
  total_subjects: 18,
  total_defaulters: 24,
}

const DUMMY_ATTENDANCE_ENTRIES = [
  { studentId: 1, studentName: 'Joycee Jamble', studentEmail: 'joycee@example.com', status: 'present' },
  { studentId: 2, studentName: 'Alice Johnson', studentEmail: 'alice@example.com', status: 'present' },
  { studentId: 3, studentName: 'Bob Smith', studentEmail: 'bob@example.com', status: 'absent' },
  { studentId: 4, studentName: 'Charlie Brown', studentEmail: 'charlie@example.com', status: 'late' },
  { studentId: 5, studentName: 'Diana Prince', studentEmail: 'diana@example.com', status: 'present' },
  { studentId: 6, studentName: 'Eve Davis', studentEmail: 'eve@example.com', status: '' },
  { studentId: 7, studentName: 'Frank Miller', studentEmail: 'frank@example.com', status: 'present' },
  { studentId: 8, studentName: 'Grace Lee', studentEmail: 'grace@example.com', status: 'absent' },
]

const DUMMY_SUMMARY_ROWS = [
  {
    student_id: 1,
    subject_id: 1,
    subject_name: 'Data Structures',
    subject_code: 'CS101',
    class_room_name: 'Lab-A',
    attendance_percentage: 92,
    present_count: 23,
    total_lectures: 25,
    is_defaulter: false,
  },
  {
    student_id: 1,
    subject_id: 2,
    subject_name: 'Web Development',
    subject_code: 'CS102',
    class_room_name: 'Lab-B',
    attendance_percentage: 88,
    present_count: 22,
    total_lectures: 25,
    is_defaulter: false,
  },
  {
    student_id: 1,
    subject_id: 3,
    subject_name: 'Database Design',
    subject_code: 'CS103',
    class_room_name: 'Lab-C',
    attendance_percentage: 70,
    present_count: 14,
    total_lectures: 20,
    is_defaulter: true,
  },
  {
    student_id: 1,
    subject_id: 4,
    subject_name: 'Algorithms',
    subject_code: 'CS104',
    class_room_name: 'Lab-D',
    attendance_percentage: 95,
    present_count: 19,
    total_lectures: 20,
    is_defaulter: false,
  },
]

const DUMMY_DEFAULTERS = [
  {
    student_id: 3,
    subject_id: 1,
    student_name: 'Bob Smith',
    subject_name: 'Data Structures',
    class_room_name: 'Lab-A',
    attendance_percentage: 68,
    present_count: 17,
    total_lectures: 25,
  },
  {
    student_id: 7,
    subject_id: 2,
    student_name: 'Frank Miller',
    subject_name: 'Web Development',
    class_room_name: 'Lab-B',
    attendance_percentage: 72,
    present_count: 18,
    total_lectures: 25,
  },
  {
    student_id: 6,
    subject_id: 3,
    student_name: 'Eve Davis',
    subject_name: 'Database Design',
    class_room_name: 'Lab-C',
    attendance_percentage: 65,
    present_count: 13,
    total_lectures: 20,
  },
  {
    student_id: 4,
    subject_id: 4,
    student_name: 'Charlie Brown',
    subject_name: 'Algorithms',
    class_room_name: 'Lab-D',
    attendance_percentage: 60,
    present_count: 12,
    total_lectures: 20,
  },
]

const DUMMY_PROFILES = [
  {
    id: 1,
    full_name: 'Joycee Jamble',
    email: 'joycee@example.com',
    role: 'teacher',
  },
  {
    id: 2,
    full_name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'student',
  },
  {
    id: 3,
    full_name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'student',
  },
  {
    id: 4,
    full_name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'teacher',
  },
  {
    id: 5,
    full_name: 'Diana Prince',
    email: 'diana@example.com',
    role: 'admin',
  },
  {
    id: 6,
    full_name: 'Eve Davis',
    email: 'eve@example.com',
    role: 'student',
  },
  {
    id: 7,
    full_name: 'Frank Miller',
    email: 'frank@example.com',
    role: 'student',
  },
  {
    id: 8,
    full_name: 'Grace Lee',
    email: 'grace@example.com',
    role: 'teacher',
  },
]

export {
  DUMMY_SUBJECTS,
  DUMMY_STUDENTS,
  DUMMY_LECTURES,
  DUMMY_TEACHER_STATS,
  DUMMY_STUDENT_STATS,
  DUMMY_ADMIN_STATS,
  DUMMY_ATTENDANCE_ENTRIES,
  DUMMY_SUMMARY_ROWS,
  DUMMY_DEFAULTERS,
  DUMMY_PROFILES,
}
