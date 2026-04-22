from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttendanceRecordViewSet,
    AttendanceSummaryView,
    ClassRoomViewSet,
    DashboardStatsView,
    DefaulterListView,
    EnrollmentViewSet,
    LectureViewSet,
    MarkLectureAttendanceView,
    ProfileView,
    SubjectEnrollmentViewSet,
    SubjectViewSet,
    UserProfileViewSet,
)

router = DefaultRouter()
router.register("profiles", UserProfileViewSet, basename="profiles")
router.register("classrooms", ClassRoomViewSet, basename="classrooms")
router.register("subjects", SubjectViewSet, basename="subjects")
router.register("enrollments", EnrollmentViewSet, basename="enrollments")
router.register("subject-enrollments", SubjectEnrollmentViewSet, basename="subject-enrollments")
router.register("lectures", LectureViewSet, basename="lectures")
router.register("attendance-records", AttendanceRecordViewSet, basename="attendance-records")

urlpatterns = [
    path("auth/me/", ProfileView.as_view(), name="auth-me"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("attendance/summary/", AttendanceSummaryView.as_view(), name="attendance-summary"),
    path("attendance/defaulters/", DefaulterListView.as_view(), name="attendance-defaulters"),
    path(
        "lectures/<uuid:lecture_id>/mark-attendance/",
        MarkLectureAttendanceView.as_view(),
        name="mark-lecture-attendance",
    ),
    path("", include(router.urls)),
]