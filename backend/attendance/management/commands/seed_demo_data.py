from datetime import timedelta
import uuid

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from attendance.models import (
    ClassRoom,
    Enrollment,
    Lecture,
    Subject,
    SubjectEnrollment,
    UserProfile,
)


CLASSROOM_BLUEPRINT = [
    {
        "name": "B.Tech CSE Year 2 - A",
        "code": "CSE2A",
        "year": 2,
        "section": "A",
    },
    {
        "name": "B.Tech CSE Year 3 - A",
        "code": "CSE3A",
        "year": 3,
        "section": "A",
    },
]

SUBJECT_BLUEPRINT = [
    {
        "name": "Data Structures",
        "code": "CS201",
        "class_code": "CSE2A",
        "credits": 4,
    },
    {
        "name": "Database Management Systems",
        "code": "CS202",
        "class_code": "CSE2A",
        "credits": 4,
    },
    {
        "name": "Discrete Mathematics",
        "code": "MA201",
        "class_code": "CSE2A",
        "credits": 3,
    },
    {
        "name": "Operating Systems",
        "code": "CS301",
        "class_code": "CSE3A",
        "credits": 4,
    },
    {
        "name": "Computer Networks",
        "code": "CS302",
        "class_code": "CSE3A",
        "credits": 4,
    },
    {
        "name": "Software Engineering",
        "code": "CS303",
        "class_code": "CSE3A",
        "credits": 3,
    },
]

TOPICS_BY_SUBJECT_CODE = {
    "CS201": [
        "Arrays and linked list review",
        "Stacks and queue applications",
        "Binary trees and traversals",
        "Hash tables and collision handling",
        "Graph representations and BFS",
    ],
    "CS202": [
        "ER modeling and normalization",
        "SQL joins and aggregate functions",
        "Transactions and ACID properties",
        "Indexing and query optimization",
        "Stored procedures and triggers",
    ],
    "MA201": [
        "Propositional logic and truth tables",
        "Sets, relations, and functions",
        "Recurrence relations",
        "Graph theory basics",
        "Combinatorics and counting",
    ],
    "CS301": [
        "Process scheduling algorithms",
        "Threads and synchronization",
        "Deadlocks and prevention",
        "Memory management and paging",
        "File systems and disk allocation",
    ],
    "CS302": [
        "OSI and TCP/IP model recap",
        "Switching and routing concepts",
        "IP addressing and subnetting",
        "Transport layer reliability",
        "Application layer protocols",
    ],
    "CS303": [
        "Software process models",
        "Requirements engineering",
        "Design principles and UML",
        "Testing strategies",
        "Maintenance and versioning",
    ],
}

DEMO_TEACHERS = [
    {
        "full_name": "Prof. Aditi Sharma",
        "email": "aditi.sharma.demo@campuspulse.local",
        "department": "CSE",
        "semester": 6,
    },
    {
        "full_name": "Prof. Rohan Verma",
        "email": "rohan.verma.demo@campuspulse.local",
        "department": "CSE",
        "semester": 6,
    },
]

DEMO_STUDENTS = [
    ("Aarav Mehta", "aarav.mehta.demo@campuspulse.local", "CSE24001"),
    ("Isha Nair", "isha.nair.demo@campuspulse.local", "CSE24002"),
    ("Kunal Singh", "kunal.singh.demo@campuspulse.local", "CSE24003"),
    ("Neha Kapoor", "neha.kapoor.demo@campuspulse.local", "CSE24004"),
    ("Ritika Das", "ritika.das.demo@campuspulse.local", "CSE24005"),
    ("Samar Khan", "samar.khan.demo@campuspulse.local", "CSE24006"),
    ("Tanvi Rao", "tanvi.rao.demo@campuspulse.local", "CSE24007"),
    ("Vikram Patel", "vikram.patel.demo@campuspulse.local", "CSE24008"),
    ("Yash Malhotra", "yash.malhotra.demo@campuspulse.local", "CSE24009"),
    ("Zoya Ali", "zoya.ali.demo@campuspulse.local", "CSE24010"),
]


