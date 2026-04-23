/**
 * Direct Supabase queries for subjects, students, and attendance data.
 * These bypass the Django API and query Supabase tables directly
 * so the frontend works even when the backend server isn't running.
 */

import { supabase, hasSupabaseEnv } from './supabase'

/**
 * Fetch all subjects with their classroom name.
 * Maps to the Django SubjectSerializer shape: { id, name, code, class_room, class_room_name, teacher, teacher_name, credits }
 */
export async function fetchSubjects() {
  if (!hasSupabaseEnv) return []

  const { data, error } = await supabase
    .from('attendance_subject')
    .select('id, name, code, credits, class_room_id, attendance_classroom ( name ), teacher_id, attendance_userprofile!attendance_subject_teacher_id_fkey ( full_name )')
    .order('name')

  if (error) {
    console.warn('fetchSubjects error:', error.message)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    credits: row.credits,
    class_room: row.class_room_id,
    class_room_name: row.attendance_classroom?.name || '',
    teacher: row.teacher_id,
    teacher_name: row.attendance_userprofile?.full_name || '',
  }))
}

/**
 * Fetch all active students from profiles table.
 * Returns: [{ id, full_name, email, enrollment_number, department, semester }]
 */
export async function fetchStudents() {
  if (!hasSupabaseEnv) return []

  const { data, error } = await supabase
    .from('attendance_userprofile')
    .select('id, full_name, email, enrollment_number, department, semester')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    console.warn('fetchStudents error:', error.message)
    return []
  }

  return data || []
}

/**
 * Fetch lectures with subject info.
 * Returns shape matching Django LectureSerializer.
 */
export async function fetchLectures() {
  if (!hasSupabaseEnv) return []

  const { data, error } = await supabase
    .from('attendance_lecture')
    .select('id, lecture_date, lecture_number, topic, subject_id, class_room_id, marked_by_id, attendance_subject ( name, code ), attendance_classroom ( name ), attendance_userprofile!attendance_lecture_marked_by_id_fkey ( full_name )')
    .order('lecture_date', { ascending: false })
    .limit(50)

  if (error) {
    console.warn('fetchLectures error:', error.message)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    subject: row.subject_id,
    subject_name: row.attendance_subject?.name || '',
    subject_code: row.attendance_subject?.code || '',
    class_room: row.class_room_id,
    class_room_name: row.attendance_classroom?.name || '',
    lecture_date: row.lecture_date,
    lecture_number: row.lecture_number,
    topic: row.topic || '',
    marked_by: row.marked_by_id,
    marked_by_name: row.attendance_userprofile?.full_name || '',
  }))
}

/**
 * Fetch attendance records for a specific lecture.
 */
export async function fetchAttendanceForLecture(lectureId) {
  if (!hasSupabaseEnv || !lectureId) return []

  const { data, error } = await supabase
    .from('attendance_attendancerecord')
    .select('id, student_id, status, remarks')
    .eq('lecture_id', lectureId)

  if (error) {
    console.warn('fetchAttendanceForLecture error:', error.message)
    return []
  }

  return (data || []).map((row) => ({
    student: row.student_id,
    status: row.status,
    remarks: row.remarks,
  }))
}

/**
 * Build an attendance summary per student per subject.
 * This replicates the Django `build_attendance_summary` logic entirely client-side.
 * Returns: [{ student_id, student_name, subject_id, subject_name, subject_code, class_room_name,
 *             present_count, total_lectures, attendance_percentage, is_defaulter }]
 */
