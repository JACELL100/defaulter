import {
  AlertCircle,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'

export const roleMeta = {
  admin: {
    icon: Shield,
    label: 'Admin',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  teacher: {
    icon: UserCheck,
    label: 'Teacher',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  student: {
    icon: GraduationCap,
    label: 'Student',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
  },
}

export const metricIcon = {
  users: Users,
  teachers: UserCheck,
  students: GraduationCap,
  classes: Sparkles,
  subjects: BookOpenCheck,
  lectures: CalendarCheck2,
  attendance: CheckCircle2,
  defaulters: AlertCircle,
}

export const todayISO = () => new Date().toISOString().slice(0, 10)

export function extractErrorMessage(error) {
  const data = error?.response?.data

  if (typeof data === 'string') {
    return data
  }

  if (Array.isArray(data)) {
    return data.join(', ')
  }

  if (data && typeof data === 'object') {
    const first = Object.values(data)[0]
    if (Array.isArray(first)) {
      return first[0]
    }
    if (typeof first === 'string') {
      return first
    }
    return JSON.stringify(data)
  }

  return error?.message || 'Something went wrong.'
}

export function formatMetricLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function roleBadge(role) {
  return roleMeta[role] || roleMeta.student
}

export function getDefaultRoute(role) {
  if (role === 'teacher') {
    return '/teacher/attendance'
  }
  if (role === 'student') {
    return '/student/attendance'
  }
  if (role === 'admin') {
    return '/admin/users'
  }
  return '/dashboard'
}

export function getNavByRole(role) {
  const common = [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }]

  if (role === 'teacher') {
    return [
      ...common,
      { to: '/teacher/attendance', label: 'Attendance Studio', icon: CalendarCheck2 },
      { to: '/teacher/defaulters', label: 'Defaulters Radar', icon: AlertCircle },
    ]
  }

  if (role === 'student') {
    return [...common, { to: '/student/attendance', label: 'My Attendance', icon: BookOpenCheck }]
  }

  if (role === 'admin') {
    return [
      ...common,
      { to: '/admin/users', label: 'Role Control', icon: Users },
      { to: '/admin/defaulters', label: 'Global Defaulters', icon: AlertCircle },
    ]
  }

  return common
}
