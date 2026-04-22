import { useMemo } from 'react'

export default function TeacherAttendancePage({
  subjects,
  attendanceForm,
  setAttendanceForm,
  onSubjectSelect,
  attendanceEntries,
  setAttendanceEntries,
  onMarkAttendance,
  attendanceSaving,
}) {
  const activeSubject = useMemo(
    () => subjects.find((subject) => subject.id === attendanceForm.subjectId),
    [subjects, attendanceForm.subjectId],
  )

  const setStatus = (studentId, status) => {
    setAttendanceEntries((rows) =>
      rows.map((row) => (row.studentId === studentId ? { ...row, status } : row)),
    )
  }

  return (
    <section className="glass-panel gradient-stroke rounded-2xl p-5">
      <h3 className="text-xl">Attendance Studio</h3>
      <p className="mt-1 text-sm text-slate-600">
        Mark attendance classwise, lecturewise, and subjectwise.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          value={attendanceForm.subjectId}
          onChange={(event) => onSubjectSelect(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Choose Subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.code ? `${subject.code} - ` : ''}
              {subject.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={attendanceForm.lectureDate}
          onChange={(event) =>
            setAttendanceForm((current) => ({ ...current, lectureDate: event.target.value }))
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />

        <input
          type="number"
          min={1}
          value={attendanceForm.lectureNumber}
          onChange={(event) =>
            setAttendanceForm((current) => ({ ...current, lectureNumber: event.target.value }))
          }
          placeholder="Lecture Number"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />

        <input
          type="text"
          value={attendanceForm.topic}
          onChange={(event) =>
            setAttendanceForm((current) => ({ ...current, topic: event.target.value }))
          }
          placeholder="Lecture Topic"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
        Class: <span className="font-semibold text-slate-800">{activeSubject?.class_room_name || '--'}</span>
      </div>

      <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
        {attendanceEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
            Select a subject to load enrolled students.
          </div>
        ) : (
          attendanceEntries.map((entry) => (
            <div
              key={entry.studentId}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{entry.studentName}</p>
                <p className="text-xs text-slate-500">{entry.studentEmail}</p>
              </div>

              <select
                value={entry.status}
                onChange={(event) => setStatus(entry.studentId, event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        disabled={attendanceSaving || !attendanceForm.subjectId || attendanceEntries.length === 0}
        onClick={onMarkAttendance}
        className="mt-4 w-full rounded-xl bg-[linear-gradient(135deg,#ee5f3a,#1ea896)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
      >
        {attendanceSaving ? 'Saving Attendance...' : 'Save Attendance'}
      </button>
    </section>
  )
}
