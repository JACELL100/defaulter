from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
	AttendanceRecord,
	ClassRoom,
	Enrollment,
	Lecture,
	Subject,
	SubjectEnrollment,
	UserProfile,
)
from .permissions import IsAdminRole, IsTeacherOrAdmin
from .serializers import (
	AttendanceBulkMarkSerializer,
	AttendanceRecordSerializer,
	ClassRoomSerializer,
	EnrollmentSerializer,
	LectureSerializer,
	RegisteredStudentSerializer,
	RoleUpdateSerializer,
	SubjectEnrollmentSerializer,
	SubjectSerializer,
	UserProfileSerializer,
)


def visible_subjects_for_user(user):
	queryset = Subject.objects.select_related("class_room", "teacher")

	if user.role == UserProfile.Role.TEACHER:
		queryset = queryset.filter(teacher=user)
	elif user.role == UserProfile.Role.STUDENT:
		queryset = queryset.filter(subject_enrollments__student=user)

	return queryset.distinct()


def build_attendance_summary(user, subject_id=None, class_room_id=None, student_id=None, threshold=75.0):
	subjects = visible_subjects_for_user(user)

	if subject_id:
		subjects = subjects.filter(id=subject_id)
	if class_room_id:
		subjects = subjects.filter(class_room_id=class_room_id)

	subject_map = {subject.id: subject for subject in subjects}
	if not subject_map:
		return []

	lecture_totals = {
		row["subject_id"]: row["total_lectures"]
		for row in Lecture.objects.filter(subject_id__in=subject_map.keys())
		.values("subject_id")
		.annotate(total_lectures=Count("id"))
	}

	present_rows = AttendanceRecord.objects.filter(
		lecture__subject_id__in=subject_map.keys(),
		status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE],
	)
	if student_id:
		present_rows = present_rows.filter(student_id=student_id)
	if user.role == UserProfile.Role.STUDENT:
		present_rows = present_rows.filter(student=user)

	present_map = {
		(row["student_id"], row["lecture__subject_id"]): row["attended_count"]
		for row in present_rows.values("student_id", "lecture__subject_id").annotate(
			attended_count=Count("id")
		)
	}

	subject_enrollments = SubjectEnrollment.objects.select_related(
		"student", "subject", "subject__class_room"
	).filter(subject_id__in=subject_map.keys(), student__is_active=True)

	if student_id:
		subject_enrollments = subject_enrollments.filter(student_id=student_id)
	if user.role == UserProfile.Role.STUDENT:
		subject_enrollments = subject_enrollments.filter(student=user)

	summary_rows = []
	for enrollment in subject_enrollments:
		subject_total = lecture_totals.get(enrollment.subject_id, 0)
		present_count = present_map.get((enrollment.student_id, enrollment.subject_id), 0)

		attendance_percentage = 0.0
		if subject_total > 0:
			attendance_percentage = round((present_count / subject_total) * 100, 2)

		summary_rows.append(
			{
				"student_id": str(enrollment.student_id),
				"student_name": enrollment.student.full_name,
				"student_email": enrollment.student.email,
				"subject_id": str(enrollment.subject_id),
				"subject_name": enrollment.subject.name,
				"subject_code": enrollment.subject.code,
				"class_room_id": str(enrollment.subject.class_room_id),
				"class_room_name": enrollment.subject.class_room.name,
				"present_count": present_count,
				"total_lectures": subject_total,
				"attendance_percentage": attendance_percentage,
				"is_defaulter": attendance_percentage < threshold,
				"eligible_for_exam": attendance_percentage >= threshold,
			}
		)

	return summary_rows


class ProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		return Response(UserProfileSerializer(request.user).data)


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = UserProfile.objects.all()
	serializer_class = UserProfileSerializer
	permission_classes = [IsAuthenticated, IsAdminRole]

	def get_queryset(self):
		queryset = super().get_queryset()
		role = self.request.query_params.get("role")
		if role:
			queryset = queryset.filter(role=role)
		return queryset

	@action(detail=True, methods=["patch"], url_path="set-role")
	def set_role(self, request, pk=None):
		serializer = RoleUpdateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		profile = self.get_object()
		profile.role = serializer.validated_data["role"]
		profile.save(update_fields=["role", "updated_at"])

		return Response(UserProfileSerializer(profile).data)


