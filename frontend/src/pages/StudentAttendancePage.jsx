export default function StudentAttendancePage({ summaryRows }) {
  return (
    <section className="glass-panel gradient-stroke rounded-2xl p-5">
      <h3 className="text-xl">My Attendance Across Subjects</h3>
      <p className="mt-1 text-sm text-slate-600">
        Live subjectwise attendance with exam eligibility status.
      </p>

      <div className="mt-4 space-y-3">
        {summaryRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
            No attendance records found yet.
          </div>
        ) : (
          summaryRows.map((row) => {
            const safeWidth = Math.max(0, Math.min(100, row.attendance_percentage))

            return (
              <div
                key={`${row.student_id}-${row.subject_id}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.subject_name}</p>
                    <p className="text-xs text-slate-500">
                      {row.subject_code} • {row.class_room_name}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      row.is_defaulter
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {row.is_defaulter ? 'Defaulter' : 'Eligible'}
                  </span>
                </div>

                <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                  <div
                    className={`h-2.5 rounded-full ${
                      row.is_defaulter ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${safeWidth}%` }}
                  />
                </div>

                <p className="mt-2 text-xs font-medium text-slate-600">
                  {row.attendance_percentage}% attendance ({row.present_count}/{row.total_lectures})
                </p>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
