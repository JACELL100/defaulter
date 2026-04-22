export default function RecentLectures({ lectures }) {
  return (
    <section className="glass-panel gradient-stroke rounded-2xl p-5">
      <h3 className="text-xl">Recent Lectures</h3>
      <p className="mt-1 text-sm text-slate-600">Fresh classroom activity log.</p>

      <div className="mt-4 space-y-2">
        {lectures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-6 text-center text-sm text-slate-500">
            No lectures yet.
          </div>
        ) : (
          lectures.slice(0, 10).map((lecture) => (
            <div
              key={lecture.id}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-800">{lecture.subject_name}</p>
                <p className="text-xs text-slate-500">{lecture.class_room_name}</p>
              </div>
              <div className="text-xs text-slate-600">
                {lecture.lecture_date} • Lecture {lecture.lecture_number}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
