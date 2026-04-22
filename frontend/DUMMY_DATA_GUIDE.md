# Dummy Data Implementation Guide

## Overview
This guide explains the dummy data system implemented in the frontend to support development and testing when the backend API is unavailable or for UI development purposes.

## Files Added

### `src/lib/dummyData.js`
Central file containing all dummy data constants used throughout the application.

**Exports:**
- `DUMMY_SUBJECTS` - List of 4 sample subjects with IDs, names, codes, and classroom names
- `DUMMY_STUDENTS` - List of 8 sample student profiles
- `DUMMY_LECTURES` - List of 5 sample lectures across different subjects and dates
- `DUMMY_TEACHER_STATS` - Dashboard statistics for teacher role
- `DUMMY_STUDENT_STATS` - Dashboard statistics for student role
- `DUMMY_ADMIN_STATS` - Dashboard statistics for admin role
- `DUMMY_ATTENDANCE_ENTRIES` - 8 sample attendance records with mixed statuses (present, absent, late, pending)
- `DUMMY_SUMMARY_ROWS` - Student's subject-wise attendance summary showing both eligible and defaulter statuses
- `DUMMY_DEFAULTERS` - List of 4 defaulter students across different subjects
- `DUMMY_PROFILES` - List of 8 user profiles with different roles (student, teacher, admin)

## Integration Points

### `src/App.jsx`
Modified to use dummy data as fallback when API calls fail:

#### 1. **loadSubjectRoster()**
- Loads attendance entries for a specific subject
- **Fallback:** Uses `DUMMY_ATTENDANCE_ENTRIES` if API fails
- Used when: Selecting a subject in Attendance Studio

#### 2. **loadDefaulters()**
- Loads students below 75% attendance threshold
- **Fallback:** Uses `DUMMY_DEFAULTERS` if API fails
- Used when: Viewing defaulters in teacher or admin views

#### 3. **hydrateData()**
- Main data loading function called after login
- **Fallbacks by role:**
  - **Teacher:** Loads dummy subjects, lectures, stats, attendance entries, and defaulters
  - **Student:** Loads dummy subjects, lectures, stats, and attendance summaries
  - **Admin:** Loads dummy subjects, lectures, stats, profiles, and defaulters

## Pages That Benefit from Dummy Data

1. **DashboardOverviewPage** - Shows metric cards and recent lectures
2. **TeacherAttendancePage** - Displays attendance form with student roster
3. **TeacherDefaultersPage** - Shows at-risk students per subject
4. **StudentAttendancePage** - Displays subject-wise attendance summary
5. **AdminUsersPage** - Lists all users with role management
6. **AdminDefaultersPage** - Shows institution-wide defaulter list

## How It Works

### When API is Available
- Normal API calls are made
- Real data is displayed

### When API is Unavailable/Fails
- Dummy data automatically populates the UI
- All functionality remains interactive
- Users can see and test the UI with realistic sample data

## Sample Data Characteristics

### Subjects
- IDs: 1-4
- Include code, name, and classroom assignment
- Example: "CS101 - Data Structures" in "Lab-A"

### Students
- IDs: 1-8
- Realistic names and email addresses
- Names: Joycee Jamble, Alice Johnson, Bob Smith, Charlie Brown, Diana Prince, Eve Davis, Frank Miller, Grace Lee

### Attendance
- Statuses: "present", "absent", "late", "" (pending)
- Mix of different attendance patterns
- Some students marked pending (empty status)

### Defaulters
- Selected students with attendance < 75%
- Shows attendance percentage, lecture counts
- Ready for exam eligibility warnings

### Statistics
- Teacher: 45 lectures, 32 students, 82% attendance rate, 3 defaulters
- Student: 42 lectures registered, 35 attended, 83% rate, not defaulter
- Admin: 156 students, 12 teachers, 18 subjects, 24 defaulters

## Testing with Dummy Data

### Scenario 1: Test UI without Backend
1. Start the frontend without the Django backend running
2. Login will fail but dummy data loads on redirect
3. All pages display realistic sample data

### Scenario 2: Test Component Interactions
- Fill attendance form with mock data
- Navigate through students in roster
- Change statuses and see UI updates
- Filter defaulters by subject

### Scenario 3: Test Error Handling
- Backend API endpoints return errors
- Dummy data seamlessly fills the UI
- User experience remains smooth

## Future Enhancements

Consider adding:
- Flag/constant to control dummy data mode (always/fallback/never)
- Endpoint to reset frontend state and reload dummy data
- Browser localStorage to persist dummy data selections
- Console logs to indicate when dummy data is being used

## Notes

- Dummy data uses realistic IDs, names, and values
- All dummy data is stateless and refreshes on app reload
- Data relationships are consistent (e.g., students in lecture lists match attendance entries)
- No actual persistence of attendance marks when using dummy data