class RegisteredStudentListView(APIView):
	permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

	def get(self, request):
		current_user = request.user
		subject_id = request.query_params.get("subject_id")

		if current_user.role == UserProfile.Role.TEACHER and subject_id:
			if not Subject.objects.filter(id=subject_id, teacher=current_user).exists():
				raise PermissionDenied(
					"Teachers can load registered students only for their own subjects."
				)

		students = UserProfile.objects.filter(
			role=UserProfile.Role.STUDENT,
			is_active=True,
		).order_by("full_name")

		return Response(RegisteredStudentSerializer(students, many=True).data)


class ClassRoomViewSet(viewsets.ModelViewSet):
	queryset = ClassRoom.objects.select_related("advisor").all()
	serializer_class = ClassRoomSerializer

	def get_permissions(self):
		if self.request.method in ["GET", "HEAD", "OPTIONS"]:
			return [IsAuthenticated()]
		return [IsAuthenticated(), IsAdminRole()]


class SubjectViewSet(viewsets.ModelViewSet):
	serializer_class = SubjectSerializer

	def get_queryset(self):
		queryset = visible_subjects_for_user(self.request.user)
		class_room_id = self.request.query_params.get("class_room_id")
		teacher_id = self.request.query_params.get("teacher_id")

		if class_room_id:
			queryset = queryset.filter(class_room_id=class_room_id)
		if teacher_id:
			queryset = queryset.filter(teacher_id=teacher_id)

		return queryset

	def get_permissions(self):
		if self.request.method in ["GET", "HEAD", "OPTIONS"]:
			return [IsAuthenticated()]
		return [IsAuthenticated(), IsTeacherOrAdmin()]

	def perform_create(self, serializer):
		teacher = serializer.validated_data.get("teacher")
		current_user = self.request.user

		if current_user.role == UserProfile.Role.TEACHER:
			serializer.save(teacher=current_user)
			return

		if teacher and teacher.role != UserProfile.Role.TEACHER:
			raise ValidationError({"teacher": "Selected user is not a teacher."})
		serializer.save()

	def perform_update(self, serializer):
		current_user = self.request.user
		subject = self.get_object()

		if current_user.role == UserProfile.Role.TEACHER and subject.teacher_id != current_user.id:
			raise PermissionDenied("Teachers can edit only their own subjects.")

		if current_user.role == UserProfile.Role.TEACHER:
			serializer.save(teacher=current_user)
			return

		teacher = serializer.validated_data.get("teacher")
		if teacher and teacher.role != UserProfile.Role.TEACHER:
			raise ValidationError({"teacher": "Selected user is not a teacher."})
		serializer.save()

	def perform_destroy(self, instance):
		current_user = self.request.user
		if current_user.role == UserProfile.Role.TEACHER and instance.teacher_id != current_user.id:
			raise PermissionDenied("Teachers can delete only their own subjects.")
		instance.delete()


class EnrollmentViewSet(viewsets.ModelViewSet):
	serializer_class = EnrollmentSerializer

	def get_queryset(self):
		queryset = Enrollment.objects.select_related("student", "class_room")
		current_user = self.request.user

		if current_user.role == UserProfile.Role.ADMIN:
			queryset = queryset
		elif current_user.role == UserProfile.Role.TEACHER:
			queryset = queryset.filter(class_room__subjects__teacher=current_user).distinct()
		else:
			queryset = queryset.filter(student=current_user)

		class_room_id = self.request.query_params.get("class_room_id")
		student_id = self.request.query_params.get("student_id")

		if class_room_id:
			queryset = queryset.filter(class_room_id=class_room_id)
		if student_id:
			queryset = queryset.filter(student_id=student_id)

		return queryset

	def get_permissions(self):
		if self.request.method in ["GET", "HEAD", "OPTIONS"]:
			return [IsAuthenticated()]
		return [IsAuthenticated(), IsAdminRole()]


class SubjectEnrollmentViewSet(viewsets.ModelViewSet):
	serializer_class = SubjectEnrollmentSerializer

	def get_queryset(self):
		queryset = SubjectEnrollment.objects.select_related("student", "subject")
		current_user = self.request.user

		if current_user.role == UserProfile.Role.ADMIN:
			queryset = queryset
		elif current_user.role == UserProfile.Role.TEACHER:
			queryset = queryset.filter(subject__teacher=current_user)
		else:
			queryset = queryset.filter(student=current_user)

		subject_id = self.request.query_params.get("subject_id")
		student_id = self.request.query_params.get("student_id")

		if subject_id:
			queryset = queryset.filter(subject_id=subject_id)
		if student_id:
			queryset = queryset.filter(student_id=student_id)

		return queryset

	def get_permissions(self):
		if self.request.method in ["GET", "HEAD", "OPTIONS"]:
			return [IsAuthenticated()]
		return [IsAuthenticated(), IsTeacherOrAdmin()]

	def perform_create(self, serializer):
		current_user = self.request.user
		subject = serializer.validated_data["subject"]

		if current_user.role == UserProfile.Role.TEACHER and subject.teacher_id != current_user.id:
			raise PermissionDenied("Teachers can enroll students only to their own subjects.")

		serializer.save()


