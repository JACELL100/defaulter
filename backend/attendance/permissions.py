from rest_framework.permissions import BasePermission

from .models import UserProfile


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == UserProfile.Role.ADMIN)


class IsTeacherRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == UserProfile.Role.TEACHER)


class IsStudentRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == UserProfile.Role.STUDENT)


class IsTeacherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.role in [UserProfile.Role.ADMIN, UserProfile.Role.TEACHER]
        )


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return bool(request.user)
        return bool(request.user and request.user.role == UserProfile.Role.ADMIN)