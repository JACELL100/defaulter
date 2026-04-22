import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import BackgroundDecor from '../components/BackgroundDecor'

const MotionSection = motion.section

export default function AuthPage({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  isSubmitting,
  onEmailAuth,
  onGoogleAuth,
  warning,
}) {
  const isLogin = authMode === 'login'

  return (
    <div className="relative min-h-screen overflow-hidden p-4 md:p-8">
      <BackgroundDecor />
      <div className="soft-grid absolute inset-0 opacity-35" />

      <div className="relative mx-auto grid max-w-6xl items-stretch gap-6 md:grid-cols-2">
        <MotionSection
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel gradient-stroke rounded-3xl p-8 md:p-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-semibold tracking-wide text-orange-700">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Attendance Engine
          </div>

          <h1 className="mt-5 text-4xl leading-tight md:text-5xl">
            College Management,
            <span className="block text-teal-700">Built For Real Classrooms</span>
          </h1>

          <p className="mt-4 max-w-lg text-slate-600">
            Track classwise, lecturewise, and subjectwise attendance with powerful role-based
            controls for admins, teachers, and students.
          </p>

          <div className="mt-8 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="font-semibold text-slate-800">Teacher Control</p>
              <p className="mt-1 text-slate-600">Mark attendance in seconds and monitor risk live.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="font-semibold text-slate-800">Defaulter Radar</p>
              <p className="mt-1 text-slate-600">Auto flags students below 75% per subject.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 md:col-span-2">
              <p className="font-semibold text-slate-800">Exam Eligibility Guardrails</p>
              <p className="mt-1 text-slate-600">
                Attendance thresholds are enforced and visible to all relevant stakeholders.
              </p>
            </div>
          </div>
        </MotionSection>

        <MotionSection
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel gradient-stroke rounded-3xl p-8 md:p-10"
        >
          <h2 className="text-2xl">{isLogin ? 'Welcome Back' : 'Create Your Account'}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLogin
              ? 'Sign in with email/password or Google.'
              : 'Sign up with email/password, then continue with your role dashboard.'}
          </p>

          {warning ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {warning}
            </div>
          ) : null}

          <div className="mt-5 flex rounded-xl bg-slate-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 rounded-lg px-3 py-2 transition ${
                isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 rounded-lg px-3 py-2 transition ${
                !isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form className="mt-5 space-y-3" onSubmit={onEmailAuth}>
            {!isLogin ? (
              <input
                type="text"
                required
                placeholder="Full Name"
                value={authForm.fullName}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, fullName: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-400/50 focus:ring"
              />
            ) : null}
            <input
              type="email"
              required
              placeholder="you@college.edu"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm((current) => ({ ...current, email: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-400/50 focus:ring"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((current) => ({ ...current, password: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-400/50 focus:ring"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[linear-gradient(135deg,#ee5f3a,#1ea896)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <button
            type="button"
            onClick={onGoogleAuth}
            disabled={isSubmitting}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Continue with Google
          </button>
        </MotionSection>
      </div>
    </div>
  )
}
