import uuid

from django.test import TestCase
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.test import APIRequestFactory, force_authenticate

from .models import AttendanceRecord, ClassRoom, Enrollment, Lecture, Subject, SubjectEnrollment, UserProfile
from .views import MarkLectureAttendanceView, RegisteredStudentListView


class UserProfileAuthCompatibilityTests(TestCase):
	def test_userprofile_matches_drf_authenticated_contract(self):
		profile = UserProfile.objects.create(
			auth_user_id=uuid.uuid4(),
			email="student@example.com",
			full_name="Test Student",
			role=UserProfile.Role.STUDENT,
		)

		request = APIRequestFactory().get("/api/auth/me/")
		request.user = profile

		self.assertTrue(profile.is_authenticated)
		self.assertFalse(profile.is_anonymous)
		self.assertTrue(IsAuthenticated().has_permission(request, view=None))


class RegisteredStudentListViewTests(TestCase):
	def setUp(self):
		self.factory = APIRequestFactory()
		self.teacher = UserProfile.objects.create(
			auth_user_id=uuid.uuid4(),
			email="teacher@example.com",
			full_name="Teacher One",
			role=UserProfile.Role.TEACHER,
		)
		self.class_room = ClassRoom.objects.create(name="CSE 2A", code="CSE2A")
		self.subject = Subject.objects.create(
			name="Data Structures",
			code="CS201",
			class_room=self.class_room,
			teacher=self.teacher,
		)

	def test_returns_only_active_students(self):
		active_student = UserProfile.objects.create(
			auth_user_id=uuid.uuid4(),
			email="active.student@example.com",
			full_name="Active Student",
			role=UserProfile.Role.STUDENT,
			is_active=True,
		)
		UserProfile.objects.create(
			auth_user_id=uuid.uuid4(),
			email="inactive.student@example.com",
			full_name="Inactive Student",
			role=UserProfile.Role.STUDENT,
			is_active=False,
		)

		request = self.factory.get(
			"/api/students/registered/",
			{"subject_id": str(self.subject.id)},
		)
		force_authenticate(request, user=self.teacher)

		response = RegisteredStudentListView.as_view()(request)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["id"], str(active_student.id))


class MarkLectureAttendanceAutoEnrollmentTests(TestCase):
	def setUp(self):
		self.factory = APIRequestFactory()
		self.teacher = UserProfile.objects.create(
			auth_user_id=uuid.uuid4(),
			email="attendance.teacher@example.com",
			full_name="Attendance Teacher",
			role=UserProfile.Role.TEACHER,
		)
		self.student = UserProfile.objects.create(
			auth_user_id=uuid.uuid4(),
			email="attendance.student@example.com",
			full_name="Attendance Student",
			role=UserProfile.Role.STUDENT,
		)
		self.class_room = ClassRoom.objects.create(name="CSE 3A", code="CSE3A")
		self.subject = Subject.objects.create(
			name="Operating Systems",
			code="CS301",
			class_room=self.class_room,
			teacher=self.teacher,
		)
		self.lecture = Lecture.objects.create(
			subject=self.subject,
			class_room=self.class_room,
			lecture_date="2026-04-22",
			lecture_number=1,
			topic="Process scheduling",
			marked_by=self.teacher,
		)

	def test_mark_attendance_auto_creates_required_enrollments(self):
		request = self.factory.post(
			f"/api/lectures/{self.lecture.id}/mark-attendance/",
			{
				"entries": [
					{
						"student_id": str(self.student.id),
						"status": AttendanceRecord.Status.PRESENT,
						"remarks": "",
					}
				]
			},
			format="json",
		)
		force_authenticate(request, user=self.teacher)

		response = MarkLectureAttendanceView.as_view()(request, lecture_id=self.lecture.id)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(
			SubjectEnrollment.objects.filter(student=self.student, subject=self.subject).exists()
		)
		self.assertTrue(
			Enrollment.objects.filter(student=self.student, class_room=self.class_room).exists()
		)
		self.assertTrue(
			AttendanceRecord.objects.filter(
				lecture=self.lecture,
				student=self.student,
				status=AttendanceRecord.Status.PRESENT,
			).exists()
		)
