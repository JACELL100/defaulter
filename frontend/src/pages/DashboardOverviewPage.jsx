import { motion } from 'framer-motion'

import MetricCards from '../components/MetricCards'
import RecentLectures from '../components/RecentLectures'

const MotionSection = motion.section

export default function DashboardOverviewPage({ profile, stats, lectures }) {
  return (
    <div className="space-y-4">
      <MetricCards stats={stats} />

      <MotionSection
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel gradient-stroke rounded-2xl p-5"
      >
        <h3 className="text-xl">Role Snapshot</h3>
        <p className="mt-1 text-sm text-slate-600">
          {profile.role === 'teacher'
            ? 'Mark lecture attendance, monitor risky students, and keep classes exam-ready.'
            : null}
          {profile.role === 'student'
            ? 'Track your subjectwise attendance and protect exam eligibility in real time.'
            : null}
          {profile.role === 'admin'
            ? 'Manage roles, monitor institution-wide attendance health, and oversee defaulters.'
            : null}
        </p>
      </MotionSection>

      <RecentLectures lectures={lectures} />
    </div>
  )
}
