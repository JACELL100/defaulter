import { motion } from 'framer-motion'

import { formatMetricLabel, metricIcon } from '../lib/ui'

const MotionArticle = motion.article

export default function MetricCards({ stats }) {
  if (!stats) {
    return null
  }

  const entries = Object.entries(stats).filter(([key]) => key !== 'role')

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {entries.map(([key, value], index) => {
        const KeyIcon =
          metricIcon[
            Object.keys(metricIcon).find((match) => key.includes(match)) || 'attendance'
          ]

        return (
          <MotionArticle
            key={key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="glass-panel gradient-stroke rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {formatMetricLabel(key)}
              </p>
              <KeyIcon className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
            </p>
          </MotionArticle>
        )
      })}
    </div>
  )
}