class Command(BaseCommand):
    help = "Seed demo classrooms, subjects, lecture topics, and student enrollments."

    def add_arguments(self, parser):
        parser.add_argument(
            "--lectures-per-subject",
            type=int,
            default=4,
            help="How many recent lectures to create per subject.",
        )
        parser.add_argument(
            "--academic-year",
            type=str,
            default="2026-2027",
            help="Academic year label for class enrollment records.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        lectures_per_subject = max(1, int(options["lectures_per_subject"]))
        academic_year = options["academic_year"]

        teachers, created_teachers = self._ensure_teachers()
        students, created_students = self._ensure_students()

        classrooms, created_classrooms = self._ensure_classrooms(teachers)
        subjects, created_subjects = self._ensure_subjects(classrooms, teachers)

        enrollment_count, subject_enrollment_count = self._ensure_enrollments(
            students=students,
            classrooms=classrooms,
            subjects=subjects,
            academic_year=academic_year,
        )

        created_lectures = self._ensure_lectures(subjects, lectures_per_subject)

        self.stdout.write(self.style.SUCCESS("Demo attendance data is ready."))
        self.stdout.write(f"Teachers created: {created_teachers}")
        self.stdout.write(f"Students created: {created_students}")
        self.stdout.write(f"Classrooms created: {created_classrooms}")
        self.stdout.write(f"Subjects created: {created_subjects}")
        self.stdout.write(f"Class enrollments created/activated: {enrollment_count}")
        self.stdout.write(f"Subject enrollments created: {subject_enrollment_count}")
        self.stdout.write(f"Lectures created: {created_lectures}")

    def _ensure_teachers(self):
        created_count = 0
        teachers = list(
            UserProfile.objects.filter(
                role=UserProfile.Role.TEACHER,
                is_active=True,
            ).order_by("full_name")
        )

        if teachers:
            return teachers, created_count

        for item in DEMO_TEACHERS:
            teacher, created = UserProfile.objects.get_or_create(
                email=item["email"],
                defaults={
                    "auth_user_id": uuid.uuid4(),
                    "full_name": item["full_name"],
                    "role": UserProfile.Role.TEACHER,
                    "department": item["department"],
                    "semester": item["semester"],
                    "is_active": True,
                },
            )

            updates = []
            if teacher.role != UserProfile.Role.TEACHER:
                teacher.role = UserProfile.Role.TEACHER
                updates.append("role")
            if not teacher.is_active:
                teacher.is_active = True
                updates.append("is_active")
            if updates:
                updates.append("updated_at")
                teacher.save(update_fields=updates)

            if created:
                created_count += 1

        teachers = list(
            UserProfile.objects.filter(
                role=UserProfile.Role.TEACHER,
                is_active=True,
            ).order_by("full_name")
        )

        return teachers, created_count

    def _ensure_students(self):
        created_count = 0
        created_students = []

        for full_name, email, enrollment_number in DEMO_STUDENTS:
            student, created = UserProfile.objects.get_or_create(
                email=email,
                defaults={
                    "auth_user_id": uuid.uuid4(),
                    "full_name": full_name,
                    "role": UserProfile.Role.STUDENT,
                    "enrollment_number": enrollment_number,
                    "department": "CSE",
                    "semester": 4,
                    "is_active": True,
                },
            )

            updates = []
            if student.role != UserProfile.Role.STUDENT:
                student.role = UserProfile.Role.STUDENT
                updates.append("role")
            if not student.is_active:
                student.is_active = True
                updates.append("is_active")
            if updates:
                updates.append("updated_at")
                student.save(update_fields=updates)

            if created:
                created_count += 1
            created_students.append(student)

        # Return only the newly created demo students for enrollments
        return created_students, created_count

    def _ensure_classrooms(self, teachers):
        created_count = 0
        classroom_map = {}

        for index, item in enumerate(CLASSROOM_BLUEPRINT):
            advisor = teachers[index % len(teachers)] if teachers else None
            classroom, created = ClassRoom.objects.get_or_create(
                code=item["code"],
                defaults={
                    "name": item["name"],
                    "year": item["year"],
                    "section": item["section"],
                    "advisor": advisor,
                },
            )

            updates = []
            if classroom.name != item["name"]:
                classroom.name = item["name"]
                updates.append("name")
            if classroom.year != item["year"]:
                classroom.year = item["year"]
                updates.append("year")
            if classroom.section != item["section"]:
                classroom.section = item["section"]
                updates.append("section")
            if advisor and classroom.advisor_id != advisor.id:
                classroom.advisor = advisor
                updates.append("advisor")
            if updates:
                updates.append("updated_at")
                classroom.save(update_fields=updates)

            if created:
                created_count += 1

            classroom_map[item["code"]] = classroom

        return classroom_map, created_count

    def _ensure_subjects(self, classrooms, teachers):
        created_count = 0
        subject_map = {}

        for index, item in enumerate(SUBJECT_BLUEPRINT):
            teacher = teachers[index % len(teachers)] if teachers else None
            class_room = classrooms[item["class_code"]]

            subject, created = Subject.objects.get_or_create(
                code=item["code"],
                defaults={
                    "name": item["name"],
                    "class_room": class_room,
                    "teacher": teacher,
                    "credits": item["credits"],
                },
            )

            updates = []
            if subject.name != item["name"]:
                subject.name = item["name"]
                updates.append("name")
            if subject.class_room_id != class_room.id:
                subject.class_room = class_room
                updates.append("class_room")
            if teacher and subject.teacher_id != teacher.id:
                subject.teacher = teacher
                updates.append("teacher")
            if subject.credits != item["credits"]:
                subject.credits = item["credits"]
                updates.append("credits")
            if updates:
                updates.append("updated_at")
                subject.save(update_fields=updates)

            if created:
                created_count += 1

            subject_map.setdefault(class_room.id, []).append(subject)

        return subject_map, created_count

    def _ensure_enrollments(self, students, classrooms, subjects, academic_year):
        class_enrollment_changes = 0
        subject_enrollment_created = 0

        classroom_list = list(classrooms.values())
        if not classroom_list:
            return class_enrollment_changes, subject_enrollment_created

        for index, student in enumerate(students):
            class_room = classroom_list[index % len(classroom_list)]

            _, created = Enrollment.objects.update_or_create(
                student=student,
                class_room=class_room,
                academic_year=academic_year,
                defaults={"is_active": True},
            )
            if created:
                class_enrollment_changes += 1

            for subject in subjects.get(class_room.id, []):
                _, created_subject = SubjectEnrollment.objects.get_or_create(
                    student=student,
                    subject=subject,
                )
                if created_subject:
                    subject_enrollment_created += 1

        return class_enrollment_changes, subject_enrollment_created

    def _ensure_lectures(self, subjects, lectures_per_subject):
        created_count = 0
        today = timezone.localdate()

        for class_subjects in subjects.values():
            for subject in class_subjects:
                topics = TOPICS_BY_SUBJECT_CODE.get(subject.code, [f"{subject.name} lecture topic"])

                for step in range(lectures_per_subject):
                    lecture_date = today - timedelta(days=(lectures_per_subject - step))
                    topic = topics[step % len(topics)]

                    lecture, created = Lecture.objects.get_or_create(
                        subject=subject,
                        class_room=subject.class_room,
                        lecture_date=lecture_date,
                        lecture_number=1,
                        defaults={
                            "topic": topic,
                            "marked_by": subject.teacher,
                        },
                    )

                    updates = []
                    if not lecture.topic:
                        lecture.topic = topic
                        updates.append("topic")
                    if lecture.marked_by_id != subject.teacher_id:
                        lecture.marked_by = subject.teacher
                        updates.append("marked_by")
                    if updates:
                        updates.append("updated_at")
                        lecture.save(update_fields=updates)

                    if created:
                        created_count += 1

        return created_count
