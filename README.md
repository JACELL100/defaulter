# College Management Attendance System

Modern college attendance platform with role-based workflows for admin, teacher, and student.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Backend: Django + Django REST Framework
- Database: Supabase PostgreSQL
- Auth: Supabase Auth (Email/Password + Google OAuth)

## Key Features

- Role-aware dashboards for:
  - Admin
  - Teacher
  - Student
- Teacher attendance marking:
  - Classwise
  - Lecturewise
  - Subjectwise
- Defaulter detection:
  - Students with attendance below 75% in a subject
- Student eligibility visibility for final exam threshold
- Admin role management and oversight

## Project Structure

- `backend/` Django API + models + attendance logic
- `frontend/` React app + animated UI + auth + API integration

## Backend Setup

1. Open a terminal in `backend/`
2. Create env file:
   - Copy `.env.example` to `.env`
3. Install dependencies:
   - `python -m pip install -r requirements.txt`
4. Apply migrations:
   - `python manage.py migrate`
5. Seed demo classrooms, subjects, and lecture topics:
   - `python manage.py seed_demo_data`
6. Start server:
   - `python manage.py runserver`

API root: `http://127.0.0.1:8000/api`

## Frontend Setup

1. Open a terminal in `frontend/`
2. Create env file:
   - Copy `.env.example` to `.env.local`
3. Install dependencies:
   - `npm install`
4. Start app:
   - `npm run dev`

Frontend URL: `http://127.0.0.1:5173`

## Supabase + Google OAuth Notes

- Enable Email auth and Google provider in your Supabase project.
- Set Google OAuth redirect URL to your frontend origin.
- Keep secrets in env files only. Do not hardcode or commit them.

## Useful API Endpoints

- `GET /api/auth/me/`
- `GET /api/dashboard/stats/`
- `GET /api/subjects/`
- `POST /api/lectures/`
- `POST /api/lectures/<lecture_id>/mark-attendance/`
- `GET /api/attendance/summary/`
- `GET /api/attendance/defaulters/`
- `PATCH /api/profiles/<profile_id>/set-role/`

## Default Role Behavior

- First-time users are created as `student` by default.
- Admin can promote users to `teacher` or `admin` from the dashboard.