class LectureViewSet(viewsets.ModelViewSet):
	serializer_class = LectureSerializer

	def get_queryset(self):
		queryset = Lecture.objects.select_related("subject", "class_room", "marked_by")
		current_user = self.request.user

		if current_user.role == UserProfile.Role.TEACHER:
			queryset = queryset.filter(subject__teacher=current_user)
		elif current_user.role == UserProfile.Role.STUDENT:
			queryset = queryset.filter(subject__subject_enrollments__student=current_user)

		subject_id = self.request.query_params.get("subject_id")
		class_room_id = self.request.query_params.get("class_room_id")
		lecture_date = self.request.query_params.get("lecture_date")

		if subject_id:
			queryset = queryset.filter(subject_id=subject_id)
		if class_room_id:
			queryset = queryset.filter(class_room_id=class_room_id)
		if lecture_date:
			queryset = queryset.filter(lecture_date=lecture_date)

		return queryset.distinct()

	def get_permissions(self):
		if self.request.method in ["GET", "HEAD", "OPTIONS"]:
			return [IsAuthenticated()]
		return [IsAuthenticated(), IsTeacherOrAdmin()]

	def perform_create(self, serializer):
		current_user = self.request.user
		subject = serializer.validated_data["subject"]
		class_room = serializer.validated_data.get("class_room")

		if class_room and class_room.id != subject.class_room_id:
			raise ValidationError({"class_room": "Class room must match the selected subject."})

		if current_user.role == UserProfile.Role.TEACHER and subject.teacher_id != current_user.id:
			raise PermissionDenied("Teachers can create lectures only for their own subjects.")

		serializer.save(marked_by=current_user, class_room=subject.class_room)

	def perform_update(self, serializer):
		current_user = self.request.user
		lecture = self.get_object()

		if current_user.role == UserProfile.Role.TEACHER and lecture.subject.teacher_id != current_user.id:
			raise PermissionDenied("Teachers can edit only their own lectures.")

		subject = serializer.validated_data.get("subject", lecture.subject)
		class_room = serializer.validated_data.get("class_room", lecture.class_room)

		if class_room.id != subject.class_room_id:
			raise ValidationError({"class_room": "Class room must match the selected subject."})

		if current_user.role == UserProfile.Role.TEACHER and subject.teacher_id != current_user.id:
			raise PermissionDenied("Teachers can move lectures only within their own subjects.")

		serializer.save(class_room=subject.class_room)


class AttendanceRecordViewSet(viewsets.ReadOnlyModelViewSet):
	serializer_class = AttendanceRecordSerializer

	def get_queryset(self):
		queryset = AttendanceRecord.objects.select_related(
			"student", "lecture", "lecture__subject", "lecture__class_room"
		)
		current_user = self.request.user

		if current_user.role == UserProfile.Role.TEACHER:
			queryset = queryset.filter(lecture__subject__teacher=current_user)
		elif current_user.role == UserProfile.Role.STUDENT:
			queryset = queryset.filter(student=current_user)

		lecture_id = self.request.query_params.get("lecture_id")
		subject_id = self.request.query_params.get("subject_id")
		student_id = self.request.query_params.get("student_id")

		if lecture_id:
			queryset = queryset.filter(lecture_id=lecture_id)
		if subject_id:
			queryset = queryset.filter(lecture__subject_id=subject_id)
		if student_id:
			queryset = queryset.filter(student_id=student_id)

		class_room_id = self.request.query_params.get("class_room_id")
		if class_room_id:
			queryset = queryset.filter(lecture__class_room_id=class_room_id)

		return queryset


