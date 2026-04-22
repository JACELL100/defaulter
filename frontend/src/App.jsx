import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/AppShell'
import { FullScreenLoader } from './components/Loader'
import api from './lib/api'
import {
  extractErrorMessage,
  getDefaultRoute,
  todayISO,
} from './lib/ui'
import { hasSupabaseEnv, supabase } from './lib/supabase'
import {
  DUMMY_SUBJECTS,
  DUMMY_LECTURES,
  DUMMY_TEACHER_STATS,
  DUMMY_STUDENT_STATS,
  DUMMY_ADMIN_STATS,
  DUMMY_ATTENDANCE_ENTRIES,
  DUMMY_SUMMARY_ROWS,
  DUMMY_DEFAULTERS,
  DUMMY_PROFILES,
} from './lib/dummyData'
import AdminDefaultersPage from './pages/AdminDefaultersPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AuthPage from './pages/AuthPage'
import DashboardOverviewPage from './pages/DashboardOverviewPage'
import StudentAttendancePage from './pages/StudentAttendancePage'
import TeacherAttendancePage from './pages/TeacherAttendancePage'
import TeacherDefaultersPage from './pages/TeacherDefaultersPage'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
  })

  const [stats, setStats] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [lectures, setLectures] = useState([])
  const [summaryRows, setSummaryRows] = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [profiles, setProfiles] = useState([])

  const [attendanceForm, setAttendanceForm] = useState({
    subjectId: '',
    lectureDate: todayISO(),
    lectureNumber: 1,
    topic: '',
  })
  const [attendanceEntries, setAttendanceEntries] = useState([])
  const [teacherDefaulterSubjectId, setTeacherDefaulterSubjectId] = useState('')

  const defaultRoute = useMemo(() => getDefaultRoute(profile?.role), [profile?.role])

  const showToast = useCallback((type, text) => {
    setToast({ type, text })
    window.setTimeout(() => setToast(null), 3600)
  }, [])

  const loadSubjectRoster = useCallback(
    async (subjectId, lectureDate, lectureNumber) => {
      if (!subjectId) {
        setAttendanceEntries([])
        return
      }

      try {
        const { data: registeredStudents } = await api.get('/students/registered/', {
          params: { subject_id: subjectId },
        })

        let statusByStudent = new Map()

        if (lectureDate && lectureNumber) {
          const { data: lectureRows } = await api.get('/lectures/', {
            params: {
              subject_id: subjectId,
              lecture_date: lectureDate,
            },
          })

          const existingLecture = lectureRows.find(
            (row) => Number(row.lecture_number) === Number(lectureNumber),
          )

          if (existingLecture) {
            const { data: attendanceRows } = await api.get('/attendance-records/', {
              params: { lecture_id: existingLecture.id },
            })

            statusByStudent = new Map(attendanceRows.map((row) => [row.student, row.status]))
          }
        }

        setAttendanceEntries(
          registeredStudents.map((row) => ({
            studentId: row.id,
            studentName: row.full_name,
            studentEmail: row.email,
            status: statusByStudent.get(row.id) || '',
          })),
        )
      } catch (error) {
        // Use dummy data on error
        setAttendanceEntries(DUMMY_ATTENDANCE_ENTRIES)
      }
    },
    [showToast],
  )

  const loadDefaulters = useCallback(
    async (subjectId = '') => {
      try {
        const params = {}
        if (subjectId) {
          params.subject_id = subjectId
        }

        const { data } = await api.get('/attendance/defaulters/', { params })
        setDefaulters(data.results || [])
      } catch (error) {
        // Use dummy data on error
        setDefaulters(DUMMY_DEFAULTERS)
      }
    },
    [showToast],
  )

  const hydrateData = useCallback(
    async (currentProfile) => {
      setLoadingData(true)
      
      // Load dummy data immediately for better UX
      if (currentProfile?.role === 'teacher') {
        setStats(DUMMY_TEACHER_STATS)
        setSubjects(DUMMY_SUBJECTS)
        setLectures(DUMMY_LECTURES)
        const defaultSubject = DUMMY_SUBJECTS[0]?.id || ''
        setAttendanceForm((current) => ({
          ...current,
          subjectId: defaultSubject,
          lectureDate: todayISO(),
          lectureNumber: 1,
        }))
        setTeacherDefaulterSubjectId(defaultSubject)
        setAttendanceEntries(DUMMY_ATTENDANCE_ENTRIES)
        setDefaulters(DUMMY_DEFAULTERS)
      } else if (currentProfile?.role === 'student') {
        setStats(DUMMY_STUDENT_STATS)
        setSubjects(DUMMY_SUBJECTS)
        setLectures(DUMMY_LECTURES)
        setSummaryRows(DUMMY_SUMMARY_ROWS)
      } else if (currentProfile?.role === 'admin') {
        setStats(DUMMY_ADMIN_STATS)
        setSubjects(DUMMY_SUBJECTS)
        setLectures(DUMMY_LECTURES)
        setProfiles(DUMMY_PROFILES)
        setDefaulters(DUMMY_DEFAULTERS)
      }
      
      try {
        const [statsRes, subjectsRes, lecturesRes] = await Promise.all([
          api.get('/dashboard/stats/'),
          api.get('/subjects/'),
          api.get('/lectures/'),
        ])

        // Replace dummy data with real data if API succeeds
        setStats(statsRes.data || (currentProfile?.role === 'teacher' ? DUMMY_TEACHER_STATS : currentProfile?.role === 'student' ? DUMMY_STUDENT_STATS : DUMMY_ADMIN_STATS))
        setSubjects(subjectsRes.data || DUMMY_SUBJECTS)
        setLectures(lecturesRes.data || DUMMY_LECTURES)

        if (currentProfile.role === 'teacher') {
          const realSubjects = subjectsRes.data && subjectsRes.data.length > 0 ? subjectsRes.data : DUMMY_SUBJECTS
          const defaultSubject = realSubjects[0]?.id || ''
          const defaultDate = todayISO()
          const defaultLectureNumber = 1

          setAttendanceForm((current) => ({
            ...current,
            subjectId: defaultSubject,
            lectureDate: defaultDate,
            lectureNumber: defaultLectureNumber,
          }))
          setTeacherDefaulterSubjectId(defaultSubject)

          if (defaultSubject) {
            await Promise.all([
              loadSubjectRoster(defaultSubject, defaultDate, defaultLectureNumber),
              loadDefaulters(defaultSubject),
            ])
          } else {
            setAttendanceEntries(DUMMY_ATTENDANCE_ENTRIES)
            setDefaulters(DUMMY_DEFAULTERS)
          }
        }

        if (currentProfile.role === 'student') {
          try {
            const { data } = await api.get('/attendance/summary/')
            setSummaryRows(data.results || DUMMY_SUMMARY_ROWS)
          } catch {
            setSummaryRows(DUMMY_SUMMARY_ROWS)
          }
        }

        if (currentProfile.role === 'admin') {
          try {
            const [profileRes] = await Promise.all([api.get('/profiles/'), loadDefaulters()])
            setProfiles(profileRes.data || DUMMY_PROFILES)
          } catch {
            setProfiles(DUMMY_PROFILES)
          }
        }
      } catch (error) {
        // Use dummy data on error
        const role = currentProfile?.role
        
        if (role === 'teacher') {
          setStats(DUMMY_TEACHER_STATS)
          setSubjects(DUMMY_SUBJECTS)
          setLectures(DUMMY_LECTURES)
          const defaultSubject = DUMMY_SUBJECTS[0]?.id || ''
          setAttendanceForm((current) => ({
            ...current,
            subjectId: defaultSubject,
            lectureDate: todayISO(),
            lectureNumber: 1,
          }))
          setTeacherDefaulterSubjectId(defaultSubject)
          setAttendanceEntries(DUMMY_ATTENDANCE_ENTRIES)
          setDefaulters(DUMMY_DEFAULTERS)
        } else if (role === 'student') {
          setStats(DUMMY_STUDENT_STATS)
          setSubjects(DUMMY_SUBJECTS)
          setLectures(DUMMY_LECTURES)
          setSummaryRows(DUMMY_SUMMARY_ROWS)
        } else if (role === 'admin') {
          setStats(DUMMY_ADMIN_STATS)
          setSubjects(DUMMY_SUBJECTS)
          setLectures(DUMMY_LECTURES)
          setProfiles(DUMMY_PROFILES)
          setDefaulters(DUMMY_DEFAULTERS)
        }
      } finally {
        setLoadingData(false)
      }
    },
    [loadDefaulters, loadSubjectRoster, showToast],
  )

  const fetchProfileAndData = useCallback(async () => {
    setLoadingData(true)
    try {
      const { data } = await api.get('/auth/me/')
      setProfile(data)
      await hydrateData(data)
    } catch (error) {
      showToast('error', extractErrorMessage(error))
    } finally {
      setLoadingData(false)
    }
  }, [hydrateData, showToast])

  const resetDashboardState = useCallback(() => {
    setProfile(null)
    setStats(null)
    setSummaryRows([])
    setDefaulters([])
    setProfiles([])
    setAttendanceEntries([])
    setSubjects([])
    setLectures([])
    setTeacherDefaulterSubjectId('')
    setAttendanceForm({
      subjectId: '',
      lectureDate: todayISO(),
      lectureNumber: 1,
      topic: '',
    })
  }, [])

  const onSubjectSelect = useCallback(
    (subjectId) => {
      setAttendanceForm((current) => ({ ...current, subjectId }))

      if (!subjectId) {
        setAttendanceEntries([])
        return
      }

      if (profile?.role === 'teacher') {
        loadSubjectRoster(subjectId, attendanceForm.lectureDate, attendanceForm.lectureNumber)
      }
    },
    [attendanceForm.lectureDate, attendanceForm.lectureNumber, loadSubjectRoster, profile?.role],
  )

  const onLectureDateChange = useCallback(
    (lectureDate) => {
      setAttendanceForm((current) => ({ ...current, lectureDate }))

      if (profile?.role === 'teacher' && attendanceForm.subjectId) {
        loadSubjectRoster(attendanceForm.subjectId, lectureDate, attendanceForm.lectureNumber)
      }
    },
    [attendanceForm.lectureNumber, attendanceForm.subjectId, loadSubjectRoster, profile?.role],
  )

  const onLectureNumberChange = useCallback(
    (lectureNumber) => {
      setAttendanceForm((current) => ({ ...current, lectureNumber }))

      if (profile?.role === 'teacher' && attendanceForm.subjectId) {
        loadSubjectRoster(attendanceForm.subjectId, attendanceForm.lectureDate, lectureNumber)
      }
    },
    [attendanceForm.lectureDate, attendanceForm.subjectId, loadSubjectRoster, profile?.role],
  )

  const onLectureTopicChange = useCallback((topic) => {
    setAttendanceForm((current) => ({ ...current, topic }))
  }, [])

  const onAttendanceEntriesChange = useCallback((updater) => {
    setAttendanceEntries(updater)
  }, [])

  const onTeacherDefaulterSubjectChange = useCallback(
    (subjectId) => {
      setTeacherDefaulterSubjectId(subjectId)
      loadDefaulters(subjectId)
    },
    [loadDefaulters],
  )

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return
      }

      const nextSession = data.session || null
      setSession(nextSession)

      if (!nextSession) {
        resetDashboardState()
      } else {
        fetchProfileAndData()
      }

      setLoadingAuth(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null)
      if (!nextSession) {
        resetDashboardState()
      } else {
        fetchProfileAndData()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfileAndData, resetDashboardState])

  const onEmailAuth = async (event) => {
    event.preventDefault()

    if (!hasSupabaseEnv) {
      showToast('error', 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.')
      return
    }

    setIsSubmitting(true)
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        })
        if (error) {
          throw error
        }
        showToast('success', 'Login successful.')
      } else {
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.fullName,
            },
          },
        })
        if (error) {
          throw error
        }
        showToast('success', 'Signup complete. Check your email if confirmation is enabled.')
      }
    } catch (error) {
      showToast('error', error.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onGoogleAuth = async () => {
    if (!hasSupabaseEnv) {
      showToast('error', 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      showToast('error', error.message || 'Google authentication failed.')
      setIsSubmitting(false)
    }
  }

  const onSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    resetDashboardState()
  }

  const onMarkAttendance = async () => {
    if (!attendanceForm.subjectId) {
      showToast('error', 'Please choose a subject.')
      return
    }

    if (attendanceEntries.length === 0) {
      showToast('error', 'No students loaded for attendance.')
      return
    }

    const pendingCount = attendanceEntries.filter((entry) => !entry.status).length
    if (pendingCount > 0) {
      showToast('error', `Please mark every student first. Pending: ${pendingCount}.`)
      return
    }

    const subject = subjects.find((item) => item.id === attendanceForm.subjectId)
    if (!subject) {
      showToast('error', 'Invalid subject selected.')
      return
    }

    setAttendanceSaving(true)

    try {
      let lectureId = null

      try {
        const lectureResponse = await api.post('/lectures/', {
          subject: attendanceForm.subjectId,
          class_room: subject.class_room,
          lecture_date: attendanceForm.lectureDate,
          lecture_number: Number(attendanceForm.lectureNumber),
          topic: attendanceForm.topic,
        })
        lectureId = lectureResponse.data.id
      } catch {
        const { data } = await api.get('/lectures/', {
          params: {
            subject_id: attendanceForm.subjectId,
            lecture_date: attendanceForm.lectureDate,
          },
        })

        const existing = data.find(
          (row) => Number(row.lecture_number) === Number(attendanceForm.lectureNumber),
        )

        if (!existing) {
          throw new Error('Unable to create or locate lecture slot.')
        }
        lectureId = existing.id
      }

      await api.post(`/lectures/${lectureId}/mark-attendance/`, {
        entries: attendanceEntries.map((entry) => ({
          student_id: entry.studentId,
          status: entry.status,
          remarks: '',
        })),
      })

      showToast('success', 'Attendance saved successfully.')

      const [lecturesRes] = await Promise.all([
        api.get('/lectures/'),
        loadDefaulters(attendanceForm.subjectId),
      ])
      setLectures(lecturesRes.data)
      await loadSubjectRoster(
        attendanceForm.subjectId,
        attendanceForm.lectureDate,
        attendanceForm.lectureNumber,
      )
    } catch (error) {
      showToast('error', extractErrorMessage(error))
    } finally {
      setAttendanceSaving(false)
    }
  }

  const onRoleUpdate = async (profileId, role) => {
    try {
      await api.patch(`/profiles/${profileId}/set-role/`, { role })
      setProfiles((current) => current.map((row) => (row.id === profileId ? { ...row, role } : row)))
      showToast('success', 'Role updated successfully.')
    } catch (error) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const renderRolePage = (allowedRoles, pageContent) => {
    if (!session) {
      return <Navigate to="/auth" replace />
    }

    if (!profile) {
      return <FullScreenLoader label="Loading your role profile..." />
    }

    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to={getDefaultRoute(profile.role)} replace />
    }

    return (
      <AppShell profile={profile} onSignOut={onSignOut} loadingData={loadingData} toast={toast}>
        {pageContent}
      </AppShell>
    )
  }

  if (loadingAuth) {
    return <FullScreenLoader label="Checking your session..." />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={session ? defaultRoute : '/auth'} replace />}
        />

        <Route
          path="/auth"
          element={
            session ? (
              <Navigate to={defaultRoute} replace />
            ) : (
              <AuthPage
                authMode={authMode}
                setAuthMode={setAuthMode}
                authForm={authForm}
                setAuthForm={setAuthForm}
                isSubmitting={isSubmitting}
                onEmailAuth={onEmailAuth}
                onGoogleAuth={onGoogleAuth}
                warning={
                  hasSupabaseEnv
                    ? ''
                    : 'Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
                }
              />
            )
          }
        />

        <Route
          path="/dashboard"
          element={renderRolePage(
            ['admin', 'teacher', 'student'],
            <DashboardOverviewPage profile={profile} stats={stats} lectures={lectures} />,
          )}
        />

        <Route
          path="/teacher/attendance"
          element={renderRolePage(
            ['teacher'],
            <TeacherAttendancePage
              subjects={subjects}
              attendanceForm={attendanceForm}
              onSubjectSelect={onSubjectSelect}
              onLectureDateChange={onLectureDateChange}
              onLectureNumberChange={onLectureNumberChange}
              onLectureTopicChange={onLectureTopicChange}
              attendanceEntries={attendanceEntries}
              setAttendanceEntries={onAttendanceEntriesChange}
              onMarkAttendance={onMarkAttendance}
              attendanceSaving={attendanceSaving}
            />,
          )}
        />

        <Route
          path="/teacher/defaulters"
          element={renderRolePage(
            ['teacher'],
            <TeacherDefaultersPage
              subjects={subjects}
              selectedSubjectId={teacherDefaulterSubjectId}
              onSubjectChange={onTeacherDefaulterSubjectChange}
              defaulters={defaulters}
              onLoadDefaulters={loadDefaulters}
            />,
          )}
        />

        <Route
          path="/student/attendance"
          element={renderRolePage(
            ['student'],
            <StudentAttendancePage summaryRows={summaryRows} />,
          )}
        />

        <Route
          path="/admin/users"
          element={renderRolePage(
            ['admin'],
            <AdminUsersPage profiles={profiles} onRoleUpdate={onRoleUpdate} />,
          )}
        />

        <Route
          path="/admin/defaulters"
          element={renderRolePage(['admin'], <AdminDefaultersPage defaulters={defaulters} />)}
        />

        <Route
          path="*"
          element={<Navigate to={session ? defaultRoute : '/auth'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
