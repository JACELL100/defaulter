import { roleBadge } from '../lib/ui'

export default function AdminUsersPage({ profiles, onRoleUpdate }) {
  return (
    <section className="glass-panel gradient-stroke rounded-2xl p-6 md:p-8">
      <div className="mx-auto max-w-full">
        <h3 className="text-xl font-bold text-slate-900">Role Control Panel</h3>
        <p className="mt-2 text-sm text-slate-600">
          Promote users to teacher/admin or move them back to student.
        </p>

        <div className="mt-6 max-h-[560px] overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Current Role</th>
              <th className="px-3 py-2">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{user.full_name}</td>
                <td className="px-3 py-2 text-slate-600">{user.email}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full border px-2 py-1 text-xs ${roleBadge(user.role).color}`}>
                    {roleBadge(user.role).label}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={user.role}
                    onChange={(event) => onRoleUpdate(user.id, event.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </section>
  )
}
