export default function AdminDefaultersPage({ defaulters }) {
  return (
    <section className="glass-panel gradient-stroke rounded-2xl p-6 md:p-8">
      <div className="mx-auto max-w-full">
        <h3 className="text-xl font-bold text-slate-900">Global Defaulters</h3>
        <p className="mt-2 text-sm text-slate-600">
          Institution-wide list of students below 75% attendance in a subject.
        </p>

        <div className="mt-6 max-h-[520px] space-y-2 overflow-auto pr-1">
        {defaulters.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-10 text-center text-sm text-emerald-700">
            Great news, no defaulters at the moment.
          </div>
        ) : (
          defaulters.map((row) => (
            <div
              key={`${row.student_id}-${row.subject_id}`}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3"
            >
              <p className="text-sm font-semibold text-rose-800">{row.student_name}</p>
              <p className="text-xs text-rose-700">
                {row.subject_name} • {row.class_room_name}
              </p>
              <p className="mt-1 text-xs font-medium text-rose-800">
                Attendance: {row.attendance_percentage}% ({row.present_count}/{row.total_lectures})
              </p>
            </div>
          ))
        )}
      </div>
      </div>
    </section>
  )
}
