import { useMemo, useRef, useCallback } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileWarning,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  Users,
} from 'lucide-react'
import jsPDF from 'jspdf'

// ─── Risk level helpers ─────────────────────────────────────────────────────
function riskLevel(pct) {
  if (pct < 50) return { label: 'Critical', color: 'rose', weight: 3 }
  if (pct < 65) return { label: 'High Risk', color: 'orange', weight: 2 }
  return { label: 'At Risk', color: 'amber', weight: 1 }
}

function riskBadgeClasses(risk) {
  const map = {
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return map[risk.color] || map.amber
}

function riskBarColor(risk) {
  const map = {
    rose: 'bg-gradient-to-r from-rose-500 to-rose-400',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-400',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
  }
  return map[risk.color] || map.amber
}

function riskCardBorder(risk) {
  const map = {
    rose: 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-white',
    orange: 'border-orange-200 bg-gradient-to-br from-orange-50/80 to-white',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white',
  }
  return map[risk.color] || map.amber
}

// ─── Inline SVG mini bar chart ──────────────────────────────────────────────
function MiniBarChart({ data, height = 160 }) {
  if (!data || data.length === 0) return null

  const barWidth = Math.min(48, Math.max(18, Math.floor(340 / data.length) - 6))
  const chartWidth = data.length * (barWidth + 6) + 20
  const maxPct = 100

  return (
    <div className="overflow-x-auto pb-2">
      <svg
        width={Math.max(chartWidth, 200)}
        height={height + 40}
        viewBox={`0 0 ${Math.max(chartWidth, 200)} ${height + 40}`}
        className="mx-auto"
      >
        {/* Threshold line at 75% */}
        <line
          x1={10}
          y1={height - (75 / maxPct) * height + 10}
          x2={chartWidth - 10}
          y2={height - (75 / maxPct) * height + 10}
          stroke="#ef4444"
          strokeDasharray="5,4"
          strokeWidth={1.5}
          opacity={0.5}
        />
        <text
          x={chartWidth - 8}
          y={height - (75 / maxPct) * height + 6}
          fontSize={9}
          fill="#ef4444"
          textAnchor="end"
          fontWeight={600}
        >
          75%
        </text>

        {data.map((item, i) => {
          const barH = (item.attendance_percentage / maxPct) * height
          const x = 10 + i * (barWidth + 6)
          const y = height - barH + 10
          const risk = riskLevel(item.attendance_percentage)
          const fillMap = { rose: '#f43f5e', orange: '#f97316', amber: '#f59e0b' }

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={fillMap[risk.color]}
                opacity={0.85}
              />
              {/* Percentage label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                fontSize={9}
                fontWeight={700}
                fill="#374151"
                textAnchor="middle"
              >
                {Math.round(item.attendance_percentage)}%
              </text>
              {/* Name label */}
              <text
                x={x + barWidth / 2}
                y={height + 24}
                fontSize={8}
                fill="#64748b"
                textAnchor="middle"
                fontWeight={500}
              >
                {item.student_name?.split(' ')[0] || ''}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Subject breakdown donut-like chart ─────────────────────────────────────
function SubjectBreakdown({ data }) {
  if (!data || data.length === 0) return null

  // Group by subject
  const subjectGroups = {}
  data.forEach((row) => {
    const key = row.subject_name || row.subject_code || 'Unknown'
    if (!subjectGroups[key]) {
      subjectGroups[key] = { name: key, count: 0, totalPct: 0 }
    }
    subjectGroups[key].count += 1
    subjectGroups[key].totalPct += row.attendance_percentage
  })

  const subjects = Object.values(subjectGroups).sort((a, b) => b.count - a.count)
  const totalDefaulters = data.length

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981']

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-indigo-500" />
        Subject-wise Breakdown
      </h4>
      {subjects.map((sub, i) => {
        const avgPct = Math.round(sub.totalPct / sub.count)
        const widthPct = Math.max(8, (sub.count / totalDefaulters) * 100)
        return (
          <div key={sub.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{sub.name}</span>
              <span className="text-slate-500">
                {sub.count} student{sub.count > 1 ? 's' : ''} · avg {avgPct}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── PDF export function ────────────────────────────────────────────────────
export function generateDefaultersPDF(defaulters, subjects, teacherName = 'Teacher') {
  if (!defaulters || defaulters.length === 0) {
    return false
  }

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  const usableWidth = pageWidth - margin * 2
  let y = margin

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229) // indigo-600
  doc.rect(0, 0, pageWidth, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Defaulters Report', margin, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated by ${teacherName} on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 28)
  doc.text(`Students below 75% attendance threshold`, margin, 34)

  y = 48

  // ── Summary stats ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', margin, y)
  y += 8

  const critical = defaulters.filter((d) => d.attendance_percentage < 50).length
  const highRisk = defaulters.filter((d) => d.attendance_percentage >= 50 && d.attendance_percentage < 65).length
  const atRisk = defaulters.filter((d) => d.attendance_percentage >= 65).length
  const avgPct = Math.round(defaulters.reduce((sum, d) => sum + d.attendance_percentage, 0) / defaulters.length)

  const uniqueSubjects = [...new Set(defaulters.map((d) => d.subject_name))].length
  const uniqueStudents = [...new Set(defaulters.map((d) => d.student_id))].length

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const summaryLines = [
    `Total defaulter entries: ${defaulters.length} across ${uniqueStudents} unique student(s) and ${uniqueSubjects} subject(s)`,
    `Average attendance: ${avgPct}%`,
    `Critical (< 50%): ${critical}  |  High Risk (50-65%): ${highRisk}  |  At Risk (65-75%): ${atRisk}`,
  ]
  summaryLines.forEach((line) => {
    doc.text(line, margin, y)
    y += 5
  })

  y += 6

  // ── Table header ──────────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249) // slate-100
  doc.rect(margin, y, usableWidth, 8, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)

  const colX = [margin + 2, margin + 48, margin + 98, margin + 128, margin + 150]
  const colHeaders = ['Student Name', 'Subject', 'Classroom', 'Attendance', 'Risk Level']
  colHeaders.forEach((header, i) => {
    doc.text(header, colX[i], y + 5.5)
  })
  y += 10

  // ── Table rows ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 41, 59)

  const sorted = [...defaulters].sort((a, b) => a.attendance_percentage - b.attendance_percentage)

  sorted.forEach((row, index) => {
    if (y > 270) {
      doc.addPage()
      y = margin
    }

    // Alternating row bg
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y - 1, usableWidth, 7, 'F')
    }

    const risk = riskLevel(row.attendance_percentage)

    doc.setFontSize(8)
    doc.text(row.student_name || '—', colX[0], y + 4)
    doc.text(row.subject_name || '—', colX[1], y + 4)
    doc.text(row.class_room_name || '—', colX[2], y + 4)

    // Color-coded attendance
    const pctText = `${row.attendance_percentage}% (${row.present_count}/${row.total_lectures})`
    if (row.attendance_percentage < 50) {
      doc.setTextColor(225, 29, 72)
    } else if (row.attendance_percentage < 65) {
      doc.setTextColor(234, 88, 12)
    } else {
      doc.setTextColor(202, 138, 4)
    }
    doc.text(pctText, colX[3], y + 4)

    doc.setTextColor(30, 41, 59)
    doc.text(risk.label, colX[4], y + 4)

    y += 7
  })

  // ── Footer ────────────────────────────────────────────────────────────────
  y = doc.internal.pageSize.getHeight() - 12
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('College Attendance Management System — Confidential', margin, y)
  doc.text(`Page 1`, pageWidth - margin - 10, y)

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `defaulters_report_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
  return true
}

// ═════════════════════════════════════════════════════════════════════════════
// Main page component
// ═════════════════════════════════════════════════════════════════════════════
export default function TeacherDefaultersPage({
  subjects,
  selectedSubjectId,
  onSubjectChange,
  defaulters,
  onLoadDefaulters,
  teacherName,
}) {
  const reportRef = useRef(null)

  // ── Computed analytics ────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!defaulters || defaulters.length === 0) {
      return { total: 0, critical: 0, highRisk: 0, atRisk: 0, avgPct: 0, worstSubject: null, uniqueStudents: 0 }
    }

    const critical = defaulters.filter((d) => d.attendance_percentage < 50).length
    const highRisk = defaulters.filter((d) => d.attendance_percentage >= 50 && d.attendance_percentage < 65).length
    const atRisk = defaulters.filter((d) => d.attendance_percentage >= 65).length
    const avgPct = Math.round(defaulters.reduce((sum, d) => sum + d.attendance_percentage, 0) / defaulters.length)

    // Find worst subject (most defaulters)
    const subjectCounts = {}
    defaulters.forEach((d) => {
      subjectCounts[d.subject_name] = (subjectCounts[d.subject_name] || 0) + 1
    })
    const worstSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]

    const uniqueStudents = [...new Set(defaulters.map((d) => d.student_id))].length

    return { total: defaulters.length, critical, highRisk, atRisk, avgPct, worstSubject, uniqueStudents }
  }, [defaulters])

  // ── Sorted defaulters (worst first) ───────────────────────────────────────
  const sortedDefaulters = useMemo(
    () => [...defaulters].sort((a, b) => a.attendance_percentage - b.attendance_percentage),
    [defaulters],
  )

  // ── PDF download handler ──────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(() => {
    const success = generateDefaultersPDF(defaulters, subjects, teacherName || 'Teacher')
    if (!success) {
      alert('No defaulters to export.')
    }
  }, [defaulters, subjects, teacherName])

  return (
    <section className="space-y-6" ref={reportRef}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="glass-panel gradient-stroke rounded-2xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Defaulters Radar
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Students below 75% attendance are ineligible for final exams. Monitor risk levels and take action.
            </p>
          </div>

          <div className="flex flex-wrap w-full gap-2 md:w-auto">
            <select
              value={selectedSubjectId}
              onChange={(event) => onSubjectChange(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm md:min-w-[250px]"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code ? `${subject.code} - ` : ''}
                  {subject.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onLoadDefaulters(selectedSubjectId)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={defaulters.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {defaulters.length === 0 ? (
        /* ── Empty state ─────────────────────────────────────────────────── */
        <div className="glass-panel gradient-stroke rounded-2xl px-6 py-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">All Clear!</p>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            No students are below the 75% attendance threshold for the selected filter.
            Keep up the great engagement!
          </p>
        </div>
      ) : (
        <>
          {/* ── Summary Stats Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            <div className="glass-panel gradient-stroke rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{analytics.total}</p>
              <p className="text-[10px] text-slate-500">{analytics.uniqueStudents} unique student{analytics.uniqueStudents > 1 ? 's' : ''}</p>
            </div>

            <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Critical</p>
              <p className="mt-1 text-2xl font-black text-rose-700">{analytics.critical}</p>
              <p className="text-[10px] text-rose-500">&lt; 50% attendance</p>
            </div>

            <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">High Risk</p>
              <p className="mt-1 text-2xl font-black text-orange-700">{analytics.highRisk}</p>
              <p className="text-[10px] text-orange-500">50% — 65%</p>
            </div>

            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">At Risk</p>
              <p className="mt-1 text-2xl font-black text-amber-700">{analytics.atRisk}</p>
              <p className="text-[10px] text-amber-500">65% — 75%</p>
            </div>

            <div className="glass-panel gradient-stroke rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg Attendance</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{analytics.avgPct}%</p>
              <p className="text-[10px] text-slate-500">among defaulters</p>
            </div>

            <div className="glass-panel gradient-stroke rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Worst Subject</p>
              <p className="mt-1 text-sm font-black text-slate-900 truncate">
                {analytics.worstSubject ? analytics.worstSubject[0] : '—'}
              </p>
              <p className="text-[10px] text-slate-500">
                {analytics.worstSubject ? `${analytics.worstSubject[1]} defaulter${analytics.worstSubject[1] > 1 ? 's' : ''}` : ''}
              </p>
            </div>
          </div>

          {/* ── Charts Row ───────────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bar chart */}
            <div className="glass-panel gradient-stroke rounded-2xl p-5">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                Attendance Distribution
              </h4>
              <MiniBarChart data={sortedDefaulters} />
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Red dashed line = 75% threshold
              </p>
            </div>

            {/* Subject breakdown */}
            <div className="glass-panel gradient-stroke rounded-2xl p-5">
              <SubjectBreakdown data={defaulters} />
            </div>
          </div>

          {/* ── Detailed Defaulter Cards ──────────────────────────────────── */}
          <div className="glass-panel gradient-stroke rounded-2xl p-6 md:p-8">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
              <FileWarning className="h-4 w-4 text-rose-500" />
              Detailed Defaulter List ({sortedDefaulters.length})
            </h4>

            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {sortedDefaulters.map((row) => {
                const risk = riskLevel(row.attendance_percentage)
                return (
                  <div
                    key={`${row.student_id}-${row.subject_id}`}
                    className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${riskCardBorder(risk)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900">{row.student_name}</p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${riskBadgeClasses(risk)}`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {risk.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {row.subject_name}
                          {row.subject_code ? ` (${row.subject_code})` : ''}
                          {' · '}
                          {row.class_room_name}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-slate-900">
                          {row.attendance_percentage}%
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {row.present_count} / {row.total_lectures} lectures
                        </p>
                      </div>
                    </div>

                    {/* Attendance progress bar */}
                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${riskBarColor(risk)}`}
                          style={{ width: `${Math.max(3, row.attendance_percentage)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>0%</span>
                        <span className="text-rose-400 font-semibold">75% threshold</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
