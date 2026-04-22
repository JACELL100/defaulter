# Frontend - College Attendance System

## Environment

1. Copy `.env.example` to `.env` or `.env.local`.
2. Fill these values:

- `VITE_API_BASE_URL` (Django API root)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Commands

- `npm install`
- `npm run dev`
- `npm run build`

## Notes

- Email/password signup-login and Google OAuth are handled by Supabase Auth.
- The backend decides role-based access for admin, teacher, and student screens.

## Frontend Pages

- `/auth` : login/signup + Google auth
- `/dashboard` : common overview page
- `/teacher/attendance` : lecturewise attendance marking page
- `/teacher/defaulters` : subjectwise defaulters page
- `/student/attendance` : student subjectwise attendance page
- `/admin/users` : admin role management page
- `/admin/defaulters` : admin institution-wide defaulters page
