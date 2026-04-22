import { motion } from 'framer-motion'

const MotionDiv = motion.div

export default function Toast({ toast }) {
  if (!toast) {
    return null
  }

  const isError = toast.type === 'error'

  return (
    <MotionDiv
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {toast.text}
    </MotionDiv>
  )
}
