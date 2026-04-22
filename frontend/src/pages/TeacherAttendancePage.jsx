import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, XCircle } from 'lucide-react'

export default function TeacherAttendancePage({
  subjects,
  attendanceForm,
  onSubjectSelect,
  onLectureDateChange,
  onLectureNumberChange,
  onLectureTopicChange,
  attendanceEntries,
  setAttendanceEntries,
  onMarkAttendance,
  attendanceSaving,
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  const activeSubject = useMemo(
    () => subjects.find((subject) => subject.id === attendanceForm.subjectId),
    [subjects, attendanceForm.subjectId],
  )

  const lastIndex = Math.max(attendanceEntries.length - 1, 0)
  const focusIndex = Math.min(activeIndex, lastIndex)
  const activeEntry = attendanceEntries[focusIndex] || null

  const statusCount = useMemo(
    () =>
      attendanceEntries.reduce(
        (count, entry) => {
          if (!entry.status) {
            count.pending += 1
            return count
          }

          count[entry.status] += 1
          return count
        },
        { present: 0, absent: 0, late: 0, pending: 0 },
      ),
    [attendanceEntries],
  )

  const setStatus = (studentId, status, nextIndex = null) => {
    setAttendanceEntries((rows) =>
      rows.map((row) => (row.studentId === studentId ? { ...row, status } : row)),
    )

    if (nextIndex !== null) {
      setActiveIndex(Math.min(nextIndex, lastIndex))
    }
  }

  const markFocusedStudent = (status) => {
    if (!activeEntry) {
      return
    }

    setStatus(activeEntry.studentId, status, focusIndex + 1)
  }

  const statusBadgeTone = (status) => {
    if (status === 'present') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    if (status === 'absent') {
      return 'bg-rose-100 text-rose-700 border-rose-200'
    }
    if (status === 'late') {
      return 'bg-amber-100 text-amber-700 border-amber-200'
    }
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <section className="glass-panel gradient-stroke rounded-2xl p-4 sm:p-6 xl:p-8">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900">Attendance Studio</h3>
        <p className="mt-2 text-sm text-slate-600">
          After each lecture, use horizontal roll call to mark students one by one.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
            <select
              value={attendanceForm.subjectId}
              onChange={(event) => onSubjectSelect(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900"
            >
              <option value="">Choose Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code ? `${subject.code} - ` : ''}
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Lecture Date</label>
            <input
              type="date"
              value={attendanceForm.lectureDate}
              onChange={(event) => onLectureDateChange(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Lecture Number</label>
            <input
              type="number"
              min={1}
              value={attendanceForm.lectureNumber}
              onChange={(event) => onLectureNumberChange(event.target.value)}
              placeholder="e.g., 1, 2, 3"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Lecture Topic</label>
            <input
              type="text"
              value={attendanceForm.topic}
              onChange={(event) => onLectureTopicChange(event.target.value)}
              placeholder="e.g., Arrays and Linked Lists"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Classroom</p>
            <p className="mt-2 text-lg font-bold text-teal-900">
              {activeSubject?.class_room_name || '--'}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Current Student</p>
            <p className="mt-2 text-lg font-bold text-blue-900">
              {attendanceEntries.length === 0 ? '--' : `${focusIndex + 1} of ${attendanceEntries.length}`}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Present {statusCount.present}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700">
              <XCircle className="h-4 w-4" />
              Absent {statusCount.absent}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock3 className="h-4 w-4" />
              Late {statusCount.late}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Pending {statusCount.pending}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveIndex(Math.max(focusIndex - 1, 0))}
                disabled={attendanceEntries.length === 0 || focusIndex === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={() => setActiveIndex(Math.min(focusIndex + 1, lastIndex))}
                disabled={attendanceEntries.length === 0 || focusIndex >= lastIndex}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => markFocusedStudent('present')}
                disabled={!activeEntry}
                className="rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
              >
                ✓ Mark Present + Next
              </button>

              <button
                type="button"
                onClick={() => markFocusedStudent('absent')}
                disabled={!activeEntry}
                className="rounded-lg border border-rose-300 bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200 disabled:opacity-50"
              >
                ✕ Mark Absent + Next
              </button>

              <button
                type="button"
                onClick={() => markFocusedStudent('late')}
                disabled={!activeEntry}
                className="rounded-lg border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200 disabled:opacity-50"
              >
                ⏱ Mark Late + Next
              </button>
            </div>
          </div>
        </div>

        <div>
        <h4 className="mb-4 text-sm font-semibold text-slate-700">Student Roster</h4>
          <div className="pb-2">
            {attendanceEntries.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <p className="text-sm font-medium text-slate-600">Select a subject to load registered students.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {attendanceEntries.map((entry, index) => (
                  <article
                    key={entry.studentId}
                    className={`min-w-0 rounded-xl border-2 p-4 transition-all ${
                      index === focusIndex
                        ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg shadow-teal-200'
                        : 'border-slate-200 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{entry.studentName}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{entry.studentEmail}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                          index === focusIndex
                            ? 'border-teal-400 bg-teal-100 text-teal-700'
                            : 'border-slate-300 bg-slate-100 text-slate-600 hover:border-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    </div>

                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeTone(entry.status)}`}
                      >
                        {entry.status ? entry.status.toUpperCase() : '⏳ PENDING'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus(entry.studentId, 'present', index + 1)}
                        className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                          entry.status === 'present'
                            ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        ✓ Present
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(entry.studentId, 'absent', index + 1)}
                        className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                          entry.status === 'absent'
                            ? 'border-rose-400 bg-rose-100 text-rose-700'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        ✕ Absent
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(entry.studentId, 'late', index + 1)}
                        className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                          entry.status === 'late'
                            ? 'border-amber-400 bg-amber-100 text-amber-700'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        ⏱ Late
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={
            attendanceSaving ||
            !attendanceForm.subjectId ||
            attendanceEntries.length === 0 ||
            statusCount.pending > 0
          }
          onClick={onMarkAttendance}
          className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-teal-600 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 disabled:opacity-60"
        >
          {attendanceSaving ? '⏳ Saving Attendance...' : '💾 Save Attendance'}
        </button>

        {statusCount.pending > 0 ? (
          <p className="text-center text-sm font-medium text-rose-600">
            ⚠️ Mark all {statusCount.pending} student(s) before saving this lecture.
          </p>
        ) : null}
      </div>
    </section>
  )
}
