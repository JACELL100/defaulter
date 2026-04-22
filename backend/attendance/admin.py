from django.contrib import admin

from .models import (
	AttendanceRecord,
	ClassRoom,
	Enrollment,
	Lecture,
	Subject,
	SubjectEnrollment,
	UserProfile,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("full_name", "email", "role", "department", "semester", "is_active")
	list_filter = ("role", "department", "is_active")
	search_fields = ("full_name", "email", "enrollment_number")


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
	list_display = ("name", "code", "year", "section", "advisor")
	search_fields = ("name", "code")


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
	list_display = ("name", "code", "class_room", "teacher", "credits")
	list_filter = ("class_room",)
	search_fields = ("name", "code")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
	list_display = ("student", "class_room", "academic_year", "is_active")
	list_filter = ("academic_year", "is_active", "class_room")


@admin.register(SubjectEnrollment)
class SubjectEnrollmentAdmin(admin.ModelAdmin):
	list_display = ("student", "subject")
	list_filter = ("subject",)


@admin.register(Lecture)
class LectureAdmin(admin.ModelAdmin):
	list_display = ("subject", "class_room", "lecture_date", "lecture_number", "marked_by")
	list_filter = ("class_room", "subject", "lecture_date")


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
	list_display = ("lecture", "student", "status")
	list_filter = ("status", "lecture__subject")

# Register your models here.