class MarkLectureAttendanceView(APIView):
	permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

	def post(self, request, lecture_id):
		payload = AttendanceBulkMarkSerializer(data=request.data)
		payload.is_valid(raise_exception=True)

		lecture = Lecture.objects.select_related("subject", "subject__teacher").filter(id=lecture_id).first()
		if not lecture:
			raise ValidationError({"lecture_id": "Lecture not found."})

		current_user = request.user
		if (
			current_user.role == UserProfile.Role.TEACHER
			and lecture.subject.teacher_id != current_user.id
		):
			raise PermissionDenied("Teachers can mark attendance only for their own lectures.")

		updated = 0
		for entry in payload.validated_data["entries"]:
			student = UserProfile.objects.filter(
				id=entry["student_id"],
				role=UserProfile.Role.STUDENT,
				is_active=True,
			).first()
			if not student:
				raise ValidationError({"student_id": f"Invalid student id: {entry['student_id']}"})

			# Direct attendance marking should work for any registered student.
			SubjectEnrollment.objects.get_or_create(student=student, subject=lecture.subject)
			academic_year = f"{lecture.lecture_date.year}-{lecture.lecture_date.year + 1}"
			Enrollment.objects.update_or_create(
				student=student,
				class_room=lecture.class_room,
				academic_year=academic_year,
				defaults={"is_active": True},
			)

			AttendanceRecord.objects.update_or_create(
				lecture=lecture,
				student=student,
				defaults={
					"status": entry["status"],
					"remarks": entry.get("remarks", ""),
				},
			)
			updated += 1

		return Response(
			{
				"message": "Attendance saved successfully.",
				"lecture_id": str(lecture.id),
				"updated_records": updated,
			},
			status=status.HTTP_200_OK,
		)


class AttendanceSummaryView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		subject_id = request.query_params.get("subject_id")
		class_room_id = request.query_params.get("class_room_id")
		student_id = request.query_params.get("student_id")
		threshold = float(request.query_params.get("threshold", "75"))

		if request.user.role == UserProfile.Role.STUDENT:
			student_id = str(request.user.id)

		summary = build_attendance_summary(
			user=request.user,
			subject_id=subject_id,
			class_room_id=class_room_id,
			student_id=student_id,
			threshold=threshold,
		)

		return Response({"count": len(summary), "results": summary})


class DefaulterListView(APIView):
	permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

	def get(self, request):
		subject_id = request.query_params.get("subject_id")
		class_room_id = request.query_params.get("class_room_id")
		threshold = float(request.query_params.get("threshold", "75"))

		summary = build_attendance_summary(
			user=request.user,
			subject_id=subject_id,
			class_room_id=class_room_id,
			threshold=threshold,
		)

		defaulters = [row for row in summary if row["attendance_percentage"] < threshold]
		return Response(
			{
				"threshold": threshold,
				"count": len(defaulters),
				"results": defaulters,
			}
		)


class DashboardStatsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		current_user = request.user
		threshold = 75.0

		if current_user.role == UserProfile.Role.ADMIN:
			summary = build_attendance_summary(current_user, threshold=threshold)
			return Response(
				{
					"role": "admin",
					"total_users": UserProfile.objects.count(),
					"total_teachers": UserProfile.objects.filter(
						role=UserProfile.Role.TEACHER
					).count(),
					"total_students": UserProfile.objects.filter(
						role=UserProfile.Role.STUDENT
					).count(),
					"total_classes": ClassRoom.objects.count(),
					"total_subjects": Subject.objects.count(),
					"total_lectures": Lecture.objects.count(),
					"defaulters": len([row for row in summary if row["is_defaulter"]]),
				}
			)

		if current_user.role == UserProfile.Role.TEACHER:
			my_subjects = Subject.objects.filter(teacher=current_user)
			summary = build_attendance_summary(current_user, threshold=threshold)
			return Response(
				{
					"role": "teacher",
					"my_subjects": my_subjects.count(),
					"my_lectures": Lecture.objects.filter(subject__teacher=current_user).count(),
					"students_at_risk": len([row for row in summary if row["is_defaulter"]]),
					"active_classes": my_subjects.values("class_room_id").distinct().count(),
				}
			)

		summary = build_attendance_summary(
			current_user,
			student_id=str(current_user.id),
			threshold=threshold,
		)

		overall_total = sum(row["total_lectures"] for row in summary)
		overall_present = sum(row["present_count"] for row in summary)
		overall_percentage = 0.0
		if overall_total > 0:
			overall_percentage = round((overall_present / overall_total) * 100, 2)

		return Response(
			{
				"role": "student",
				"enrolled_subjects": len(summary),
				"overall_attendance": overall_percentage,
				"defaulter_subjects": len([row for row in summary if row["is_defaulter"]]),
				"eligible_for_exam": overall_percentage >= threshold,
			}
		)
