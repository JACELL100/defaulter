import { AnimatePresence } from 'framer-motion'
import { LogOut, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import BackgroundDecor from './BackgroundDecor'
import { InlineLoader } from './Loader'
import Toast from './Toast'
import { getNavByRole, roleBadge } from '../lib/ui'

function NavItem({ to, icon, label }) {
  const IconComponent = icon

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          isActive
            ? 'bg-[linear-gradient(135deg,#ee5f3a,#1ea896)] text-white shadow-lg'
            : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
        }`
      }
    >
      <IconComponent className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppShell({ profile, onSignOut, loadingData, toast, children }) {
  const meta = roleBadge(profile.role)
  const RoleIcon = meta.icon
  const navItems = getNavByRole(profile.role)

  return (
    <div className="relative min-h-screen overflow-hidden p-4 md:p-6">
      <BackgroundDecor />
      <div className="soft-grid absolute inset-0 opacity-35" />

      <div className="relative mx-auto grid w-full max-w-[1680px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass-panel gradient-stroke rounded-2xl p-5 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-semibold tracking-wide text-orange-700">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Attendance
          </div>

          <h2 className="mt-4 text-2xl">Campus Pulse</h2>
          <p className="mt-1 text-sm text-slate-600">
            Role-aware attendance dashboard for daily classroom operations.
          </p>

          <nav className="mt-5 space-y-2">
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </nav>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
            Defaulter policy: students below <span className="font-semibold text-slate-900">75%</span>{' '}
            attendance in any subject are flagged.
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <header className="glass-panel gradient-stroke rounded-2xl p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Modern College Attendance
                </p>
                <h1 className="mt-1 text-3xl md:text-4xl">Welcome, {profile.full_name}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.color}`}
                >
                  <RoleIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          <AnimatePresence>
            <Toast toast={toast} />
          </AnimatePresence>

          {loadingData ? <InlineLoader /> : null}

          {children}
        </section>
      </div>
    </div>
  )
}
