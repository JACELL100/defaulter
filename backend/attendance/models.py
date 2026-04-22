import uuid

from django.db import models


class TimeStampedModel(models.Model):
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class UserProfile(TimeStampedModel):
	class Role(models.TextChoices):
		ADMIN = "admin", "Admin"
		TEACHER = "teacher", "Teacher"
		STUDENT = "student", "Student"

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	auth_user_id = models.UUIDField(unique=True)
	email = models.EmailField(unique=True)
	full_name = models.CharField(max_length=120)
	role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
	enrollment_number = models.CharField(max_length=40, blank=True)
	department = models.CharField(max_length=80, blank=True)
	semester = models.PositiveSmallIntegerField(default=1)
	is_active = models.BooleanField(default=True)

	class Meta:
		ordering = ["full_name"]

	@property
	def is_authenticated(self):
		"""Compatibility property so DRF treats this profile as an authenticated user."""
		return True

	@property
	def is_anonymous(self):
		return False

	def __str__(self):
		return f"{self.full_name} ({self.role})"


class ClassRoom(TimeStampedModel):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=120)
	code = models.CharField(max_length=30, unique=True)
	year = models.PositiveSmallIntegerField(default=1)
	section = models.CharField(max_length=10, blank=True)
	advisor = models.ForeignKey(
		UserProfile,
		on_delete=models.SET_NULL,
		related_name="advised_classes",
		null=True,
		blank=True,
	)

	class Meta:
		ordering = ["name"]

	def __str__(self):
		return f"{self.name} ({self.code})"


class Subject(TimeStampedModel):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=120)
	code = models.CharField(max_length=30, unique=True)
	class_room = models.ForeignKey(
		ClassRoom,
		on_delete=models.CASCADE,
		related_name="subjects",
	)
	teacher = models.ForeignKey(
		UserProfile,
		on_delete=models.PROTECT,
		related_name="subjects",
	)
	credits = models.PositiveSmallIntegerField(default=4)

	class Meta:
		ordering = ["class_room__name", "name"]

	def __str__(self):
		return f"{self.name} ({self.code})"


class Enrollment(TimeStampedModel):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	student = models.ForeignKey(
		UserProfile,
		on_delete=models.CASCADE,
		related_name="class_enrollments",
	)
	class_room = models.ForeignKey(
		ClassRoom,
		on_delete=models.CASCADE,
		related_name="student_enrollments",
	)
	academic_year = models.CharField(max_length=20, default="2026-2027")
	is_active = models.BooleanField(default=True)

	class Meta:
		ordering = ["-created_at"]
		constraints = [
			models.UniqueConstraint(
				fields=["student", "class_room", "academic_year"],
				name="unique_student_class_year",
			)
		]

	def __str__(self):
		return f"{self.student.full_name} -> {self.class_room.name}"


class SubjectEnrollment(TimeStampedModel):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	student = models.ForeignKey(
		UserProfile,
		on_delete=models.CASCADE,
		related_name="subject_enrollments",
	)
	subject = models.ForeignKey(
		Subject,
		on_delete=models.CASCADE,
		related_name="subject_enrollments",
	)

	class Meta:
		ordering = ["subject__name", "student__full_name"]
		constraints = [
			models.UniqueConstraint(
				fields=["student", "subject"],
				name="unique_student_subject",
			)
		]

	def __str__(self):
		return f"{self.student.full_name} - {self.subject.name}"


class Lecture(TimeStampedModel):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	subject = models.ForeignKey(
		Subject,
		on_delete=models.CASCADE,
		related_name="lectures",
	)
	class_room = models.ForeignKey(
		ClassRoom,
		on_delete=models.CASCADE,
		related_name="lectures",
	)
	lecture_date = models.DateField()
	lecture_number = models.PositiveIntegerField(default=1)
	topic = models.CharField(max_length=255, blank=True)
	marked_by = models.ForeignKey(
		UserProfile,
		on_delete=models.PROTECT,
		related_name="marked_lectures",
	)

	class Meta:
		ordering = ["-lecture_date", "-lecture_number"]
		constraints = [
			models.UniqueConstraint(
				fields=["subject", "class_room", "lecture_date", "lecture_number"],
				name="unique_subject_class_lecture",
			)
		]

	def __str__(self):
		return f"{self.subject.code} {self.lecture_date} #{self.lecture_number}"


class AttendanceRecord(TimeStampedModel):
	class Status(models.TextChoices):
		PRESENT = "present", "Present"
		ABSENT = "absent", "Absent"
		LATE = "late", "Late"

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	lecture = models.ForeignKey(
		Lecture,
		on_delete=models.CASCADE,
		related_name="attendance_records",
	)
	student = models.ForeignKey(
		UserProfile,
		on_delete=models.CASCADE,
		related_name="attendance_records",
	)
	status = models.CharField(max_length=20, choices=Status.choices)
	remarks = models.CharField(max_length=255, blank=True)

	class Meta:
		ordering = ["lecture__lecture_date"]
		constraints = [
			models.UniqueConstraint(
				fields=["lecture", "student"],
				name="unique_lecture_student_attendance",
			)
		]

	def __str__(self):
		return f"{self.student.full_name} - {self.lecture} - {self.status}"