export async function fetchDefaulters(subjectIdFilter = '', threshold = 75) {
  if (!hasSupabaseEnv) return []

  // 1. Get all subjects
  let subjectQuery = supabase
    .from('attendance_subject')
    .select('id, name, code, class_room_id, attendance_classroom ( name )')

  if (subjectIdFilter) {
    subjectQuery = subjectQuery.eq('id', subjectIdFilter)
  }

  const { data: subjectsRaw, error: subjectsError } = await subjectQuery
  if (subjectsError) {
    console.warn('fetchDefaulters subjects error:', subjectsError.message)
    return []
  }

  const subjects = subjectsRaw || []
  if (subjects.length === 0) return []

  const subjectIds = subjects.map((s) => s.id)

  // 2. Get lecture counts per subject
  const { data: lectures, error: lecturesError } = await supabase
    .from('attendance_lecture')
    .select('id, subject_id')
    .in('subject_id', subjectIds)

  if (lecturesError) {
    console.warn('fetchDefaulters lectures error:', lecturesError.message)
    return []
  }

  const lectureCounts = {}
  const lectureIdsBySubject = {}
  for (const lec of lectures || []) {
    lectureCounts[lec.subject_id] = (lectureCounts[lec.subject_id] || 0) + 1
    if (!lectureIdsBySubject[lec.subject_id]) lectureIdsBySubject[lec.subject_id] = []
    lectureIdsBySubject[lec.subject_id].push(lec.id)
  }

  // 3. Get subject enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('attendance_subjectenrollment')
    .select('student_id, subject_id')
    .in('subject_id', subjectIds)

  if (enrollmentsError) {
    console.warn('fetchDefaulters enrollments error:', enrollmentsError.message)
    return []
  }

  if (!enrollments || enrollments.length === 0) return []

  // 4. Get all attendance records for the relevant lectures
  const allLectureIds = Object.values(lectureIdsBySubject).flat()
  if (allLectureIds.length === 0) return []

  // Supabase has a limit on .in() array size, but for demo data this is fine
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from('attendance_attendancerecord')
    .select('student_id, status, lecture_id')
    .in('lecture_id', allLectureIds)
    .in('status', ['present', 'late'])

  if (attendanceError) {
    console.warn('fetchDefaulters attendance error:', attendanceError.message)
    return []
  }

  // Build a map: { `${studentId}-${subjectId}` -> presentCount }
  // We need to figure out which subject each lecture belongs to
  const lectureToSubject = {}
  for (const lec of lectures || []) {
    lectureToSubject[lec.id] = lec.subject_id
  }

  const presentMap = {}
  for (const rec of attendanceRecords || []) {
    const subjectId = lectureToSubject[rec.lecture_id]
    const key = `${rec.student_id}-${subjectId}`
    presentMap[key] = (presentMap[key] || 0) + 1
  }

  // 5. Get student names
  const studentIds = [...new Set(enrollments.map((e) => e.student_id))]
  const { data: students, error: studentsError } = await supabase
    .from('attendance_userprofile')
    .select('id, full_name, email')
    .in('id', studentIds)

  if (studentsError) {
    console.warn('fetchDefaulters students error:', studentsError.message)
    return []
  }

  const studentMap = {}
  for (const s of students || []) {
    studentMap[s.id] = s
  }

  const subjectMap = {}
  for (const s of subjects) {
    subjectMap[s.id] = s
  }

  // 6. Build summary and filter defaulters
  const defaulters = []
  for (const enrollment of enrollments) {
    const total = lectureCounts[enrollment.subject_id] || 0
    if (total === 0) continue

    const key = `${enrollment.student_id}-${enrollment.subject_id}`
    const presentCount = presentMap[key] || 0
    const percentage = Math.round((presentCount / total) * 100 * 100) / 100
    const subject = subjectMap[enrollment.subject_id]
    const student = studentMap[enrollment.student_id]

    if (!student || !subject) continue

    if (percentage < threshold) {
      defaulters.push({
        student_id: enrollment.student_id,
        student_name: student.full_name,
        student_email: student.email,
        subject_id: enrollment.subject_id,
        subject_name: subject.name,
        subject_code: subject.code,
        class_room_name: subject.attendance_classroom?.name || '',
        present_count: presentCount,
        total_lectures: total,
        attendance_percentage: percentage,
        is_defaulter: true,
      })
    }
  }

  return defaulters
}
