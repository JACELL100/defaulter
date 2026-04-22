export default function TeacherDefaultersPage({
  subjects,
  selectedSubjectId,
  onSubjectChange,
  defaulters,
  onLoadDefaulters,
}) {
  return (
    <section className="glass-panel gradient-stroke rounded-2xl p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl">Defaulters Radar</h3>
          <p className="mt-1 text-sm text-slate-600">
            Students below 75% attendance are ineligible for final exams in that subject.
          </p>
        </div>

        <div className="flex w-full gap-2 md:w-auto">
          <select
            value={selectedSubjectId}
            onChange={(event) => onSubjectChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm md:min-w-[250px]"
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
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1">
        {defaulters.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-10 text-center text-sm text-emerald-700">
            No defaulters in this view.
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
    </section>
  )
}
