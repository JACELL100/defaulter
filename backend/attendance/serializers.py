from rest_framework import serializers

from .models import (
    AttendanceRecord,
    ClassRoom,
    Enrollment,
    Lecture,
    Subject,
    SubjectEnrollment,
    UserProfile,
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "auth_user_id",
            "email",
            "full_name",
            "role",
            "enrollment_number",
            "department",
            "semester",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "auth_user_id", "created_at", "updated_at"]


class ClassRoomSerializer(serializers.ModelSerializer):
    advisor_name = serializers.CharField(source="advisor.full_name", read_only=True)

    class Meta:
        model = ClassRoom
        fields = [
            "id",
            "name",
            "code",
            "year",
            "section",
            "advisor",
            "advisor_name",
            "created_at",
            "updated_at",
        ]


class SubjectSerializer(serializers.ModelSerializer):
    class_room_name = serializers.CharField(source="class_room.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "code",
            "class_room",
            "class_room_name",
            "teacher",
            "teacher_name",
            "credits",
            "created_at",
            "updated_at",
        ]


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    class_room_name = serializers.CharField(source="class_room.name", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "student_name",
            "class_room",
            "class_room_name",
            "academic_year",
            "is_active",
            "created_at",
            "updated_at",
        ]


class SubjectEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)

    class Meta:
        model = SubjectEnrollment
        fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "subject",
            "subject_name",
            "subject_code",
            "created_at",
            "updated_at",
        ]


class LectureSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)
    class_room_name = serializers.CharField(source="class_room.name", read_only=True)
    marked_by_name = serializers.CharField(source="marked_by.full_name", read_only=True)

    class Meta:
        model = Lecture
        fields = [
            "id",
            "subject",
            "subject_name",
            "subject_code",
            "class_room",
            "class_room_name",
            "lecture_date",
            "lecture_number",
            "topic",
            "marked_by",
            "marked_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["marked_by", "created_at", "updated_at"]


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    lecture_date = serializers.DateField(source="lecture.lecture_date", read_only=True)
    subject_name = serializers.CharField(source="lecture.subject.name", read_only=True)
    subject_code = serializers.CharField(source="lecture.subject.code", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "lecture",
            "lecture_date",
            "subject_name",
            "subject_code",
            "student",
            "student_name",
            "status",
            "remarks",
            "created_at",
            "updated_at",
        ]


class AttendanceMarkEntrySerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceRecord.Status.choices)
    remarks = serializers.CharField(required=False, allow_blank=True, max_length=255)


class AttendanceBulkMarkSerializer(serializers.Serializer):
    entries = AttendanceMarkEntrySerializer(many=True)


class RoleUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserProfile.Role.choices)