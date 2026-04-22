import { LoaderCircle } from 'lucide-react'

export function FullScreenLoader({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel gradient-stroke rounded-3xl p-8 text-center">
        <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-teal-600" />
        <p className="mt-3 text-sm text-slate-600">{label}</p>
      </div>
    </div>
  )
}

export function InlineLoader({ label = 'Syncing latest data...' }) {
  return (
    <div className="glass-panel gradient-stroke rounded-2xl px-4 py-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <LoaderCircle className="h-4 w-4 animate-spin text-teal-600" />
        <span>{label}</span>
      </div>
    </div>
  )
}
